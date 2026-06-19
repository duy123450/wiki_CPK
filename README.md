# Wiki CPK (Chou Kaguya Hime)

🎬 **Personal full-stack project.** A MERN wiki for "Chou Kaguya Hime" — built solo to explore modern web dev (React, Node, MongoDB, real-time socket.io, OAuth, multimedia integration).

## 🤔 Why?

Solo passion project to:
- **Learn full-stack**: React (frontend) + Express (backend) + MongoDB + real-time updates
- **Build for fun**: Organize character/movie/music data for a series I love
- **Experiment**: JWT auth, OAuth, synchronized lyrics, YouTube integration, Docker, deployment
- **Polish skills**: Testing (Jest, Vitest, Playwright), error handling, security (rate limiting, input sanitization), modular architecture

No deadline. No team. Just code, ship, iterate. 🚀

## 📖 Table of Contents

- [🚀 What's In Here](#-whats-in-here)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [📦 Installation](#-installation)
- [🏃 Running the Application](#-running-the-application)
- [📡 API Overview](#-api-overview)
- [🧪 Testing](#-testing)
- [📂 Project Structure](#-project-structure)
- [🔑 Key Concepts](#-key-concepts)
- [📜 License](#-license)

## 🚀 What's In Here

- **Wiki Management:** Characters, movies, categories, soundtracks, legal docs—all queryable and filterable.
- **Authentication:**
  - Local: Email + Argon2-hashed password
  - OAuth: Google, X (Twitter), Discord, GitHub (all optional)
  - JWT tokens (15m access, 30d refresh)
  - Role-based access control (RBAC) for admin routes
- **Real-time Updates:** Live user counter + socket.io
- **Music Player:** YouTube iframe, shuffle/loop, timeline control
- **Synchronized Lyrics:** Millisecond-precise lyrics highlight + auto-scroll (Japanese, Romaji, Vietnamese)
- **Responsive UI:** React + CSS
- **Solid fundamentals:** Zod validation, rate limiting, input sanitization, custom error classes, 352+ tests

## 🛠️ Tech Stack

**Frontend:** React (Vite) | RTK | React Hook Form | Lucide React | Socket.io-client | React Router DOM | Axios | Zod | Vitest/RTL | Playwright (E2E)

**Backend:** Node.js | Express | MongoDB (Mongoose) | Redis | Zod | Socket.io | Passport.js | Argon2/JWT/Helmet/CORS | Multer/Cloudinary | Jest/Supertest

## 🏗️ Architecture

**High-Level Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                       │
│  React (Vite) + RTK + React Router + Socket.io-client           │
│  - Auth: JWT tokens stored in localStorage                      │
│  - Real-time: User counter, live indicators via Socket.io       │
│  - UI: Components in /src/components, Pages in /src/pages       │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP + WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                     Express API (Backend)                       │
│  Node.js + Express + Socket.io + Passport.js                    │
│  - Routes: /api/v1/wiki/* (wiki, auth, characters, etc.)        │
│  - Auth: JWT + OAuth (Google, X, Discord, GitHub)               │
│  - Rate Limiting: Leaky bucket middleware (Redis)               │
│  - Middleware: Auth, RBAC, validation, error handling           │
│  - Modules: Modular by domain (auth/, wiki/, characters/, etc.) │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Mongoose ODM
┌─────────────────────────────────────────────────────────────────┐
│                  MongoDB (Data Layer)                           │
│  - Collections: users, characters, movies, soundtracks, etc.    │
│  - Relationships: Nested schemas (e.g., lyrics in soundtracks)  │
│  - Indexes: Optimized for queries and sorting                   │
└─────────────────────────────────────────────────────────────────┘

Optional Services:
- Redis: Session storage + rate-limiting cache
- Cloudinary: Image hosting & CDN
- OAuth Providers: Google, X (Twitter), Discord, GitHub
- YouTube API: Soundtrack playback (iframe)
```

**Request-Response Cycle:**

```
User Action → React Component → Axios HTTP → Express Route
  ↓                                                ↓
Validation (Zod) ← ← ← ← ← ← ← ← ← ← ← ← ← ← Error Handler
  ↓
Middleware (Auth, RBAC, Rate Limit)
  ↓
Service (Business Logic) ← MongoDB Query
  ↓
Controller (Format Response)
  ↓
JSON Response → React State (Redux/Context) → Re-render
```

---

## 📦 Installation

**Prerequisites:** Node.js 16+, MongoDB (local or Atlas)

**Optional:** Redis (for sessions), Cloudinary (image hosting), OAuth keys

App works without them — just configure `.env` and run.

### 1. Clone

```bash
git clone <repository-url>
cd wiki_CPK
```

### 2. Backend

```bash
cd server
npm install
```

`.env` config:

```env
# ─── Core ────────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
FRONTEND_URL=http://localhost:5173

# ─── Redis (optional) ────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Session & JWT ───────────────────────────────────────────────────────────
SESSION_SECRET=your_session_secret
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_LIFETIME=15m
JWT_REFRESH_LIFETIME=30d

# ─── Cloudinary ──────────────────────────────────────────────────────────────
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret

# ─── Google OAuth (optional) ─────────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/wiki/auth/google/callback

# ─── X (Twitter) OAuth (optional) ────────────────────────────────────────────
X_LOCAL_CLIENT_ID=your_x_local_id
X_LOCAL_CLIENT_SECRET=your_x_local_secret
X_LOCAL_CALLBACK_URL=http://127.0.0.1:3000/api/v1/wiki/auth/x/callback
# X_PROD_CLIENT_ID=your_x_prod_client_id
# X_PROD_CLIENT_SECRET=your_x_prod_client_secret
# X_PROD_CALLBACK_URL=https://yourdomain.com/api/v1/wiki/auth/x/callback

# ─── Discord OAuth (optional) ────────────────────────────────────────────────
DISCORD_CLIENT_ID=your_discord_id
DISCORD_CLIENT_SECRET=your_discord_secret
DISCORD_LOCAL_CALLBACK_URL=http://localhost:3000/api/v1/wiki/auth/discord/callback
# DISCORD_PROD_CLIENT_ID=your_discord_prod_client_id
# DISCORD_PROD_CLIENT_SECRET=your_discord_prod_client_secret
# DISCORD_PROD_CALLBACK_URL=https://yourdomain.com/api/v1/wiki/auth/discord/callback

# ─── GitHub OAuth (optional) ─────────────────────────────────────────────────
GITHUB_LOCAL_CLIENT_ID=your_github_local_id
GITHUB_LOCAL_CLIENT_SECRET=your_github_local_secret
GITHUB_LOCAL_CALLBACK_URL=http://localhost:3000/api/v1/wiki/auth/github/callback
# GITHUB_PROD_CLIENT_ID=your_github_prod_id
# GITHUB_PROD_CLIENT_SECRET=your_github_prod_secret
# GITHUB_PROD_CALLBACK_URL=https://yourdomain.com/api/v1/wiki/auth/github/callback
```

### 3. Frontend

```bash
cd ../client
npm install
```

`.env` config:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1/wiki
VITE_AUTH_TOKEN_KEY=cpkAuthToken
VITE_DRAGON_ENABLED_KEY=cpkDragonCursorEnabled
VITE_OPEN_CATEGORY_COOKIE=cpkSidebarOpenCategory
```

## 🏃 Running the Application

**Backend:** `cd server && npm run dev`

**Frontend:** `cd client && npm run dev`

## 📡 API Overview

All endpoints are prefixed with `/api/v1/wiki`. See [server/modules/](server/modules/) for full route definitions.

| Module                | Endpoint                      | Methods | Description                                 |
| --------------------- | ----------------------------- | ------- | ------------------------------------------- |
| **Auth**        | `/auth/register`            | POST    | Register with email/password                |
|                       | `/auth/login`               | POST    | Login with email/password                   |
|                       | `/auth/logout`              | POST    | Logout (invalidate JWT)                     |
|                       | `/auth/{provider}`          | GET     | OAuth redirect (google/x/discord/github)    |
|                       | `/auth/{provider}/callback` | GET     | OAuth callback handler                      |
| **Characters**  | `/characters`               | GET     | List all characters (paginated, filterable) |
|                       | `/characters/{id}`          | GET     | Get character by ID                         |
|                       | `/characters`               | POST    | Create character (admin only)               |
|                       | `/characters/{id}`          | PATCH   | Update character (admin only)               |
|                       | `/characters/{id}`          | DELETE  | Delete character (admin only)               |
| **Wiki/Movies** | `/movies`                   | GET     | List all movies                             |
|                       | `/movies/{id}`              | GET     | Get movie details                           |
|                       | `/categories`               | GET     | List wiki categories                        |
| **Soundtracks** | `/soundtracks`              | GET     | List all soundtracks                        |
|                       | `/soundtracks/{id}`         | GET     | Get soundtrack + lyrics                     |
| **Legal**       | `/legal/{type}`             | GET     | Get legal document (tos, privacy, etc.)     |
|                       |                               |         | Query params:`?lang=en` or `?lang=vi`   |

**Headers:**

- `Authorization: Bearer {accessToken}` — Required for protected routes
- `Accept-Language: en` or `vi` — Optional language preference

**Response Format:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* payload */ }
}
```

---

## 🧪 Testing

**Backend:**

```bash
cd server
npm test                  # all tests
npm run test:unit         # unit tests only
npm run test:integration  # integration tests only
npm run test:coverage     # with coverage report
npm run test:serial       # run all tests serially (--runInBand)
```

**Frontend:**

```bash
cd client
npm test                  # Vitest (unit/component)
npm run test:coverage     # with coverage report
npm run test:e2e          # Playwright E2E
npm run test:e2e:ui       # Playwright with UI mode
npm run test:e2e:report   # show last Playwright report
```

## 📂 Project Structure

```plaintext
wiki_CPK/
├── client/              # React (Vite)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── config/      # Env config
│   │   ├── constants/   # Constants (roles, ui, api, etc)
│   │   ├── context/     # AuthContext state provider
│   │   ├── store/       # Redux (RTK)
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Pages
│   │   ├── schemas/     # Zod validation
│   │   ├── services/    # API (Axios)
│   │   ├── styles/      # CSS
│   │   ├── utils/       # Helpers
│   │   ├── workers/     # Web Workers
│   │   └── tests/       # Vitest
│   ├── e2e/             # Playwright E2E tests
│   └── public/          # Static assets
├── server/              # Express (Node.js)
│   ├── config/          # Config (Passport/DB/Cloudinary/Redis/Env)
│   ├── constants/       # Global constants (roles.js)
│   ├── errors/          # Error classes (CustomAPIError, AuthError, WikiError, etc.)
│   ├── middleware/      # Global middleware (authentication.js, authorizeRoles.js,
│   │                    #   optionalAuth.js, cache.js, leakyBucket.js,
│   │                    #   validateRequest.js, error-handler.js, etc.)
│   ├── modules/         # Domain modules
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.route.js
│   │   │   ├── auth.service.js
│   │   │   ├── user.model.js
│   │   │   └── strategies/  # Lazy OAuth strategies (google, twitter, discord, github)
│   │   ├── wiki/
│   │   │   ├── wiki.controller.js
│   │   │   ├── wiki.route.js
│   │   │   ├── wiki.service.js
│   │   │   └── models/      # category.model.js, movie.model.js, wiki-page.model.js
│   │   ├── characters/
│   │   │   ├── character.controller.js
│   │   │   ├── character.route.js
│   │   │   ├── character.service.js
│   │   │   ├── character.model.js
│   │   │   ├── character.constants.js
│   │   │   └── character.utils.js
│   │   ├── soundtrack/
│   │   │   ├── soundtrack.controller.js
│   │   │   ├── soundtrack.route.js
│   │   │   ├── soundtrack.service.js
│   │   │   └── sound-track.model.js
│   │   └── legal/
│   │       ├── legal.controller.js
│   │       ├── legal.route.js
│   │       ├── legal.service.js
│   │       └── legal-document.model.js
│   ├── schemas/         # Zod validation (auth, character, soundtrack, legal)
│   ├── scripts/         # Backup & utility scripts
│   ├── tests/           # Jest/Supertest (unit/, integration/, security/, utils/)
│   ├── utils/           # Helpers (logger.js, security.js)
│   └── server.js        # Entry point + Socket.io
└── README.md
```

## 🔑 Key Concepts

### Authentication & Security

- **Multi-factor OAuth:** Supports Google, X (Twitter), Discord, and GitHub out of the box. All providers are optional.
- **Argon2 Hashing:** Industry-standard password hashing for local accounts.
- **JWT Token Strategy:** Access tokens (15m) + Refresh tokens (30d) for secure, scalable authentication.
- **Role-Based Access Control (RBAC):** Granular permission management for protected routes.
- **Session Persistence:** Redis-backed sessions ensure user continuity across server restarts. App runs without Redis (degraded mode).
- **Hardened Security:** CSRF protection (Secure/Lax cookies), timing-safe token validations, XSS sanitization, leaky-bucket rate limiting, and structured security event logging.

### Content & Media

- **Synchronized Lyrics:** Real-time highlight + auto-scroll lyrics (Japanese/Romaji/Vietnamese) synced to millisecond precision.
- **Karaoke Support:** Nested MongoDB schemas enable line-by-line dual-language rendering.
- **YouTube Integration:** IFrame API for background playback, shuffle, loop modes, and timeline control.
- **Cloudinary Asset Management:** Secure image hosting with crop prevention and CDN delivery.

### Architecture

- **Domain-Driven Design:** Modular backend organized by feature (Auth, Wiki, Characters, Soundtrack, Legal).
- **Type-Safe Config:** Zod validation ensures all environment variables are correct at startup.
- **Real-time Updates:** Socket.io for live user counter and interactive features.
- **Input Sanitization:** Protection against ReDoS, NoSQL injection, and malformed payloads.
- **Error Hierarchy:** Structured error classes for consistent API responses (`CustomAPIError` → `AuthError`, `WikiError`, `BadRequestError`, `NotFoundError`, `ValidationError`, `UnauthenticatedError`, `UnauthorizedError`, `SoundtrackError`).

### Legal Documents

- **Version-Controlled Policies:** Each `LegalDocument` has `type`, `version`, `effectiveDate`, and `isPublished` fields enabling soft-update workflows without breaking live docs.
- **Dual-Locale (EN/VI):** Both `en` and `vi` locales stored in a single MongoDB document; the controller resolves the locale from `?lang=` query param first, then from `Accept-Language` header.
- **Leaky-Bucket Rate Limiting:** The `/api/v1/legal` route uses the same leaky bucket Redis middleware as the rest of the API for consistent rate-limiting behaviour.
- **Frontend Hook:** `useLegalDocument(type, lang)` resolves the backend URL dynamically from `VITE_API_BASE_URL` (strips `/api/v1/wiki` suffix), so it works in both dev proxy and production.

## 📜 License

Personal/educational. "Chou Kaguya Hime" content © respective owners.
