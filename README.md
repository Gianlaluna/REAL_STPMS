# STPMS — Sports Team and Player Management System

A beginner-friendly, local web application for managing multiple sports, teams, players, schedules, attendance, and player statistics. Built with Node.js, Express, SQLite, HTML, CSS, and JavaScript.

## Requirements
- Windows 10/11
- Node.js LTS (includes npm)
- Visual Studio Code

## Step 1 — Install Node.js
Download and install the LTS version from https://nodejs.org/. After installation, close and reopen Command Prompt.

Check:
```cmd
node -v
npm -v
```

## Step 2 — Open the project
1. Extract `STPMS.zip` to a folder you can find easily, such as `C:\STPMS`.
2. Open VS Code.
3. Select **File > Open Folder** and choose the `STPMS` folder.
4. In VS Code select **Terminal > New Terminal**.

## Step 3 — Install dependencies
In the VS Code terminal (CMD or PowerShell), run:
```cmd
npm install
```
If `better-sqlite3` reports a native build error, install the current Node.js LTS release and retry. Do not install a separate SQLite program; the project uses an embedded database.

## Step 4 — Configure environment
Copy `.env.example` and name the copy `.env`. You can use File Explorer or CMD:
```cmd
copy .env.example .env
```
For a classroom/local demonstration, the default development secret works. Before hosting this online, replace `JWT_SECRET` with a long random secret and change the default admin password.

## Step 5 — Start the system
```cmd
npm start
```
Open Chrome and visit:
http://localhost:3000

Keep the terminal open while using the system. Press `Ctrl + C` in the terminal to stop the server.

## First login
- Username: `admin`
- Password: `admin12345`

Change this demo password before real deployment. This starter version seeds the administrator on first database creation.

## Features included
- Role-based sign-in: super administrator, coach, and player roles
- Team CRUD with multiple sports
- Player CRUD and team assignment
- Schedule CRUD
- Attendance CRUD with Present, Absent, Late, and Excused statuses
- Player statistics CRUD with generic points/goals, assists, games played, and other sport-specific stats
- Dashboard summary and upcoming activities
- SQLite relational database with primary and foreign keys
- REST API under `/api`

## API quick reference
All endpoints except login and health require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current account |
| GET | `/api/dashboard` | Dashboard totals |
| GET/POST | `/api/teams` | List/create teams |
| PUT/DELETE | `/api/teams/:id` | Update/delete team |
| GET/POST | `/api/players` | List/create players |
| PUT/DELETE | `/api/players/:id` | Update/delete player |
| GET/POST | `/api/schedules` | List/create schedules |
| GET/POST | `/api/attendance` | List/create attendance |
| GET/POST | `/api/player_statistics` | List/create statistics |
| GET/POST | `/api/users` | List/create accounts (super admin only) |

## Important project notes
- Statistics are intentionally generic so the system can support different sports. For example, points/goals can represent basketball points, football goals, or volleyball points; `other_stats` can store sport-specific details.
- The starter UI has working create, read, update, and delete forms for teams, players, schedules, attendance, and statistics. Account creation is supported for the super administrator; account editing/deletion is not yet exposed in the UI.
- Player accounts are view-restricted. To link a player login, create a player record first, then create a user with role `player` and that player's ID. The player-facing view is a basic initial implementation.
- This is a local classroom starter, not a production-hardened deployment. Add stronger password-change flows, audit logs, validation, rate limiting, HTTPS, and backup procedures before public deployment.
