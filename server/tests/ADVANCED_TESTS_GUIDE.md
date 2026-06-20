# Advanced Test Suite Guide

4 comprehensive Jest/Supertest test templates for wiki_CPK MERN app. OAuth mocking, Redis/MongoDB concurrency, lyric schema boundaries, ReDoS/NoSQL injection fuzzing.

## Test Inventory

### Architecture (4 Core Suites)
```
server/tests/
├── integration/          # 12 files: auth, character, wiki, soundtrack, OAuth, sessions, socket-sync
├── unit/                 # 15 files: helpers, controllers, services, models, middleware
├── security/             # 2 files: fuzzing + enhancements
└── Playwright E2E        # client/e2e/: auth-flow, wiki-navigation
```

### Real Files (Quick Reference)
| Category | Files |
|----------|-------|
| **OAuth** | google-auth, discord-auth, twitter-auth, oauth-contract (integration × 4 + unit × 3) |
| **Sessions/Concurrency** | redis-session, redis-mongodb-concurrency (integration × 1 + unit × 1) |
| **Socket/Real-time** | socket-player-sync (integration × 1) |
| **Lyric Schema** | lyric-schema-boundary (unit) |
| **Security** | redos-nosql-fuzzing, security-enhancements (security × 2) |
| **Core Features** | auth, character, wiki, legal, soundtrack (integration + unit) |
| **E2E Flows** | auth-flow.spec.js, wiki-navigation.spec.js (Playwright, client/e2e/) |
| **Utilities** | middleware, helpers, models, errors, controllers (unit) |

## Quick Setup

### Install Dependencies

```bash
cd server
npm install --save-dev nock redis-mock
```

**Note:** For Redis testing, either use a test Redis instance (recommended for integration tests) or `redis-mock` for unit mocking.

### Run Tests

```bash
# Server tests (all)
cd server && npm test

# Server tests + coverage
npm test -- --coverage

# Specific suite (unit, integration, security)
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=security

# Specific test file
npm test -- auth.test.js

# Specific describe block
npm test -- --testNamePattern="OAuth Contract"

# E2E tests (client)
cd client && npm run test:e2e

# E2E headed mode (watch browser)
npm run test:e2e -- --headed

# All tests (full stack)
cd server && npm test && cd ../client && npm run test:e2e
```

## Suite Breakdown

### 1. OAuth Contract Testing (`oauth-contract.test.js`)

**Purpose:** Mock OAuth providers. Verify token exchange + profile normalization.

**Coverage:**
- Google, Discord, X (Twitter), GitHub token endpoints
- Profile payload normalization
- Account conflict detection (same email, different provider)
- OAuth linking to existing local accounts
- JWT token issuance post-OAuth
- Missing email edge case
- Network error handling

**Key Tests:**
- `should exchange auth code for tokens and normalize user profile`
- `should prevent account conflict when email already exists from different provider`
- `should handle profile endpoint returning empty data`
- `should link OAuth provider to existing local account`

**Dependencies:**
- `nock` (HTTP mocking)
- `jsonwebtoken` (JWT decode)

**Notes:**
- Each OAuth provider has separate test block
- Session + JWT lifecycle tested
- Conflict-prevention logic validated

### 2. Redis vs MongoDB Concurrency (`redis-mongodb-concurrency.test.js`)

**Purpose:** Simulate 50+ concurrent requests. Verify cache/DB sync.

**Coverage:**
- 5+ simultaneous JWT refresh requests
- Token reuse prevention
- Session invalidation sync (Redis ↔ MongoDB)
- Profile update race conditions
- Session TTL coherency
- Redis cache miss fallback
- Atomic debit operations (no lost updates)
- Update conflict resolution (last-write-wins)
- Connection pool exhaustion (50 concurrent)

**Key Tests:**
- `should handle 5 simultaneous refresh requests without race condition`
- `should serialize overlapping profile update requests`
- `should keep Redis and MongoDB in sync during rapid session state changes`
- `should not double-charge or lose data in concurrent payment/credit operations`
- `should gracefully handle high concurrency without connection pool exhaustion`

