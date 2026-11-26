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

// ─── 0. Optional MTD entropy source ──────────────────────────────────────────
//
// ADMIN_SECRET_PEPPER is the root secret from which every rolling route token
// is derived. Its absence disables only MTD; authentication and RBAC remain
// mandatory. A configured but weak pepper is a startup error.
//
const PEPPER = process.env.ADMIN_SECRET_PEPPER;
const MTD_ENABLED = Boolean(PEPPER);
if (MTD_ENABLED && PEPPER.length < 32) {
  throw new Error(
    '[AdminPerimeter] ADMIN_SECRET_PEPPER is too short (min 32 chars). ' +
    'Use a longer value or remove it to disable MTD.'
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
// This segment rotates every 60 seconds. Validation accepts adjacent buckets,
// so the current token remains valid through the following 60-second bucket.
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
  if (
    !MTD_ENABLED ||
    typeof candidate !== 'string' ||
    candidate.length !== 64 ||
    !/^[0-9a-f]{64}$/.test(candidate)
  ) {
    return null;
  }

  const now = Math.floor(Date.now() / 60_000);

  for (const offset of [-1, 0, 1]) {
    const expected = computeWindowToken(now + offset);

    // Constant-time comparison prevents timing-oracle attacks where an attacker
    // probes character-by-character to infer partial token values.
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))) {
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
  if (!MTD_ENABLED) {
    throw new Error('[AdminPerimeter] MTD is disabled because ADMIN_SECRET_PEPPER is unset.');
  }

  const now = Date.now();
  const windowIndex = Math.floor(now / 60_000);
  const token = computeWindowToken(windowIndex);
  const msUntilNextWindow = 60_000 - (now % 60_000);
  const msUntilTokenExpires = msUntilNextWindow + 60_000;
  return {
    path: `/api/v1/admin/${token}`,
    expiresInMs: msUntilTokenExpires,
  };
}

// ─── 2. ONE-STRIKE BLACKLIST — Private Registry Scope ───────────────────────

const MAX_ACTIVE_TRAPS = 100;
const MAX_STRIKE_ENTRIES = 10_000;
const STRIKE_TTL_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 1_000;
const CLEANUP_BATCH_SIZE = 256;
const LOG_SUPPRESSION_INTERVAL_MS = 60_000;
const MAX_TRAP_HOLD_MS = 55_000;

/** @type {Map<string, StrikeEntry>} IP -> strike and trap state */
const strikeRegistry = new Map();
let activeTrapCount = 0;

/**
 * @typedef {object} StrikeEntry
 * @property {number} firstStrikeAt
 * @property {number} expiresAt
 * @property {boolean} activeTrap
 * @property {boolean} frontGateLogged
 * @property {number} suppressedCount
 * @property {number} lastSummaryAt
 */

const createStrikeEntry = (now) => ({
  firstStrikeAt: now,
  expiresAt: now + STRIKE_TTL_MS,
  activeTrap: false,
  frontGateLogged: false,
  suppressedCount: 0,
  lastSummaryAt: now,
});

const emitPendingSummary = (ip, entry, now, reason) => {
  if (entry.suppressedCount > 0) {
    logSecurityEvent('PERIMETER_BLACKLIST_BLOCK_SUMMARY', {
      ip,
      suppressedCount: entry.suppressedCount,
      intervalMs: LOG_SUPPRESSION_INTERVAL_MS,
      strikeAgeMs: now - entry.firstStrikeAt,
      reason,
    });
    entry.suppressedCount = 0;
  }

  entry.lastSummaryAt = now;
};

const emitDueSummaryIfAny = (ip, entry, now) => {
  if (now - entry.lastSummaryAt >= LOG_SUPPRESSION_INTERVAL_MS) {
    emitPendingSummary(ip, entry, now, 'interval');
  }
};

const removeExpiredEntry = (ip, entry, now) => {
  emitPendingSummary(ip, entry, now, 'expiry');
  if (strikeRegistry.get(ip) === entry) {
    strikeRegistry.delete(ip);
  }
};

/**
 * Process a bounded number of entries. Retained entries rotate to the Map tail,
 * so a fresh iterator always starts at the next unexamined entry.
 *
 * @param {number} [now]
 * @returns {number} Number of entries examined.
 */
function cleanupStrikeRegistry(now = Date.now()) {
  const budget = Math.min(CLEANUP_BATCH_SIZE, strikeRegistry.size);
  let examined = 0;

  for (; examined < budget; examined++) {
    const first = strikeRegistry.keys().next();
    if (first.done) break;

    const ip = first.value;
    const entry = strikeRegistry.get(ip);

    if (entry.expiresAt <= now && !entry.activeTrap) {
      removeExpiredEntry(ip, entry, now);
      continue;
    }

    emitDueSummaryIfAny(ip, entry, now);
    strikeRegistry.delete(ip);
    strikeRegistry.set(ip, entry);
  }

  return examined;
}

