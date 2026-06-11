# Wiki CPK (Chou Kaguya Hime)

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application—comprehensive wiki for "Chou Kaguya Hime" featuring character profiles, movie information, and an integrated music player with synchronized lyrics.

## 📖 Table of Contents

- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation](#-installation)
- [🏃 Running the Application](#-running-the-application)
- [🧪 Testing](#-testing)
- [📂 Project Structure](#-project-structure)
- [🔑 Key Concepts](#-key-concepts)
- [📜 License](#-license)

## 🚀 Features

- **Wiki Management:** Movies, characters, categories, soundtracks.
- **Advanced Authentication:**
  - Local login with **Argon2** hashing.
  - OAuth: **Google**, **X (Twitter)** (API v2), **Discord**.
  - Session management with **JWT** (Access/Refresh tokens) and **Redis** for session backing.
  - Account conflict prevention vs OAuth hijacking.
  - **RBAC:** Permission management for restricted routes.
- **Real-time Interaction:**
  - **Live User Counter:** Tracks connected clients via **Socket.io**.
  - Interactive UI + live indicators.
- **Multimedia Integration:**
  - **Soundtrack Player:** YouTube IFrame API—background play, shuffle history, loop modes, timeline progress.
  - **Synchronized Lyrics:** Real-time highlight + auto-scroll (JP/Romaji) synced to playback milliseconds.
  - **Karaoke + Translation Engine:** Nested Mongoose `LyricSchema`—dual-language (JP/Romaji + VN) line-synced rendering.
  - **Asset Management:** Image hosting + crop-prevention via **Cloudinary**.
- **Responsive UI:** React + Vanilla CSS.
- **Robust Architecture:**
  - **Validation:** Zod schemas for env vars + API payloads.
  - **Security:** Rate limiting, input sanitization (ReDoS/NoSQL), file constraints.
  - **Modular Backend:** Domain-driven modules.
  - **Error Hierarchy:** Custom classes (AuthError, WikiError, etc.).
  - **Testing:** Jest/Supertest (backend), Vitest/RTL (frontend).

## 🛠️ Tech Stack

**Frontend:** React (Vite) | RTK | Socket.io-client | React Router DOM | Axios | Vitest/RTL

**Backend:** Node.js | Express | MongoDB (Mongoose) | Redis | Zod | Socket.io | Passport.js | Argon2/JWT/Helmet/CORS | Multer/Cloudinary | Jest/Supertest

## 📦 Installation

**Prerequisites:** Node.js (v16+), MongoDB (Atlas), Redis Server, Cloudinary, OAuth (Google/X/Discord/GitHub)

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
PORT=3000
MONGO_URI=your_mongodb_uri
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_session_secret
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_LIFETIME=15m
JWT_REFRESH_LIFETIME=30d

# Cloudinary
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/wiki/auth/google/callback

# X (Twitter) OAuth
X_LOCAL_CLIENT_ID=your_x_local_id
X_LOCAL_CLIENT_SECRET=your_x_local_secret
X_LOCAL_CALLBACK_URL=http://127.0.0.1:3000/api/v1/wiki/auth/x/callback
# X_PROD_CLIENT_ID=your_x_prod_client_id
# X_PROD_CLIENT_SECRET=your_x_prod_client_secret
# X_PROD_CALLBACK_URL=https://yourdomain.com/api/v1/wiki/auth/x/callback

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_id
DISCORD_CLIENT_SECRET=your_discord_secret
DISCORD_LOCAL_CALLBACK_URL=http://localhost:3000/api/v1/wiki/auth/discord/callback
# DISCORD_PROD_CLIENT_ID=your_discord_prod_client_id
# DISCORD_PROD_CLIENT_SECRET=your_discord_prod_client_secret
# DISCORD_PROD_CALLBACK_URL=https://yourdomain.com/api/v1/wiki/auth/discord/callback

# GitHub OAuth
GITHUB_LOCAL_CLIENT_ID=your_github_local_id
GITHUB_LOCAL_CLIENT_SECRET=your_github_local_secret
GITHUB_LOCAL_CALLBACK_URL=http://localhost:3000/api/v1/wiki/auth/github/callback
# GITHUB_PROD_CLIENT_ID=your_github_prod_id
# GITHUB_PROD_CLIENT_SECRET=your_github_prod_secret
# GITHUB_PROD_CALLBACK_URL=https://yourdomain.com/api/v1/wiki/auth/github/callback

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
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

## 🧪 Testing

**Backend:** `cd server && npm test` (all) | `npm run test:unit` | `npm run test:integration`

**Frontend:** `cd client && npm test`

## 📂 Project Structure

```
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
│   │   └── tests/       # Vitest
│   └── public/          # Static
├── server/              # Express (Node.js)
│   ├── config/          # Config (Passport/DB/Cloudinary/Env)
│   ├── constants/       # Global constants (roles.js)
│   ├── errors/          # Error classes
│   ├── middleware/      # Global middleware (authorizeRoles.js, authentication.js, etc)
│   ├── modules/         # Domain modules (Auth/Wiki/Characters/etc)
│   │   └── [module]/
│   │       ├── [name].controller.js
│   │       ├── [name].route.js
│   │       ├── [name].service.js
│   │       ├── [name].model.js
│   │       └── strategies/   # Modular OAuth lazy-strategies (google, twitter, discord, github)
│   ├── schemas/         # Zod validation
│   ├── tests/           # Jest/Supertest
│   └── server.js        # Entry + Socket.io
└── README.md
```

## � Key Concepts

### Authentication & Security
- **Multi-factor OAuth:** Supports Google, X (Twitter), Discord, and GitHub out of the box.
- **Argon2 Hashing:** Industry-standard password hashing for local accounts.
- **JWT Token Strategy:** Access tokens (15m) + Refresh tokens (30d) for secure, scalable authentication.
- **Role-Based Access Control (RBAC):** Granular permission management for protected routes.
- **Session Persistence:** Redis-backed sessions ensure user continuity across server restarts.

### Content & Media
- **Synchronized Lyrics:** Real-time highlight + auto-scroll lyrics (Japanese/Romaji/Vietnamese) synced to millisecond precision.
- **Karaoke Support:** Nested MongoDB schemas enable line-by-line dual-language rendering.
- **YouTube Integration:** IFrame API for background playback, shuffle, loop modes, and timeline control.
- **Cloudinary Asset Management:** Secure image hosting with crop prevention and CDN delivery.

### Architecture
- **Domain-Driven Design:** Modular backend organized by feature (Auth, Wiki, Characters, Soundtrack).
- **Type-Safe Config:** Zod validation ensures all environment variables are correct at startup.
- **Real-time Updates:** Socket.io for live user counter and interactive features.
- **Input Sanitization:** Protection against ReDoS, NoSQL injection, and malformed payloads.
- **Error Hierarchy:** Structured error classes for consistent API responses.

## �📜 License

Educational/personal use. "Chou Kaguya Hime" content © respective owners.