**Dependencies:**
- `redis` client + test DB

**Notes:**
- Uses `Promise.all()` for true concurrency
- Verifies final DB state consistency
- Redis TTL monitoring included

### 3. Lyric Schema Boundary (`lyric-schema-boundary.test.js`)

**Purpose:** Edge cases for nested LyricSchema (JP/Romaji/VN, timestamps).

**Coverage:**
- Overlapping timestamps (line 1 end > line 2 start)
- Reversed timestamps (startMs > endMs)
- Zero-duration lines
- Empty lyric arrays + empty language strings
- Null values in timestamps
- Negative & unreasonably large timestamps (>1 hour)
- Japanese kanji/hiragana/katakana + Vietnamese diacriticals
- Emoji rejection (optional)
- Very long lyric text (10KB)
- Per-language sync point variations
- Line count mismatches
- Sequential lineIndex validation (no gaps/duplicates)
- Whitespace normalization
- Bulk operations (10,000+ lines)

**Key Tests:**
- `should reject overlapping timestamps`
- `should reject reversed timestamps`
- `should handle Japanese kanji, hiragana, katakana`
- `should handle Vietnamese diacritical marks`
- `should handle 10,000 lyric lines without memory issues`
- `should reject lyric arrays exceeding max size`

**Zod Validators:**
- Custom `.refine()` for timestamp ordering
- `.trim()` + `.min(1)` for language fields
- `.max()` for size limits
- Regex for sequential lineIndex

### 4. ReDoS & NoSQL Injection Fuzzing (`redos-nosql-fuzzing.test.js`)

**Purpose:** Adversarial payloads test input sanitization.

**Coverage:**
- ReDoS patterns: `(a+)+b`, `.*@.*\..*`
- MongoDB operators: `$ne`, `$gt`, `$where`, `$function`, `$regex`
- SQL injection markers: `;`, `DROP`, `DELETE`
- LDAP injection: `*`, `)(uid=*)`
- Command injection: `$()`, backticks, `&`, `|`, `;`
- XXE (XML External Entity): `<!ENTITY>`
- URL encoding bypasses: `%24ne`, `%7B`
- Unicode homoglyphs (Cyrillic vs Latin)
- Null byte injection: `\x00`
- Type coercion attacks: `true` → `"true"`
- Prototype pollution: `__proto__`, `constructor`
- Billion laughs (deeply nested objects)
- Extremely long strings (100KB+)
- Malformed JSON

**Key Tests:**
- `should handle catastrophic backtracking in regex patterns without hanging`
- `should sanitize MongoDB query operators in user input`
- `should reject $where, $function operators`
- `should prevent NoSQL injection through nested object queries`
- `should handle extremely long input strings`
- `should reject LDAP injection attempts`
- `should sanitize query parameters`

**Sanitization Strategies:**
- `.regex()` for safe patterns
- `.refine()` custom rules
- String replacement to remove operators
- Strict type validation

### 5. End-to-End Testing (Playwright) (`client/e2e/`)

**Purpose:** Real browser; full user flows (auth → feature interaction).

**Coverage:**
- OAuth login flows (Google, Discord, X, GitHub)
- Wiki character navigation + search
- Session persistence + logout
- Error states + edge cases
- Page load performance

**Key Tests:**
- `auth-flow.spec.js`: OAuth redirect → callback → logged-in state
- `wiki-navigation.spec.js`: Browse characters, filter, pagination

**Run E2E Tests:**
```bash
cd client
npm run test:e2e

# Headed mode (see browser)
npm run test:e2e -- --headed

# Debug specific spec
npm run test:e2e -- wiki-navigation.spec.js --debug
```

**Notes:**
- Slower than unit/integration but validates full stack
- Requires dev server running or static build
- Complements server tests; catches integration gaps

## Database Lifecycle

### beforeAll
- Connect test app
- Connect Redis (concurrency suite)
- Create test user fixtures

### afterEach
- Clear test collections
- Flush Redis DB (concurrency suite)

### afterAll
- Delete test data
- Close connections