// Keep cleanup bounded and independent of request traffic.
setInterval(() => cleanupStrikeRegistry(), CLEANUP_INTERVAL_MS).unref();

/**
 * Check whether an IP is still struck, lazily reclaiming its expired entry.
 *
 * @param {string} ip
 * @param {number} [now]
 * @returns {boolean}
 */
function isStruck(ip, now = Date.now()) {
  const entry = strikeRegistry.get(ip);
  if (!entry) return false;

  if (entry.activeTrap || entry.expiresAt > now) {
    return true;
  }

  removeExpiredEntry(ip, entry, now);
  return false;
}

/**
 * Record a front-gate block, logging the first event and suppressing repeats.
 *
 * @param {string} ip
 * @param {{ path: string, method: string }} details
 * @param {number} [now]
 */
function recordFrontGateBlock(ip, details, now = Date.now()) {
  const entry = strikeRegistry.get(ip);
  if (!entry) return;

  if (!entry.frontGateLogged) {
    entry.frontGateLogged = true;
    entry.lastSummaryAt = now;
    logSecurityEvent('PERIMETER_BLACKLIST_BLOCK', {
      ip,
      ...details,
      strikeAgeMs: now - entry.firstStrikeAt,
    });
    return;
  }

  emitDueSummaryIfAny(ip, entry, now);
  entry.suppressedCount++;
}

/**
 * Record a strike and reserve a trap slot without yielding.
 *
 * @param {string} ip
 * @param {number} [now]
 * @returns {{ status: 'reserved'|'already_struck'|'active_capacity'|'registry_capacity', entry?: StrikeEntry, created?: boolean }}
 */
function admitTrap(ip, now = Date.now()) {
  if (isStruck(ip, now)) {
    return { status: 'already_struck', entry: strikeRegistry.get(ip) };
  }

  if (strikeRegistry.size >= MAX_STRIKE_ENTRIES) {
    return { status: 'registry_capacity' };
  }

  const entry = createStrikeEntry(now);
  strikeRegistry.set(ip, entry);

  if (activeTrapCount >= MAX_ACTIVE_TRAPS) {
    return { status: 'active_capacity', entry, created: true };
  }

  entry.activeTrap = true;
  activeTrapCount++;
  return { status: 'reserved', entry, created: true };
}

/**
 * Release an active trap exactly once and reclaim its expired entry if it is
 * still the registry value for this IP.
 *
 * @param {string} ip
 * @param {StrikeEntry} entry
 * @param {number} [now]
 * @returns {boolean} Whether this call finalized an active trap.
 */
function finalizeTrap(ip, entry, now = Date.now()) {
  if (!entry.activeTrap) return false;
  if (activeTrapCount <= 0) {
    throw new Error('[AdminPerimeter] Active trap count invariant violated.');
  }

  entry.activeTrap = false;
  activeTrapCount--;

  if (entry.expiresAt <= now && strikeRegistry.get(ip) === entry) {
    removeExpiredEntry(ip, entry, now);
  }

  return true;
}

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
  /** Whether a valid ADMIN_SECRET_PEPPER enables the optional MTD gate. */
  MTD_ENABLED,

  /** Tests a candidate token against the t-1 / t / t+1 windows. */
  validateWindowToken,

  /** Returns the live admin URL and milliseconds until it next rotates. */
  getCurrentAdminPath,

  /** Process-local strike registry, shared with the perimeter middleware. */
  strikeRegistry,

  /** Registry admission and lifecycle helpers. */
  admitTrap,
  cleanupStrikeRegistry,
  finalizeTrap,
  isStruck,
  recordFrontGateBlock,

  /** Internal resource limits, exported for focused integration coverage. */
  MAX_ACTIVE_TRAPS,
  MAX_STRIKE_ENTRIES,
  STRIKE_TTL_MS,
  CLEANUP_INTERVAL_MS,
  CLEANUP_BATCH_SIZE,
  LOG_SUPPRESSION_INTERVAL_MS,
  MAX_TRAP_HOLD_MS,

  /** Read-only view of process-local active trap reservations. */
  getActiveTrapCount: () => activeTrapCount,

  /** Real-IP resolver — proxy-aware, test-safe. */
  resolveIp,

  /** Array of bait paths ready to pass directly to app.use(). */
  HONEYPOT_PATHS: Array.from(HONEYPOT_PATHS),
};
