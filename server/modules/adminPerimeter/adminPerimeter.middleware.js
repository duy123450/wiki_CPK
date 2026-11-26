'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║        ADMIN PERIMETER — Express Middleware Suite                            ║
 * ║                                                                              ║
 * ║  This file owns all Express handler logic. It imports the pure engine        ║
 * ║  from adminPerimeter.js and wraps it in three middleware factories:          ║
 * ║                                                                              ║
 * ║    · frontGateFilter   — raw-socket kill for blacklisted IPs                 ║
 * ║    · checkDynamicRoute — validates the rolling HMAC-SHA256 route token       ║
 * ║    · tarpitTrap        — resource-exhaustion honeytrap for scanners          ║
 * ║                                                                              ║
 * ║  Consumed by server.js — nowhere else.                                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const {
  validateWindowToken,
  resolveIp,
  admitTrap,
  finalizeTrap: finalizeTrapReservation,
  isStruck,
  recordFrontGateBlock,
  MAX_TRAP_HOLD_MS,
} = require('./adminPerimeter');

const { logSecurityEvent } = require('../../utils/logger');
const redactAdminMtdToken = require('../../utils/redactAdminMtdToken');

// ─── MIDDLEWARE 1 — Front-Gate Filter (One-Strike Raw-Socket Killer) ─────────
//
// MUST be mounted at the absolute top of the global Express chain — before
// helmet, body parsers, CORS, rate-limiting, and everything else.
//
// If the incoming IP is present in the strikeRegistry:
//   · Destroy the underlying TCP socket immediately via req.socket.destroy()
//   · No HTTP status is written, no headers are sent, no body is allocated
//   · The client receives a connection-reset (ECONNRESET / ERR_CONNECTION_RESET)
//   · Express routing is completely bypassed — no middleware chain is entered
//
// The zero-allocation approach means a blacklisted IP costs the server almost
// nothing regardless of request volume.
//
const frontGateFilter = (req, _res, next) => {
  const ip = resolveIp(req);

  if (isStruck(ip)) {
    recordFrontGateBlock(ip, {
      path: redactAdminMtdToken(req.path),
      method: req.method,
    });

    // Raw socket destruction — no HTTP response is formed, no Express
    // middleware is invoked, no memory is allocated for routing.
    req.socket.destroy();
    return; // explicit early return — no next() call
  }

  next();
};

// ─── MIDDLEWARE 2 — Dynamic Route Validator (Moving Target Check) ─────────────
//
// Mount on the route that captures the token segment:
//   app.use('/api/v1/admin/:token', checkDynamicRoute, adminRouter)
//
// Extracts req.params.token, validates it against the three active time windows
// (t-1, t, t+1), then either:
//   · Passes control to next() when valid — attaches req.adminPerimeter metadata
//   · Delegates to tarpitTrap when invalid — blacklists the IP before doing so
//
const checkDynamicRoute = (req, res, next) => {
  const ip = resolveIp(req);
  const candidate = req.params.token;
  const matchedOffset = validateWindowToken(candidate);

  if (matchedOffset !== null) {
    // Valid token — attach diagnostic metadata for downstream audit logs
    req.adminPerimeter = { validated: true, windowOffset: matchedOffset };

    logSecurityEvent('PERIMETER_ADMIN_ACCESS', {
      ip,
      windowOffset: matchedOffset,
      path: req.path,
    });

    return next();
  }

  // Invalid or expired token — log, blacklist, and absorb into the tarpit.
  // Truncate candidate to 16 chars to avoid writing full forged tokens to logs.
  logSecurityEvent('PERIMETER_INVALID_TOKEN', {
    ip,
    candidatePrefix: candidate ? candidate.slice(0, 16) + '...' : '(empty)',
    path: req.path,
  });

  return tarpitTrap(req, res, next);
};

