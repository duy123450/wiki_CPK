# Wiki CPK (Chou Kaguya Hime)

Full-stack MERN (MongoDB, Express, React, Node.js) app—Wiki for "Chou Kaguya Hime" series + music player (YouTube IFrame API).

## 📖 Table of Contents

- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [� Code Style](#-code-style)
- [�📦 Installation](#-installation)
- [🏃 Running the Application](#-running-the-application)
- [🧪 Testing](#-testing)
- [📂 Project Structure](#-project-structure)
- [📜 License](#-license)


## 🚀 Features

- **Wiki Management:** Movies, characters, categories, soundtracks.
- **Advanced Authentication:**
  - Local login with **Argon2** hashing.
  - OAuth: **Google**, **X (Twitter)** (API v2), **Discord**.
  - Session management with **JWT** (Access/Refresh tokens).
  - Account conflict prevention vs OAuth hijacking.
  - **RBAC:** Permission management for restricted routes.
- **Real-time Interaction:**
  - **Live User Counter:** Tracks connected clients via **Socket.io**.
  - Interactive UI + live indicators.
- **Multimedia Integration:**
  - **Soundtrack Player:** YouTube IFrame API—background play, shuffle history, loop modes, timeline progress.
  - **Synchronized Lyrics:** Real-time highlight + auto-scroll (JP/Romaji) synced to playback milliseconds.
  - **Karaoke + Translation Engine:** Nested Mongoose `LyricSchema`—dual-language (JP/Romaji + VN/EN) line-synced rendering.
  - **Asset Management:** Image hosting + crop-prevention via **Cloudinary**.
- **Responsive UI:** React + Vanilla CSS.
- **Robust Architecture:**
  - **Validation:** Zod schemas for env vars + API payloads.
  - **Security:** Rate limiting, input sanitization (ReDoS/NoSQL), file constraints.
  - **Modular Backend:** Domain-driven modules.
  - **Error Hierarchy:** Custom classes (AuthError, WikiError, etc.).
  - **Knowledge Graph:** Auto architecture mapping via **Graphify**.
  - **Testing:** Jest/Supertest (backend), Vitest/RTL (frontend).

## 🛠️ Tech Stack

**Frontend:** React (Vite) | RTK | Socket.io-client | React Router DOM | Axios | Vitest/RTL

**Backend:** Node.js | Express | MongoDB (Mongoose) | Zod | Socket.io | Passport.js | Argon2/JWT/Helmet/CORS | Multer/Cloudinary | Jest/Supertest

## � Code Style

**Formatter:** Prettier (no semicolons, single quotes, trailing commas)

Config files: `.prettierrc.json` (client + server)

Format code:
```bash
cd server && npx prettier --write "**/*.{js,mjs,cjs}"
cd ../client && npx prettier --write "**/*.{js,jsx}"
```

## �📦 Installation

**Prerequisites:** Node.js (v16+), MongoDB (Atlas), Cloudinary, OAuth (Google/X/Discord/GitHub)

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

## 🏃 Running

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
│   │   ├── constants/   # Constants
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
│   ├── errors/          # Error classes
│   ├── middleware/      # Global middleware
│   ├── modules/         # Domain modules (Auth/Wiki/Characters/etc)
│   │   └── [module]/
│   │       ├── [name].controller.js
│   │       ├── [name].route.js
│   │       ├── [name].service.js
│   │       └── [name].model.js
│   ├── schemas/         # Zod validation
│   ├── tests/           # Jest/Supertest
│   └── server.js        # Entry + Socket.io
└── README.md
```

## 📜 License

Educational/personal use. "Chou Kaguya Hime" content © respective owners.
