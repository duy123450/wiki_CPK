'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          ADMIN PERIMETER — Moving Target Defense Core Engine                 ║
 * ║                                                                              ║
 * ║  This file is the pure cryptographic + state engine. It has no Express       ║
 * ║  dependency and exports no middleware. All HTTP handler logic lives in       ║
 * ║  adminPerimeter.middleware.js, which imports from here.                      ║
 * ║                                                                              ║
 * ║  Exports:                                                                    ║
 * ║    · validateWindowToken   — tests a candidate against t-1 / t / t+1         ║
 * ║    · getCurrentAdminPath   — returns the live admin URL + ms to expiry       ║
 * ║    · strikeRegistry        — the shared Map consumed by middleware           ║
 * ║    · resolveIp             — real-IP helper (trust proxy aware)              ║
 * ║    · HONEYPOT_PATHS        — array of bait paths for app.use() mounting      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const crypto = require('crypto');
const { logSecurityEvent } = require('../../utils/logger');

// ─── 0. Fail-fast on missing entropy source ──────────────────────────────────
//
// ADMIN_SECRET_PEPPER is the root secret from which every rolling route token
// is derived. Without it the entire MTD engine is meaningless — crash early
// rather than silently degrading to a predictable route.
//
const PEPPER = process.env.ADMIN_SECRET_PEPPER;
if (!PEPPER || PEPPER.length < 32) {
  throw new Error(
    '[AdminPerimeter] ADMIN_SECRET_PEPPER is missing or too short (min 32 chars). ' +
    'Set it in your .env file before starting the server.'
  );
}

// ─── 1. MOVING TARGET ENGINE ─────────────────────────────────────────────────
//
// How the rolling token is derived:
//
//   window = Math.floor(Date.now() / 60_000)   <- current 60-second epoch block
//   token  = HMAC-SHA256( PEPPER, String(window) ).digest('hex')
//
// The URL segment the legitimate admin must visit is therefore:
//   /api/v1/admin/<token>
//
// This segment silently rotates every 60 seconds. An attacker who captures one
// URL from logs or network sniffing has at most 60 seconds before it expires.
//
// ── Race-condition mitigation: three-step validation window ─────────────────
//
// Real-world clock drift, DNS propagation latency, TLS handshake overhead, and
// reverse-proxy buffering (Cloudflare, Render, Nginx) can all introduce several
// seconds of skew between when the admin clicks a link and when the request
// lands at this middleware. A single-window validation would cause legitimate
// requests to fail at window boundaries.
//
// Solution: test t-1, t, and t+1 in sequence.
//
//   t-1 covers: admin clicked the link in the last seconds of the *previous*
//               window and the request arrived in the *current* window.
//
//   t   covers: the happy path — request and server agree on the same window.
//
//   t+1 covers: the server's clock is slightly behind, OR the link was
//               pre-generated one epoch ahead (e.g. server restart timing).
//
// Allowing t+1 does not meaningfully extend the attack surface because the
// attacker would need to *predict* a future HMAC output, which is computationally
// infeasible for any secret with sufficient entropy.
//

/**
 * Compute the HMAC-SHA256 token for a given 60-second epoch window index.
 * Private — not exported. Only validateWindowToken and getCurrentAdminPath use it.
 *
 * @param {number} windowIndex  - Integer: Math.floor(Date.now() / 60_000) +/- offset
 * @returns {string}            - Lowercase hex string (URL-safe: chars 0-9, a-f only)
 */
function computeWindowToken(windowIndex) {
  return crypto
    .createHmac('sha256', PEPPER)
    .update(String(windowIndex))
    .digest('hex');
}

/**
 * Validate a candidate route segment against the three active time windows.
 *
 * Returns the matching window offset (-1, 0, or +1) for diagnostic logging,
 * or `null` if the candidate does not match any window.
 *
 * @param {string} candidate  - The URL path segment to test
 * @returns {number|null}
 */
function validateWindowToken(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;

  const now = Math.floor(Date.now() / 60_000);

  for (const offset of [-1, 0, 1]) {
    const expected = computeWindowToken(now + offset);

    // Constant-time comparison prevents timing-oracle attacks where an attacker
    // probes character-by-character to infer partial token values.
    if (
      candidate.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))
    ) {
      return offset; // matched — offset tells us which window
    }
  }

  return null; // no match — invalid or expired
}

