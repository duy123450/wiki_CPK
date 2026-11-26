'use strict'

const { EventEmitter } = require('events')

const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z')

let perimeter
let middleware
let warnSpy
let activeTrapClosers = []

beforeAll(() => {
  perimeter = require('../../modules/adminPerimeter/adminPerimeter')
  middleware = require('../../modules/adminPerimeter/adminPerimeter.middleware')
})

beforeEach(() => {
  activeTrapClosers = []
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  for (const closeTrap of activeTrapClosers) closeTrap()
  for (const [ip, entry] of perimeter.strikeRegistry) {
    if (entry.activeTrap) perimeter.finalizeTrap(ip, entry)
  }
  perimeter.strikeRegistry.clear()
  jest.useRealTimers()
  warnSpy.mockRestore()
})

const createRequestResponse = (ip) => {
  const req = new EventEmitter()
  const socket = new EventEmitter()
  socket.destroyed = false
  socket.remoteAddress = ip
  socket.destroy = jest.fn()

  req.ip = ip
  req.path = '/wp-login.php'
  req.method = 'GET'
  req.headers = { 'user-agent': 'resource-bounds-test' }
  req.params = { token: 'invalid-token' }
  req.socket = socket

  const res = new EventEmitter()
  res.destroyed = false
  res.setHeader = jest.fn()
  res.write = jest.fn()
  res.end = jest.fn()
  res.sendStatus = jest.fn(function (status) {
    this.statusCode = status
    return this
  })

  return { req, res, socket }
}

const startTarpit = (req, res, next = jest.fn()) => {
  middleware.tarpitTrap(req, res, next)
  activeTrapClosers.push(() => req.socket.emit('close'))
}

const liveEntry = (now = Date.now()) => ({
  firstStrikeAt: now,
  expiresAt: now + perimeter.STRIKE_TTL_MS,
  activeTrap: false,
  frontGateLogged: false,
  suppressedCount: 0,
  lastSummaryAt: now,
})

