# Security Review Summary

Reviewed the current `main` snapshot (`bf66c28`) using source, tests, configuration, documentation, and reachable Git history. This was a static, read-only review: no production services, credentials, or environment values were accessed; no penetration testing was performed.

The full source-cited architecture analysis is in [`docs/SECURITY_ARCHITECTURE_AUDIT.md`](docs/SECURITY_ARCHITECTURE_AUDIT.md).

## Findings

| # | Severity | File | Lines | Finding | Confidence |
|---|----------|------|-------|---------|------------|
| 1 | 🟠 HIGH | `server/server.js` | 163-179 | The earlier `/api/v1/admin` honeypot prefix mount catches descendants before the later rolling-token route. The valid MTD path is therefore tar-pitted; the later handler is only a placeholder and has no authentication/RBAC. | 10/10 |
| 2 | 🟠 HIGH | `server/modules/adminPerimeter/adminPerimeter.middleware.js` | 130-198 | Tarpit requests can hold server connections for up to 55 seconds with no active-trap/concurrency cap. The strike Map also has no size cap, and a single strike blocks all later routes from that IP. | 9/10 |
| 3 | 🟡 MEDIUM | `server/modules/auth/auth.service.js` | 318-351 | Refresh verifies and reuses the same refresh token, returning only a new access token. Refresh-token reuse is not detected by rotation. | 9/10 |
| 4 | 🟡 MEDIUM | `client/src/services/api.js`; `server/middleware/csrf.js` | 17-30; 23-43 | Server requires a matching CSRF cookie/header on unsafe requests, but the client wrapper does not explicitly send that header. With separate frontend/API origins, the host-only API cookie is not available to frontend JavaScript. | 8/10 (deployment-dependent) |
| 5 | 🟡 MEDIUM | `server/modules/adminPerimeter/adminPerimeter.js` | 145-156 | Strike state is process-local and cleared on restart or by a wholesale 24-hour sweep. It does not propagate across server instances. | 9/10 |
| 6 | 🟡 MEDIUM | `server/server.js`; IP-based middleware | 145; see limiter/perimeter modules | `trust proxy` is fixed at one hop, while rate limiting and perimeter behavior rely on `req.ip`. Correctness depends on the production ingress chain matching that assumption. | 7/10 (configuration-dependent) |
| 7 | ⚪ LOW | `server/middleware/error-handler.js` | 3-49 | Generic errors can return their raw message; CastError responses include the submitted value. Error text may expose internal details. | 8/10 |

## Security Architecture Snapshot

- Implemented: Argon2 password hashing; HS256-only JWT verification; access-token JTI revocation in Redis; HttpOnly refresh cookie; OAuth state checks (and X PKCE); double-submit CSRF middleware; CORS allowlisting; Helmet headers; payload and upload size limits; auth/global/per-route rate limiting.
- Partially implemented: role middleware exists, but the generic guards are not wired into current admin CRUD routes. The soundtrack cache-clear endpoint has a route-local admin check and is open in development.
- MTD/tarpit: HMAC route derivation, three-window validation, bait paths, socket destruction, and randomized slow responses exist in source. The admin path is shadowed by the earlier honeypot mount; there is no real admin router, frontend route distribution, persistence, resource cap, or direct test coverage.
- Operational gaps: production proxy/TLS/network configuration and centralized log retention/alerting are not established by tracked deployment files. The CSRF browser integration needs an origin-compatible token transport.

## Documentation and Test Caveats

- `docs/security_defense.md` says the general limiter is 300/15 minutes; code configures 1000/15 minutes. It also describes API CSP/HSTS as if they necessarily cover the separately hosted frontend.
- The referenced `SECURITY_AUDIT_2026-06-19.md` is absent from the tracked tree. Sentry/CI scanning claims are not evidenced as implemented.
- `README.md` says access JWTs are in localStorage; the primary client token store is in memory. A legacy helper still reads a separate localStorage key.
- No tests were found for MTD routing, tarpit limits, proxy trust, cross-instance strike sharing, or client/server cross-origin CSRF. Existing CSRF tests use a standalone Express harness; fuzz tests largely exercise local schema/sanitizer examples.

This summary reports source evidence and conditional risks; it does not assert that a production deployment has the same configuration as the repository.
