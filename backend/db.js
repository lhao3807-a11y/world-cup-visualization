const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'worldcup.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('cache_size = -64000');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL UNIQUE,
      current_name TEXT NOT NULL,
      color_code TEXT,
      secondary_color_code TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_teams_current ON teams(current_name);

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_team_norm TEXT NOT NULL,
      away_team_norm TEXT NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      tournament TEXT NOT NULL,
      country TEXT NOT NULL,
      neutral INTEGER NOT NULL DEFAULT 0,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      is_world_cup INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
    CREATE INDEX IF NOT EXISTS idx_matches_year ON matches(year);
    CREATE INDEX IF NOT EXISTS idx_matches_home ON matches(home_team_norm);
    CREATE INDEX IF NOT EXISTS idx_matches_away ON matches(away_team_norm);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament);
    CREATE INDEX IF NOT EXISTS idx_matches_wc ON matches(is_world_cup);
    CREATE INDEX IF NOT EXISTS idx_matches_country ON matches(country);

    CREATE TABLE IF NOT EXISTS yearly_stats (
      year INTEGER PRIMARY KEY,
      total_matches INTEGER NOT NULL,
      total_goals INTEGER NOT NULL,
      avg_goals_per_match REAL NOT NULL,
      unique_teams INTEGER NOT NULL,
      unique_tournaments INTEGER NOT NULL,
      world_cup_matches INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS team_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name TEXT NOT NULL,
      year INTEGER NOT NULL,
      matches_played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      goals_for INTEGER NOT NULL DEFAULT 0,
      goals_against INTEGER NOT NULL DEFAULT 0,
      win_rate REAL NOT NULL DEFAULT 0.0,
      elo_rating REAL DEFAULT 1500,
      UNIQUE(team_name, year)
    );

    CREATE INDEX IF NOT EXISTS idx_team_stats_team ON team_stats(team_name);
    CREATE INDEX IF NOT EXISTS idx_team_stats_year ON team_stats(year);

    CREATE TABLE IF NOT EXISTS live_matches (
      match_id TEXT PRIMARY KEY,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_score INTEGER DEFAULT 0,
      away_score INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      minute INTEGER,
      tournament TEXT,
      start_time TEXT,
      last_updated TEXT NOT NULL
    );
  `);
}

module.exports = { getDb };