describe('admin perimeter resource bounds', () => {
  it('reserves up to the active-trap cap and rejects the next request immediately', () => {
    for (let index = 0; index < perimeter.MAX_ACTIVE_TRAPS; index++) {
      const { req, res } = createRequestResponse(`192.0.2.${index}`)
      startTarpit(req, res)
    }

    const { req, res } = createRequestResponse('198.51.100.1')
    const next = jest.fn()
    startTarpit(req, res, next)

    expect(perimeter.getActiveTrapCount()).toBe(perimeter.MAX_ACTIVE_TRAPS)
    expect(res.sendStatus).toHaveBeenCalledWith(404)
    expect(res.setHeader).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('prevents a second trap for the same IP after both requests passed the front gate', () => {
    const first = createRequestResponse('192.0.2.10')
    const second = createRequestResponse('192.0.2.10')
    const firstGateNext = jest.fn()
    const secondGateNext = jest.fn()

    middleware.frontGateFilter(first.req, first.res, firstGateNext)
    middleware.frontGateFilter(second.req, second.res, secondGateNext)
    startTarpit(first.req, first.res)
    startTarpit(second.req, second.res)

    expect(firstGateNext).toHaveBeenCalledTimes(1)
    expect(secondGateNext).toHaveBeenCalledTimes(1)
    expect(perimeter.getActiveTrapCount()).toBe(1)
    expect(second.res.sendStatus).toHaveBeenCalledWith(404)
  })

  it('rejects registry-capacity admission without evicting live strikes', () => {
    for (let index = 0; index < perimeter.MAX_STRIKE_ENTRIES; index++) {
      perimeter.strikeRegistry.set(`live-${index}`, liveEntry())
    }
    const firstEntry = perimeter.strikeRegistry.get('live-0')
    const { req, res } = createRequestResponse('203.0.113.1')
    const next = jest.fn()

    startTarpit(req, res, next)

    expect(perimeter.strikeRegistry.size).toBe(perimeter.MAX_STRIKE_ENTRIES)
    expect(perimeter.strikeRegistry.get('live-0')).toBe(firstEntry)
    expect(perimeter.strikeRegistry.has('203.0.113.1')).toBe(false)
    expect(res.sendStatus).toHaveBeenCalledWith(404)
    expect(next).not.toHaveBeenCalled()
    expect(perimeter.getActiveTrapCount()).toBe(0)
  })

  it('reclaims expired inactive entries during bounded cleanup', () => {
    const now = Date.now()
    perimeter.strikeRegistry.set('expired', {
      ...liveEntry(now),
      expiresAt: now - 1,
      suppressedCount: 2,
    })

    const examined = perimeter.cleanupStrikeRegistry(now)

    expect(examined).toBe(1)
    expect(perimeter.strikeRegistry.has('expired')).toBe(false)
    expect(warnSpy).toHaveBeenCalledWith(
      '[SECURITY EVENT] PERIMETER_BLACKLIST_BLOCK_SUMMARY:',
      expect.objectContaining({ suppressedCount: 2, reason: 'expiry' })
    )
  })

  it('rotates retained entries without examining more than the batch', () => {
    const now = Date.now()
    for (let index = 0; index < perimeter.CLEANUP_BATCH_SIZE + 44; index++) {
      perimeter.strikeRegistry.set(`live-${index}`, liveEntry(now))
    }

    const examined = perimeter.cleanupStrikeRegistry(now)
    const keys = Array.from(perimeter.strikeRegistry.keys())

    expect(examined).toBe(perimeter.CLEANUP_BATCH_SIZE)
    expect(keys.slice(0, 44)).toEqual(
      Array.from({ length: 44 }, (_, index) => `live-${index + 256}`)
    )
    expect(keys.slice(44)).toEqual(
      Array.from({ length: 256 }, (_, index) => `live-${index}`)
    )
  })

  it('retains an expired active entry until finalization', () => {
    const ip = '192.0.2.20'
    const admission = perimeter.admitTrap(ip)
    admission.entry.expiresAt = Date.now() - 1

    perimeter.cleanupStrikeRegistry(Date.now())

    expect(perimeter.strikeRegistry.get(ip)).toBe(admission.entry)
    expect(perimeter.getActiveTrapCount()).toBe(1)

    perimeter.finalizeTrap(ip, admission.entry, Date.now())

    expect(perimeter.strikeRegistry.has(ip)).toBe(false)
    expect(perimeter.getActiveTrapCount()).toBe(0)
  })

  it.each([
    ['request abort', (req) => req.emit('aborted')],
    ['socket close', (_req, _res, socket) => socket.emit('close')],
    ['response close', (_req, res) => res.emit('close')],
    ['response finish', (_req, res) => res.emit('finish')],
    ['response error', (_req, res) => res.emit('error', new Error('response'))],
    ['socket error', (_req, _res, socket) => socket.emit('error', new Error('socket'))],
  ])('releases the reservation on %s', (_label, emitTerminalEvent) => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)
    const { req, res, socket } = createRequestResponse('192.0.2.30')
    startTarpit(req, res)

    emitTerminalEvent(req, res, socket)

    expect(perimeter.getActiveTrapCount()).toBe(0)
    expect(req.listenerCount('aborted')).toBe(0)
    expect(socket.listenerCount('close')).toBe(0)
    expect(socket.listenerCount('error')).toBe(0)
    expect(res.listenerCount('close')).toBe(0)
    expect(res.listenerCount('finish')).toBe(0)
    expect(res.listenerCount('error')).toBe(0)
    jest.advanceTimersByTime(10_000)
    expect(res.write).not.toHaveBeenCalled()
  })

  it('ends at the maximum hold and releases active capacity', () => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
    const { req, res } = createRequestResponse('192.0.2.40')

    try {
      startTarpit(req, res)
      jest.advanceTimersByTime(perimeter.MAX_TRAP_HOLD_MS)

      expect(res.end).toHaveBeenCalledTimes(1)
      expect(perimeter.getActiveTrapCount()).toBe(0)
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('finalizes idempotently and does not delete a newer entry for the same IP', () => {
    const ip = '192.0.2.50'
    const admission = perimeter.admitTrap(ip)
    const newerEntry = liveEntry()
    perimeter.strikeRegistry.set(ip, newerEntry)

    expect(perimeter.finalizeTrap(ip, admission.entry)).toBe(true)
    expect(perimeter.finalizeTrap(ip, admission.entry)).toBe(false)

    expect(perimeter.strikeRegistry.get(ip)).toBe(newerEntry)
    expect(perimeter.getActiveTrapCount()).toBe(0)
  })

  it('emits a suppression summary without another request arriving', () => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)

    try {
      let isolatedPerimeter
      let isolatedMiddleware
      jest.isolateModules(() => {
        isolatedPerimeter = require('../../modules/adminPerimeter/adminPerimeter')
        isolatedMiddleware = require('../../modules/adminPerimeter/adminPerimeter.middleware')
      })

      const ip = '192.0.2.60'
      const admission = isolatedPerimeter.admitTrap(ip)
      isolatedPerimeter.finalizeTrap(ip, admission.entry)
      const request = createRequestResponse(ip)

      isolatedMiddleware.frontGateFilter(request.req, request.res, jest.fn())
      isolatedMiddleware.frontGateFilter(request.req, request.res, jest.fn())
      isolatedMiddleware.frontGateFilter(request.req, request.res, jest.fn())

      expect(warnSpy).toHaveBeenCalledWith(
        '[SECURITY EVENT] PERIMETER_BLACKLIST_BLOCK:',
        expect.any(Object)
      )
      expect(admission.entry.suppressedCount).toBe(2)

      jest.advanceTimersByTime(isolatedPerimeter.LOG_SUPPRESSION_INTERVAL_MS)

      expect(warnSpy).toHaveBeenCalledWith(
        '[SECURITY EVENT] PERIMETER_BLACKLIST_BLOCK_SUMMARY:',
        expect.objectContaining({ ip, suppressedCount: 2, reason: 'interval' })
      )
      expect(admission.entry.expiresAt).toBeGreaterThan(Date.now())
      expect(isolatedPerimeter.getActiveTrapCount()).toBe(0)
    } finally {
      jest.clearAllTimers()
      jest.useRealTimers()
    }
  })

  it('fails closed on invalid MTD when active capacity is exhausted', () => {
    for (let index = 0; index < perimeter.MAX_ACTIVE_TRAPS; index++) {
      perimeter.admitTrap(`198.51.100.${index}`)
    }
    const { req, res } = createRequestResponse('203.0.113.10')
    req.params.token = 'invalid-token'
    req.path = '/soundtrack/cache/clear'
    req.method = 'POST'
    const next = jest.fn()

    middleware.checkDynamicRoute(req, res, next)

    expect(res.sendStatus).toHaveBeenCalledWith(404)
    expect(next).not.toHaveBeenCalled()
    expect(perimeter.getActiveTrapCount()).toBe(perimeter.MAX_ACTIVE_TRAPS)
  })
})
