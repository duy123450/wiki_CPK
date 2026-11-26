import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '../../services/api'
import { useRefreshData } from '../../hooks/useRefreshData'

const mockDispatch = vi.fn()

vi.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}))

vi.mock('../../services/tokenStore', () => ({
  getAccessToken: () => 'admin-access-token',
}))

describe('useRefreshData server cache clearing', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('requires an explicit MTD token argument or null when MTD is disabled', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useRefreshData())

    await expect(result.current.clearServerCache()).rejects.toThrow(
      'Provide the MTD token, or null when MTD is disabled'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses the caller-provided token in the Admin API URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useRefreshData())

    await result.current.clearServerCache('active-mtd-token')

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL.replace(/\/wiki\/?$/, '/admin')}/active-mtd-token/soundtrack/cache/clear`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-access-token',
        }),
      })
    )
  })

  it('uses the non-MTD Admin URL when passed null', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const { result } = renderHook(() => useRefreshData())

    await result.current.clearServerCache(null)

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL.replace(/\/wiki\/?$/, '/admin')}/soundtrack/cache/clear`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-access-token',
          'X-XSRF-TOKEN': 'csrf-token',
        }),
      })
    )
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
  })
})
