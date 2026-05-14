# Wiki CPK (Chou Kaguya Hime)

A full-stack MERN (MongoDB, Express, React, Node.js) application featuring a comprehensive Wiki for the "Chou Kaguya Hime" series and an integrated music player using the YouTube IFrame API.

## 📖 Table of Contents

- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation](#-installation)
- [🏃 Running the Application](#-running-the-application)
- [🧪 Testing](#-testing)
- [📂 Project Structure](#-project-structure)
- [📜 License](#-license)


## 🚀 Features

- **Wiki Management:** Extensive information on movies, characters, categories, and soundtracks.
- **Advanced Authentication:**
  - Secure Local login with **Argon2** password hashing.
  - Social login integration: **Google OAuth 2.0**, **X (Twitter) OAuth 2.0** (API v2), and **Discord OAuth 2.0**.
  - Secure session management using **JWT** (Access and Refresh tokens).
  - Account conflict prevention (prevents hijacking local accounts via OAuth).
  - **Role-Based Access Control (RBAC):** Granular permission management for sensitive routes.
- **Real-time Interaction:**
  - **Live Online User Counter:** Real-time tracking of connected clients using **Socket.io**.
  - Interactive UI with live indicators.
- **Multimedia Integration:**
  - Integrated music player with shuffle history, loop mode, and progress tracking.
  - Image hosting and management via **Cloudinary**.
- **Responsive UI:** Modern, interactive design built with React and Vanilla CSS.
- **Robust Architecture:**
  - **Environment & Data Validation:** Comprehensive schema validation using **Zod** for environment variables and API request payloads.
  - **Security Hardening:** Implementation of request rate limiting, input sanitization (ReDoS/NoSQL Injection prevention), and file size constraints.
  - **Modular Backend:** Clean separation of concerns with domain-driven modules.
  - **Class-based Error Hierarchy:** Granular error handling with custom error classes (AuthError, WikiError, etc.).
  - **Knowledge Graph:** Automated architecture mapping and community analysis using **Graphify**.
  - **Automated Testing:**
    - Backend: Jest and Supertest.
    - Frontend: Vitest and React Testing Library.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React (Vite)
- **State Management:** Context API
- **Real-time:** Socket.io-client
- **Routing:** React Router DOM
- **API Client:** Axios
- **Testing:** Vitest, React Testing Library

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose)
- **Validation:** Zod (Environment & Request schemas)
- **Real-time:** Socket.io
- **Authentication:** Passport.js (Local, Google, Twitter, Discord)
- **Security:** Argon2 (hashing), JWT (tokens), Helmet, CORS, Rate Limiting, Input Sanitization
- **File Uploads:** Multer, Cloudinary
- **Testing:** Jest, Supertest

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (Atlas)
- Cloudinary Account
- Developer credentials for Google, X (Twitter), and Discord

### 1. Clone the repository
```bash
git clone <repository-url>
cd wiki_CPK
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory and configure the following:
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

# X (Twitter) OAuth
X_LOCAL_CLIENT_ID=your_x_local_id
X_LOCAL_CLIENT_SECRET=your_x_local_secret

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_id
DISCORD_CLIENT_SECRET=your_discord_secret

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

## 🏃 Running the Application

### Start Backend
```bash
cd server
npm run dev
```

### Start Frontend
```bash
cd client
npm run dev
```

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test           # Run all tests
npm run test:unit  # Run unit tests
npm run test:integration # Run integration tests
```

### Frontend Tests
```bash
cd client
npm test
```

## 📂 Project Structure

```text
wiki_CPK/
├── client/              # React Application (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── config/      # Frontend configuration (Env)
│   │   ├── constants/   # Application constants (API endpoints, UI strings)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components (Home, Wiki, etc.)
│   │   ├── schemas/     # Zod validation schemas (Forms)
│   │   ├── services/    # API call services (Axios)
│   │   ├── styles/      # Global and component styles (CSS)
│   │   ├── utils/       # Helper functions and utilities
│   │   └── tests/       # Frontend testing (Vitest)
│   ├── public/          # Static assets
├── server/              # Express API (Node.js)
│   ├── config/          # Configuration (Passport, Database, Cloudinary, Env)
│   ├── errors/          # Custom class-based error hierarchy
│   ├── middleware/      # Global middleware (Auth, Error handling, Rate limiting)
│   ├── modules/         # Domain-driven modules (Auth, Wiki, Characters, etc.)
│   │   ├── [module]/
│   │   │   ├── [name].controller.js
│   │   │   ├── [name].route.js
│   │   │   ├── [name].service.js
│   │   │   └── [name].model.js
│   ├── schemas/         # Zod validation schemas
│   ├── tests/           # Backend testing (Jest & Supertest)
│   └── server.js        # Entry point & Socket.io setup
└── README.md
```

## 📜 License
This project is for educational/personal use. All content related to "Chou Kaguya Hime" belongs to its respective owners.