## Performance Expectations

| Suite | Duration | Tests | Notes |
|-------|----------|-------|-------|
| Unit (server) | ~3-5s | 50+ | Fastest; mocked dependencies |
| Integration | ~8-12s | 30+ | DB/Redis I/O + real OAuth mocks |
| Security | ~2-3s | 10+ | ReDoS + fuzzing payloads |
| **Server Total** | **~15-20s** | **90+** | npm test in server/ |
| E2E (Playwright) | ~20-30s | 2 flows | Headless browser; client/e2e/ |
| **Full Suite** | **~40-60s** | **100+** | npm test (server) + npm run test:e2e (client) |

## Integration with CI/CD

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  services:
    mongo:
      image: mongo:latest
    redis:
      image: redis:latest
  steps:
    - uses: actions/checkout@v3
    
    # Server tests
    - run: cd server && npm install && npm test -- --coverage
    - run: npm test -- --testPathPattern=security
    
    # E2E tests
    - run: cd client && npm install && npm run build
    - run: npx playwright install
    - run: npm run test:e2e
    
    # Upload coverage
    - uses: codecov/codecov-action@v3
      with:
        files: ./server/coverage/coverage-final.json
```

## Key Assertions

### OAuth Flow
```javascript
expect(response.body.user.provider).toBe('google');
expect(response.body).toHaveProperty('accessToken');
expect(response.status).toBe(409); // Conflict
```

### Concurrency
```javascript
expect(responses.every(r => r.status === 200)).toBe(true);
expect(finalUser.credits).toBe(50); // No race condition
expect(sessionAfter).toBeNull(); // Redis cleared
```

### Lyric Schema
```javascript
expect(() => validator.parse(malformed)).toThrow();
expect(result.lyrics[0].japanese).toBe('こんにちは');
```

### Fuzzing
```javascript
expect(elapsed).toBeLessThan(200); // No ReDoS hang
expect(() => validator.parse(injection)).toThrow();
expect(response.status).not.toBe(500); // Handled gracefully
```

## Troubleshooting

**Tests hang on concurrency suite:**
- Increase Jest timeout: `--testTimeout=30000`
- Check Redis connection: `redis-cli ping`

**OAuth mocks not working:**
- Ensure `nock` intercepts BEFORE requests
- Clear nock: `nock.cleanAll()`

**Lyric validation too strict:**
- Adjust `.max()` limits in schema
- Add `.optional()` for language fields

**ReDoS tests not catching vulnerabilities:**
- Reduce payload sizes
- Lower timeout threshold
- Use `--bail` to stop on first fail

**E2E tests timeout or fail to connect:**
- Ensure dev server running: `npm run dev` (client)
- Check Playwright binaries: `npx playwright install`
- Increase timeout in playwright.config.js: `timeout: 30000`
- Use `--headed` to debug interactively

**E2E OAuth mocks not intercepting:**
- Playwright doesn't use nock; requires real OAuth or mock API server
- Alternative: Stub frontend OAuth with test credentials

## Extending Tests

Add new OAuth provider:
```javascript
describe('TikTok OAuth', () => {
  nock('https://tiktok.com')
    .post('/v1/oauth/token')
    .reply(200, { access_token: 'token' });
  // ... test implementation
});
```

Add new ReDoS pattern:
```javascript
it('should handle pattern XYZ', () => {
  const start = Date.now();
  dangerousPattern.test(payload);
  expect(Date.now() - start).toBeLessThan(100);
});
```

## Best Practices

✅ Keep mocks isolated (nock cleanup in afterEach)
✅ Verify both success + error paths
✅ Test DB + cache consistency separately + together
✅ Use realistic payloads (not just null)
✅ Assert on exact values, not just truthiness
✅ Time security-critical operations
✅ Fuzz with random + known-bad payloads

## References

- [Jest Docs](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [nock](https://github.com/nock/nock)
- [Zod](https://zod.dev/)
- [OWASP Injection](https://owasp.org/www-community/attacks/injection)
- [ReDoS Prevention](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
