# 🏏 Cricket Player Auction Platform — Complete Guide

> **For anyone reading this:** Don't worry if you're not a developer!
> This guide is written in plain language. Just follow the steps **in order** and the project will run on your computer.

---

## ⚡ Quick Start — Run the Project in 5 Steps

> Do these steps **once** when setting up for the first time.
> After that, jump to [Starting the project daily](#-starting-the-project-every-day).

### Step 1 — Install the required software

You need to install two programs before anything else:

| Program | What it does | Download link |
|---------|-------------|---------------|
| **Node.js** (version 18 or newer) | Runs the backend server | https://nodejs.org → click **"LTS"** button |
| **Docker Desktop** | Runs the database | https://www.docker.com/products/docker-desktop |

> ✅ After installing, **restart your computer** so everything is set up properly.

---

### Step 2 — Open a terminal (Command Prompt / PowerShell)

- Press **Windows key + R**, type `powershell`, press Enter
- Or search for **"PowerShell"** in the Start menu

> 💡 All the commands below are typed into this terminal window.

---

### Step 3 — Start the database

The database stores all auction data (teams, players, bids, etc.).

1. Open **Docker Desktop** and wait until it says **"Engine running"**
2. In your terminal, navigate to the project folder:
   ```
   cd "D:\Projects (personal)\Cricket Auction\player_auction_platform"
   ```
3. Start the database:
   ```
   docker compose up -d
   ```

> ✅ You should see messages like `Started` or `Running`. The database is now running in the background.

---

### Step 4 — Set up and start the Backend (API Server)

The backend is the brain of the app — it handles all the logic.

Type these commands **one by one** in the terminal (press Enter after each):

```
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

> ✅ When you see `Application is running on: http://localhost:3000` — the backend is ready!

> 📌 Keep this terminal window **open and running**.

---

### Step 5 — Set up and start the Frontend (Website)

The frontend is the website you see in your browser.

Open a **second terminal window** and type:

```
cd "D:\Projects (personal)\Cricket Auction\player_auction_platform\web"
npm install
npm run dev
```

> ✅ When it shows a URL like `http://localhost:3001` — open that URL in your browser.

---

## 🎉 You're Done! The Project is Running

| What | Where to open it |
|------|-----------------|
| **Website (Frontend)** | http://localhost:3001 |
| **API Server (Backend)** | http://localhost:3000 |
| **Database Viewer** | Run `npx prisma studio` in the `backend/` folder, then open http://localhost:5555 |

---

## 🔁 Starting the Project Every Day

After the first-time setup above, you only need to do this each time you want to run the project:

**Terminal 1 — Start Database:**
```
cd "D:\Projects (personal)\Cricket Auction\player_auction_platform"
docker compose up -d
```

**Terminal 2 — Start Backend:**
```
cd "D:\Projects (personal)\Cricket Auction\player_auction_platform\backend"
npm run start:dev
```

**Terminal 3 — Start Frontend:**
```
cd "D:\Projects (personal)\Cricket Auction\player_auction_platform\web"
npm run dev
```

---

## 🛑 Stopping the Project

To stop everything when you're done:

- In each terminal window, press **Ctrl + C** to stop that server
- To stop the database:
  ```
  docker compose down
  ```

---

## 🧪 Testing the Project (API Endpoints)

You can test the backend using any of these tools:
- **[Postman](https://www.postman.com/downloads/)** (free app — easiest for beginners)
- **[Thunder Client](https://www.thunderclient.com/)** (VS Code extension)
- Your browser — for `GET` requests only

The backend server address is: **`http://localhost:3000`**

---

### 👤 Auth (Login / Register)

#### Register a new user

```
POST http://localhost:3000/auth/register
```
Send this JSON body:
```json
{
  "email": "admin@example.com",
  "password": "mypassword",
  "name": "John Doe",
  "role": "ADMIN"
}
```

Roles available: `ADMIN`, `AUCTIONEER`, `VIEWER`

#### Login

```
POST http://localhost:3000/auth/login
```
Send this JSON body:
```json
{
  "email": "admin@example.com",
  "password": "mypassword"
}
```

You'll get back a **token** — save it! You'll need it for other requests:
```json
{
  "access_token": "eyJhbGci...",
  "user": { "id": "...", "email": "...", "name": "John Doe", "role": "ADMIN" }
}
```

---

### 🏆 Auctions

#### Create an Auction

```
POST http://localhost:3000/auctions
```
```json
{
  "name": "IPL 2025 Auction"
}
```

Response — note the `code` field (e.g. `"XK7F2A"`). Viewers use this code to join the live auction.
```json
{
  "id": "abc-123",
  "name": "IPL 2025 Auction",
  "code": "XK7F2A",
  "status": "UPCOMING"
}
```

#### Get all Auctions

```
GET http://localhost:3000/auctions
```

#### Get one Auction (with teams & players)

```
GET http://localhost:3000/auctions/<auction-id>
```

---

### 👕 Teams & Players

#### Add a Team to an Auction

```
POST http://localhost:3000/auctions/team
```
```json
{
  "name": "Mumbai Indians",
  "budgetTotal": 10000000,
  "auctionId": "<paste auction id here>"
}
```

#### Add a Player to an Auction

```
POST http://localhost:3000/auctions/player
```
```json
{
  "name": "Virat Kohli",
  "category": "Batsman",
  "basePrice": 200000,
  "auctionId": "<paste auction id here>"
}
```

---

## 📡 Live Auction (WebSocket / Real-Time)

Real-time bidding uses **WebSocket** (Socket.IO). Viewers and teams connect via a special code.

Connect to: `ws://localhost:3000`

### How it works

```
1. User opens the website and enters the 6-character auction code (e.g. "XK7F2A")
2. They join the auction room in real time
3. When the auctioneer places a bid, everyone in the room sees it instantly
```

### Events

| Who sends it | Event name | What it does |
|-------------|------------|-------------|
| Client → Server | `joinAuction` | Join an auction room using the 6-char code |
| Client → Server | `placeBid` | Place a bid on the current player |
| Server → Client | `joined` | Confirms you joined successfully |
| Server → Client | `newBid` | Live bid update sent to everyone in the room |
| Server → Client | `error` | Something went wrong |

---

## ❗ Common Problems & Solutions

### Problem: `Cannot find module '.prisma/client/default'`

**This means:** The database models haven't been generated yet.

**Fix:** In the `backend/` folder, run:
```
npx prisma generate
```

---

### Problem: `Property 'auction' does not exist on type 'PrismaService'`

**This means:** Same as above — Prisma Client is not generated.

**Fix:** Run `npx prisma generate` in the `backend/` folder.

---

### Problem: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**This means:** The database is not running.

**Fix:**
1. Open **Docker Desktop** and make sure it shows "Engine running"
2. Run: `docker compose up -d`

---

### Problem: `npm WARN EBADENGINE` / warnings about engine version

**This means:** You're using an old version of Node.js (v16 or lower).

**Fix:** Download Node.js **version 18 LTS** from https://nodejs.org and reinstall it.

---

### Problem: Port already in use / `EADDRINUSE`

**This means:** Another program is already using that port.

**Fix:** Restart your computer, then try again. Or find and close the other program using port 3000/3001.

---

### Problem: `npx prisma migrate dev` fails

**This means:** Usually the database isn't ready yet.

**Fix:**
1. Wait 10 seconds after starting Docker
2. Make sure the `backend/.env` file contains:
   ```
   DATABASE_URL="postgresql://root:password@localhost:5432/auction_db?schema=public"
   ```
3. Try the migration again

---

## 📱 Mobile App Setup (Android Native)

The mobile application is a native Android app built with Jetpack Compose. It has full parity with the web app for Auctioneers and Viewers.

1. Open Android Studio.
2. Select **Open an existing Project**.
3. Choose the `mobile` folder inside the project root (`player_auction_platform/mobile`).
4. Wait for Gradle to sync.
5. In `mobile/androidApp/build.gradle.kts`, the backend URL is set to `10.0.2.2` by default (which works for the Android Emulator). If testing on a physical device over WiFi, change this to your PC's local IP address.
6. Click the green **Run** button to install it on your emulator or device.

---

## 📁 Project Structure (For Developers)

```
player_auction_platform/
│
├── docker-compose.yml       ← Starts PostgreSQL database + Redis
│
├── backend/                 ← NestJS API Server (port 3000)
│   ├── prisma/
│   │   └── schema.prisma    ← Database table definitions
│   ├── src/
│   │   ├── auction/         ← Auction create/read endpoints
│   │   ├── auth/            ← Login, register, JWT tokens
│   │   ├── events/          ← Real-time WebSocket gateway
│   │   └── prisma/          ← Database connection service
│   └── .env                 ← Database URL (keep this private!)
│
└── web/                     ← Next.js Website (port 3001)
```

---

## 🔐 Security Notes (Important for Production)

> These are fine for local development but **must be changed** before going live:

- The JWT secret is hardcoded as `SECRET_KEY` — move it to `.env` as `JWT_SECRET`
- Passwords are stored in plain text — add password hashing (e.g. **bcrypt**) before launch
- The `.env` file should **never** be committed to Git — add it to `.gitignore`

---

## 🧾 Quick Command Reference

```bash
# ── Database ─────────────────────────────────────────
docker compose up -d          # Start database
docker compose down           # Stop database

# ── Backend (run from backend/ folder) ───────────────
npm install                   # Install packages (first time)
npx prisma generate           # Generate DB types (after schema changes)
npx prisma migrate dev        # Apply DB changes
npx prisma studio             # Open visual database browser
npm run start:dev             # Start backend in dev mode (auto-restarts)
npm run build                 # Build for production
npm run start:prod            # Run production build

# ── Frontend (run from web/ folder) ──────────────────
npm install                   # Install packages (first time)
npm run dev                   # Start website in dev mode
```