/**
 * Generate the current valid admin route path.
 * Call this from server startup or an internal health monitor.
 *
 * @returns {{ path: string, expiresInMs: number }}
 */
function getCurrentAdminPath() {
  const now = Date.now();
  const windowIndex = Math.floor(now / 60_000);
  const token = computeWindowToken(windowIndex);
  const msUntilNextWindow = 60_000 - (now % 60_000);
  return {
    path: `/api/v1/admin/${token}`,
    expiresInMs: msUntilNextWindow,
  };
}

// ─── 2. ONE-STRIKE BLACKLIST — Private Registry Scope ───────────────────────
//
// This Map lives entirely inside module scope. The middleware file closes over
// it via the shared module reference — nothing outside this domain can read or
// mutate it directly.
//
// Memory-safety guarantee:
//   A setInterval sweeps the entire registry every 24 hours. A blacklisted IP
//   could retry after the flush — but the tarpit will immediately re-register
//   it on next contact. Reduce SWEEP_INTERVAL_MS for a more aggressive posture.
//

/** @type {Map<string, number>} IP -> UNIX timestamp (ms) of first offense */
const strikeRegistry = new Map();

const SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Non-blocking — unref() lets the event loop exit cleanly during shutdown/tests.
setInterval(() => {
  const count = strikeRegistry.size;
  strikeRegistry.clear();
  logSecurityEvent('PERIMETER_BLACKLIST_SWEEP', {
    flushedEntries: count,
    nextSweepIn: `${SWEEP_INTERVAL_MS / 3_600_000}h`,
  });
}, SWEEP_INTERVAL_MS).unref();

// ─── 3. HELPERS ──────────────────────────────────────────────────────────────

/**
 * Resolve the real client IP, respecting `trust proxy` settings.
 * Falls back gracefully when socket info is unavailable (e.g. test mocks).
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
function resolveIp(req) {
  return (
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// ─── 4. HONEYPOT BAIT ROUTES ─────────────────────────────────────────────────
//
// Paths that no legitimate user of this API would ever visit. They are
// exclusively crawled by vulnerability scanners, bots, and opportunistic
// attackers. Exported as an Array so server.js can pass it directly to
// app.use() without touching the internal Set.
//

const HONEYPOT_PATHS = new Set([
  // WordPress honeypots — most common scanner targets
  '/wp-admin',
  '/wp-login.php',
  '/wordpress/wp-admin',
  '/wp-content',
  '/wp-includes',

  // Generic admin panels
  '/admin',
  '/admin/',
  '/administrator',
  '/phpmyadmin',
  '/pma',

  // Common credential endpoints
  '/login',
  '/signin',
  '/dashboard',
  '/panel',
  '/cpanel',
  '/webmail',

  // Framework-specific scanner targets
  '/.env',
  '/.git/config',
  '/config.php',
  '/setup.php',
  '/install.php',
  '/xmlrpc.php',

  // Shell/RCE probes
  '/shell',
  '/cmd',
  '/cgi-bin/luci',
  '/actuator',
  '/actuator/env',

  // API scanner probes
  '/api/v1/admin',  // bare admin prefix without a valid token
  '/api/admin',
  '/v1/admin',
]);

// ─── 5. EXPORTS ──────────────────────────────────────────────────────────────

module.exports = {
  /** Tests a candidate token against the t-1 / t / t+1 windows. */
  validateWindowToken,

  /** Returns the live admin URL and milliseconds until it next rotates. */
  getCurrentAdminPath,

  /**
   * The strike registry Map — shared reference consumed by the middleware file.
   * Exposed deliberately so both files share one authoritative state store.
   * Do not re-export or leak this reference further up the call stack.
   */
  strikeRegistry,

  /** Real-IP resolver — proxy-aware, test-safe. */
  resolveIp,

  /** Array of bait paths ready to pass directly to app.use(). */
  HONEYPOT_PATHS: Array.from(HONEYPOT_PATHS),
};
