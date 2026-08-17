# Pasopkan

A modern experience, ticketing, and tour booking platform built with React, Vite, Express, Tailwind CSS, Firebase Authentication & Firestore, and PostgreSQL (via Drizzle ORM).

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Quick Start (Localhost)](#-quick-start-localhost)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Project Architecture](#-project-architecture)
- [Database Setup (Optional)](#-database-setup-optional)
- [Firebase Setup](#-firebase-setup)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🛠 Prerequisites

Before running the application locally, ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher (Node.js 20+ LTS recommended)
- **npm**: `v9.0.0` or higher (or `yarn` / `pnpm`)
- **Git** (optional, for cloning)

Verify your installation:
```bash
node -v
npm -v
```

---

## 🚀 Quick Start (Localhost)

### 1. Clone or Extract the Repository

```bash
git clone <repository-url>
cd pasopkan
```

### 2. Install Dependencies

Install all required npm packages:

```bash
npm install
```

### 3. Configure Environment Variables

Create a local environment file by copying `.env.example`:

```bash
cp .env.example .env
```

*(Optional: Fill in your PostgreSQL database credentials if connecting to an external database. If left empty, the application automatically runs in fallback mode).*

### 4. Start Development Server

Run the full-stack development server (Express backend + Vite HMR frontend):

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## ⚙️ Environment Configuration

The application uses environment variables for server-side configurations. Create a `.env` file in the root directory:

```env
# PostgreSQL Database Configuration (Optional)
SQL_HOST=localhost
SQL_DB_NAME=pasopkan_db
SQL_USER=postgres
SQL_PASSWORD=your_password
SQL_ADMIN_USER=postgres
SQL_ADMIN_PASSWORD=your_password
```

> **Note:** The server has built-in graceful fallback handling. If SQL credentials are not provided or the database is temporarily unreachable, ticketing and reviews will operate in resilient memory-store mode.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite middleware on `http://localhost:3000` |
| `npm run build` | Builds the Vite frontend and bundles the backend server into `dist/server.cjs` |
| `npm run start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run preview` | Previews the built frontend via Vite |
| `npm run clean` | Cleans up the `dist` directory |

---

## 🏗 Project Architecture

```
.
├── server.ts                  # Express API server entry point & Vite middleware setup
├── firebase-applet-config.json # Client Firebase configuration
├── firestore.rules            # Firestore security rules
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite build configuration
├── src/
│   ├── main.tsx               # React application entry point
│   ├── App.tsx                # Main router and shell layout
│   ├── index.css              # Tailwind CSS styles
│   ├── AuthContext.tsx        # Firebase Authentication context
│   ├── LanguageContext.tsx    # Multi-language translation context (Lao, English, Thai)
│   ├── ThemeContext.tsx       # Light / Dark theme context
│   ├── components/            # Reusable UI components (Navbar, Modals, QR scanners, etc.)
│   ├── pages/                 # Application views (Home, Explore, EventDetails, Tickets, etc.)
│   ├── lib/                   # Utility helpers, Firebase client, checkins store
│   └── db/                    # Drizzle ORM schema and database connection
└── dist/                      # Production build output (generated after build)
```

---

## 🗄 Database Setup (Optional)

If you wish to connect a local PostgreSQL database:

1. **Install PostgreSQL** and create a database:
   ```sql
   CREATE DATABASE pasopkan_db;
   ```

2. **Set credentials in `.env`**:
   ```env
   SQL_HOST=127.0.0.1
   SQL_DB_NAME=pasopkan_db
   SQL_USER=postgres
   SQL_PASSWORD=your_postgres_password
   ```

3. **Push Schema (if using Drizzle Kit)**:
   ```bash
   npx drizzle-kit push
   ```

---

## 🔥 Firebase Setup

The application uses Firebase for user authentication and real-time features.

- A pre-configured `firebase-applet-config.json` is included with the project.
- If using your own Firebase project:
  1. Go to the [Firebase Console](https://console.firebase.google.com/).
  2. Enable **Authentication** (Email/Password, Google Sign-In, Anonymous).
  3. Enable **Firestore Database**.
  4. In **Authentication > Settings > Authorized Domains**, ensure `localhost` is listed.
  5. Update the credentials in `firebase-applet-config.json`.

---

## ❓ Troubleshooting & FAQ

#### 1. Port 3000 is already in use
If port `3000` is occupied by another process:
- **Windows (PowerShell)**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
  ```
- **macOS / Linux**:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

#### 2. Firebase Auth errors on localhost
Ensure `localhost` is present in your Firebase Project's Authorized Domains list in the Firebase Console under **Authentication > Settings > Authorized domains**.

#### 3. TypeScript / Compilation errors
Run a clean install and verify the build:
```bash
npm run clean
npm install
npm run lint
npm run build
```
