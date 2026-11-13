const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "database");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, "stpms.db"));
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 full_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('super_admin','coach','player')),
 player_id INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS teams (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 team_name TEXT NOT NULL,
 sport TEXT NOT NULL,
 coach_name TEXT,
 season TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS players (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
 first_name TEXT NOT NULL,
 last_name TEXT NOT NULL,
 birth_date TEXT,
 gender TEXT,
 jersey_number TEXT,
 position TEXT,
 contact_number TEXT,
 email TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS schedules (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 activity_type TEXT NOT NULL,
 activity_date TEXT NOT NULL,
 start_time TEXT,
 location TEXT,
 notes TEXT
);
CREATE TABLE IF NOT EXISTS attendance (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
 schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
 attendance_status TEXT NOT NULL CHECK(attendance_status IN ('Present','Absent','Late','Excused')),
 remarks TEXT,
 UNIQUE(player_id, schedule_id)
);
CREATE TABLE IF NOT EXISTS player_statistics (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
 schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
 games_played INTEGER DEFAULT 0,
 points_or_goals REAL DEFAULT 0,
 assists REAL DEFAULT 0,
 other_stats TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
if (!count) {
  const hash = bcrypt.hashSync("admin12345", 10);
  db.prepare("INSERT INTO users(username,password_hash,full_name,role) VALUES(?,?,?,?)")
    .run("admin", hash, "System Administrator", "super_admin");
}
module.exports = db;
