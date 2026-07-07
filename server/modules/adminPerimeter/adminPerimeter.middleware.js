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
  strikeRegistry,
  resolveIp,
} = require('./adminPerimeter');

const { logSecurityEvent } = require('../../utils/logger');

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

  if (strikeRegistry.has(ip)) {
    logSecurityEvent('PERIMETER_BLACKLIST_BLOCK', {
      ip,
      path: req.path,
      method: req.method,
      strikeAgeMs: Date.now() - strikeRegistry.get(ip),
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

  if (!strikeRegistry.has(ip)) {
    strikeRegistry.set(ip, Date.now());
  }

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

  // Commit to blacklist immediately — idempotent, existing entry is preserved
  if (!strikeRegistry.has(ip)) {
    strikeRegistry.set(ip, Date.now());
    logSecurityEvent('PERIMETER_TARPIT_ENTRY', {
      ip,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  // Begin the drip: chunked transfer keeps the connection alive.
  // Writing anything here implicitly starts the HTTP response — the client
  // cannot distinguish this from a slow legitimate server response.
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const MAX_HOLD_MS = 55_000; // 55 seconds — safe under 60-second proxy timeouts
  const startTime = Date.now();
  let dripsCount = 0;

  /**
   * Schedule the next drip with a uniformly random delay in [2_000, 5_000] ms.
   *
   * Each tick:
   *   1. Bail early if the client already closed the connection.
   *   2. Close cleanly if MAX_HOLD_MS has been reached.
   *   3. Otherwise drip a single space and recurse.
   */
  const scheduleDrip = () => {
    const delay = 2_000 + Math.floor(Math.random() * 3_000);

    setTimeout(() => {
      const elapsed = Date.now() - startTime;

      // Client disconnected (scanner timeout or user abort) — nothing to drip
      if (res.destroyed || req.socket.destroyed) {
        logSecurityEvent('PERIMETER_TARPIT_CLIENT_DROPPED', {
          ip,
          dripsCount,
          elapsedMs: elapsed,
        });
        return;
      }

      if (elapsed >= MAX_HOLD_MS) {
        // Max hold reached — end the response without revealing a status code
        logSecurityEvent('PERIMETER_TARPIT_EXIT', {
          ip,
          dripsCount,
          elapsedMs: elapsed,
          reason: 'max_hold_reached',
        });
        res.end();
        return;
      }

      res.write(' '); // single space to maintain TCP activity
      dripsCount++;
      scheduleDrip();
    }, delay);
  };

  // Kick off the drip loop — deliberately NOT calling next()
  scheduleDrip();
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