// ─── MIDDLEWARE 3 — Chronic Tarpit (Resource-Exhaustion Honeytrap) ────────────
//
// Mount on all honeypot bait paths:
//   app.use(HONEYPOT_PATHS, tarpitTrap)
//
// Instead of immediately rejecting the request, this handler holds the HTTP
// connection open for up to 55 seconds, dripping a single space character
// every 2-5 seconds (randomised interval).
//
// Why this works:
//   · Each trapped connection occupies a file descriptor and memory in the
//     attacker's TCP stack / scanner tool.
//   · Scanners have a finite connection pool. Fully occupying that pool with
//     slow responses prevents them from scanning other targets simultaneously.
//   · The 55-second ceiling stays under Cloudflare's 60-second idle timeout
//     and Render's similar proxy limits, preventing the CDN from cutting the
//     connection before we finish.
//
// Chaotic drip strategy:
//   · The delay between each drip is uniformly random in [2_000, 5_000] ms.
//   · Randomness prevents attackers from fingerprinting this server by
//     measuring response timing patterns.
//
// The IP is committed to the strikeRegistry before the tarpit starts, so any
// concurrent requests from the same IP are killed at Layer 1 (frontGateFilter)
// with zero overhead while this connection is still being held open.
//
const tarpitTrap = (req, res, _next) => {
  const ip = resolveIp(req);
  const admission = admitTrap(ip);

  if (admission.status !== 'reserved') {
    return res.sendStatus(404);
  }

  const entry = admission.entry;
  const startTime = Date.now();
  let dripsCount = 0;
  let timer = null;
  let finalized = false;
  const listeners = [];

  const removeListeners = () => {
    for (const [emitter, event, listener] of listeners) {
      emitter.removeListener?.(event, listener);
    }
    listeners.length = 0;
  };

  const finalize = () => {
    if (finalized) return;
    finalized = true;

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    removeListeners();
    finalizeTrapReservation(ip, entry);
  };

  const listenOnce = (emitter, event, listener) => {
    if (typeof emitter?.once !== 'function') return;
    emitter.once(event, listener);
    listeners.push([emitter, event, listener]);
  };

  const onClientDrop = () => {
    if (finalized) return;
    try {
      logSecurityEvent('PERIMETER_TARPIT_CLIENT_DROPPED', {
        ip,
        dripsCount,
        elapsedMs: Date.now() - startTime,
      });
    } finally {
      finalize();
    }
  };

  const onResponseError = (error) => {
    try {
      logSecurityEvent('PERIMETER_TARPIT_RESPONSE_ERROR', {
        ip,
        error: error?.code ?? error?.name ?? 'unknown',
      });
    } finally {
      finalize();
    }
  };

  const onSocketError = (error) => {
    try {
      logSecurityEvent('PERIMETER_TARPIT_SOCKET_ERROR', {
        ip,
        error: error?.code ?? error?.name ?? 'unknown',
      });
    } finally {
      finalize();
    }
  };

  listenOnce(req, 'aborted', onClientDrop);
  listenOnce(req.socket, 'close', onClientDrop);
  listenOnce(req.socket, 'error', onSocketError);
  listenOnce(res, 'close', onClientDrop);
  listenOnce(res, 'finish', finalize);
  listenOnce(res, 'error', onResponseError);

  const endAtMaximumHold = () => {
    try {
      logSecurityEvent('PERIMETER_TARPIT_EXIT', {
        ip,
        dripsCount,
        elapsedMs: Date.now() - startTime,
        reason: 'max_hold_reached',
      });
      res.end();
    } finally {
      finalize();
    }
  };

  const scheduleDrip = () => {
    if (finalized) return;

    const elapsed = Date.now() - startTime;
    const remaining = MAX_TRAP_HOLD_MS - elapsed;
    if (remaining <= 0) {
      endAtMaximumHold();
      return;
    }

    const randomDelay = 2_000 + Math.floor(Math.random() * 3_000);
    timer = setTimeout(() => {
      timer = null;
      if (finalized) return;

      const currentElapsed = Date.now() - startTime;
      if (res.destroyed || req.socket.destroyed) {
        onClientDrop();
        return;
      }

      if (currentElapsed >= MAX_TRAP_HOLD_MS) {
        endAtMaximumHold();
        return;
      }

      try {
        res.write(' ');
      } catch (error) {
        finalize();
        throw error;
      }
      dripsCount++;
      scheduleDrip();
    }, Math.min(randomDelay, remaining));
  };

  try {
    if (admission.created) {
      logSecurityEvent('PERIMETER_TARPIT_ENTRY', {
        ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'] ?? 'unknown',
      });
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    scheduleDrip();
  } catch (error) {
    finalize();
    throw error;
  }
};

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
  /**
   * Mount at the very top of the Express app — before helmet, parsers, CORS.
   * Instantly destroys TCP sockets from blacklisted IPs with zero HTTP overhead.
   */
  frontGateFilter,

  /**
   * Mount on the dynamic admin route segment.
   * Validates the rolling HMAC token; routes failures to tarpitTrap.
   *
   * Usage: app.use('/api/v1/admin/:token', checkDynamicRoute, adminRouter)
   */
  checkDynamicRoute,

  /**
   * Mount on all honeypot bait paths.
   * Holds connections open 55s, dripping randomised bytes, then blacklists the IP.
   *
   * Usage: app.use(HONEYPOT_PATHS, tarpitTrap)
   */
  tarpitTrap,
};
