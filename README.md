# Wiki CPK (Chou Kaguya Hime)

A full-stack MERN (MongoDB, Express, React, Node.js) application featuring a comprehensive Wiki for the "Chou Kaguya Hime" series and an integrated music player using the YouTube IFrame API.

## 🚀 Features

- **Wiki Management:** Extensive information on movies, characters, categories, and soundtracks.
- **Advanced Authentication:**
  - Secure Local login with **Argon2** password hashing.
  - Social login integration: **Google OAuth 2.0** and **X (Twitter) OAuth 2.0** (API v2).
  - Secure session management using **JWT** (Access and Refresh tokens).
- **Multimedia Integration:**
  - Integrated music player with shuffle history, loop mode, and progress tracking.
  - Image hosting and management via **Cloudinary**.
- **Responsive UI:** Modern, interactive design built with React and Vanilla CSS.
- **Robust Testing:**
  - Backend unit and integration tests using **Jest** and **Supertest**.
  - Frontend component testing using **Vitest** and **React Testing Library**.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React (Vite)
- **State Management:** Context API
- **Routing:** React Router DOM
- **API Client:** Axios
- **Testing:** Vitest, React Testing Library

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose)
- **Authentication:** Passport.js (Local, Google, Twitter)
- **Security:** Argon2 (hashing), JWT (tokens), Helmet, CORS, Rate Limiting
- **File Uploads:** Multer, Cloudinary
- **Testing:** Jest, Supertest

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (Atlas)
- Cloudinary Account
- Google & X Developer Console credentials

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
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_LIFETIME=15m
JWT_REFRESH_LIFETIME=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/wiki/auth/google/callback

# X (Twitter) OAuth
X_LOCAL_CLIENT_ID=your_x_local_id
X_LOCAL_CLIENT_SECRET=your_x_local_secret
X_PROD_CLIENT_ID=your_x_prod_id
X_PROD_CLIENT_SECRET=your_x_prod_secret

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
npm start
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
│   │   ├── context/     # Global state management
│   │   ├── services/    # API calls (Axios)
│   │   └── pages/       # Page components
├── server/              # Express API
│   ├── config/          # Passport, Database, Cloudinary config
│   ├── controllers/     # Route logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   └── services/        # Business logic
└── README.md
```

## 📜 License
This project is for educational/personal use. All content related to "Chou Kaguya Hime" belongs to its respective owners.
