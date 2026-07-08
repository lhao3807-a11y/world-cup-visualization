const { getDb } = require('./db');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DATA_DIR = process.env.CSV_DIR || path.join(__dirname, '..');
const MATCHES_CSV = process.env.CSV_MATCHES_PATH || path.join(DATA_DIR, 'all_matches.csv');
const COUNTRIES_CSV = process.env.CSV_COUNTRIES_PATH || path.join(DATA_DIR, 'countries_names.csv');

function seed() {
  console.log('[Seed] Starting data import...');
  const db = getDb();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM matches').get();
  if (count.c > 0) {
    console.log(`[Seed] Database already contains ${count.c} matches. Skipping seed.`);
    console.log('[Seed] To re-seed, delete worldcup.db and re-run.');
    return;
  }

  // 1. Import country names
  console.log('[Seed] Importing country names...');
  const countriesRaw = fs.readFileSync(COUNTRIES_CSV, 'utf-8');
  const countries = parse(countriesRaw, { columns: true, skip_empty_lines: true });

  const insertTeam = db.prepare(`
    INSERT OR IGNORE INTO teams (original_name, current_name, color_code, secondary_color_code)
    VALUES (?, ?, ?, ?)
  `);

  const teamColors = {};
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertTeam.run(row.original_name, row.current_name, row.color_code, row.secondary_color_code);
      teamColors[row.original_name] = { color: row.color_code, secondary: row.secondary_color_code };
    }
  });
  insertMany(countries);
  console.log(`[Seed] Imported ${countries.length} country names.`);

  // 2. Import match data (ONLY World Cup finals)
  console.log('[Seed] Importing World Cup match data...');
  const matchesRaw = fs.readFileSync(MATCHES_CSV, 'utf-8');
  const allMatches = parse(matchesRaw, { columns: true, skip_empty_lines: true });

  // Filter: 仅保留 1930-2022 已完成的 22 届世界杯正赛
  // 2026 世界杯虽正在进行，但 CSV 中为模拟数据，故排除
  const validWCYears = new Set();
  for (let y = 1930; y <= 2022; y += 4) {
    if (y !== 1942 && y !== 1946) validWCYears.add(y);
  }
  const matches = allMatches.filter(row => {
    const y = parseInt(row.date.substring(0, 4));
    return row.tournament === 'World Cup' && validWCYears.has(y);
  });
  const skippedWC = allMatches.filter(row => row.tournament === 'World Cup' && !validWCYears.has(parseInt(row.date.substring(0, 4))));
  if (skippedWC.length) console.log(`[Seed] Skipped ${skippedWC.length} matches in non-WC years (e.g. Women's/youth tournaments).`);
  console.log(`[Seed] Filtered to ${matches.length} World Cup finals matches (from ${allMatches.length} total).`);

  const insertMatch = db.prepare(`
    INSERT INTO matches (date, home_team, away_team, home_team_norm, away_team_norm,
      home_score, away_score, tournament, country, neutral, year, month, is_world_cup)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Build normalization map
  const normMap = {};
  for (const c of countries) {
    normMap[c.original_name] = c.current_name;
  }

  function normalize(name) {
    return normMap[name] || name;
  }

  const matchInsertMany = db.transaction((rows) => {
    for (const row of rows) {
      const date = row.date;
      const year = parseInt(date.substring(0, 4));
      const month = parseInt(date.substring(5, 7));
      insertMatch.run(
        date,
        row.home_team,
        row.away_team,
        normalize(row.home_team),
        normalize(row.away_team),
        parseInt(row.home_score) || 0,
        parseInt(row.away_score) || 0,
        row.tournament || 'World Cup',
        row.country || 'Unknown',
        row.neutral === 'True' || row.neutral === 'true' || row.neutral === '1' ? 1 : 0,
        year,
        month,
        1  // All are World Cup matches now
      );
    }
  });

  // Batch insert in chunks of 5000
  const CHUNK = 5000;
  for (let i = 0; i < matches.length; i += CHUNK) {
    const chunk = matches.slice(i, i + CHUNK);
    matchInsertMany(chunk);
    console.log(`[Seed] Inserted ${Math.min(i + CHUNK, matches.length)} / ${matches.length} matches...`);
  }
  console.log(`[Seed] Imported ${matches.length} matches.`);

  // 3. Compute yearly stats
  console.log('[Seed] Computing yearly stats...');
  const yearlyStats = db.prepare(`
    INSERT OR REPLACE INTO yearly_stats (year, total_matches, total_goals, avg_goals_per_match, unique_teams, unique_tournaments, world_cup_matches)
    SELECT
      year,
      COUNT(*) as total_matches,
      SUM(home_score + away_score) as total_goals,
      ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals,
      COUNT(DISTINCT home_team_norm) + COUNT(DISTINCT away_team_norm) as unique_teams,
      COUNT(DISTINCT tournament) as unique_tournaments,
      SUM(CASE WHEN is_world_cup = 1 THEN 1 ELSE 0 END) as world_cup_matches
    FROM matches
    GROUP BY year
    ORDER BY year
  `);
  yearlyStats.run();
  console.log('[Seed] Yearly stats computed.');

  // 4. Compute team stats per year
  console.log('[Seed] Computing team stats...');
  const allYears = db.prepare('SELECT DISTINCT year FROM matches ORDER BY year').all();

  const insertTeamStats = db.prepare(`
    INSERT OR REPLACE INTO team_stats (team_name, year, matches_played, wins, draws, losses, goals_for, goals_against, win_rate, elo_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const teamStatsTx = db.transaction(() => {
    for (const { year } of allYears) {
      const homeStats = db.prepare(`
        SELECT home_team_norm as team,
          COUNT(*) as played,
          SUM(CASE WHEN home_score > away_score THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END) as draws,
          SUM(CASE WHEN home_score < away_score THEN 1 ELSE 0 END) as losses,
          SUM(home_score) as gf,
          SUM(away_score) as ga
        FROM matches WHERE year = ? GROUP BY home_team_norm
      `).all(year);

      const awayStats = db.prepare(`
        SELECT away_team_norm as team,
          COUNT(*) as played,
          SUM(CASE WHEN away_score > home_score THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN away_score = home_score THEN 1 ELSE 0 END) as draws,
          SUM(CASE WHEN away_score < home_score THEN 1 ELSE 0 END) as losses,
          SUM(away_score) as gf,
          SUM(home_score) as ga
        FROM matches WHERE year = ? GROUP BY away_team_norm
      `).all(year);

      const combined = {};
      for (const s of [...homeStats, ...awayStats]) {
        if (!combined[s.team]) combined[s.team] = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
        combined[s.team].played += s.played;
        combined[s.team].wins += s.wins;
        combined[s.team].draws += s.draws;
        combined[s.team].losses += s.losses;
        combined[s.team].gf += s.gf;
        combined[s.team].ga += s.ga;
      }

      for (const [team, stats] of Object.entries(combined)) {
        const wr = stats.played > 0 ? Math.round((stats.wins / stats.played) * 10000) / 100 : 0;
        insertTeamStats.run(team, year, stats.played, stats.wins, stats.draws, stats.losses, stats.gf, stats.ga, wr, 1500);
      }
    }
  });
  teamStatsTx();
  console.log('[Seed] Team stats computed.');

  // 5. Compute Elo ratings
  console.log('[Seed] Computing Elo ratings...');
  const eloMatches = db.prepare('SELECT * FROM matches ORDER BY date, id').all();

  const eloRatings = {};
  function getElo(team) {
    return eloRatings[team] || 1500;
  }
  function setElo(team, rating) {
    eloRatings[team] = rating;
  }

  // Elo K-factor based on tournament importance
  function getKFactor(tournament) {
    const t = (tournament || '').toLowerCase();
    if (t.includes('world cup') && !t.includes('qualif')) return 60;
    if (t.includes('world cup')) return 50;
    if (t.includes('continental') || t.includes('euro') || t.includes('copa') || t.includes('africa') || t.includes('asian')) return 40;
    return 20;
  }

  const updateEloStmt = db.prepare('UPDATE team_stats SET elo_rating = ? WHERE team_name = ? AND year = ?');

  // Save Elo at end of each year
  const eloByYear = {};
  for (const match of eloMatches) {
    const home = match.home_team_norm;
    const away = match.away_team_norm;
    const homeElo = getElo(home);
    const awayElo = getElo(away);

    const expectedHome = 1 / (1 + Math.pow(10, (awayElo - homeElo) / 400));
    const expectedAway = 1 - expectedHome;

    const K = getKFactor(match.tournament);

    let actualHome, actualAway;
    if (match.home_score > match.away_score) {
      actualHome = 1; actualAway = 0;
    } else if (match.home_score < match.away_score) {
      actualHome = 0; actualAway = 1;
    } else {
      actualHome = 0.5; actualAway = 0.5;
    }

    setElo(home, homeElo + K * (actualHome - expectedHome));
    setElo(away, awayElo + K * (actualAway - expectedAway));

    if (!eloByYear[match.year]) eloByYear[match.year] = {};
    eloByYear[match.year][home] = getElo(home);
    eloByYear[match.year][away] = getElo(away);
  }

  const updateEloTx = db.transaction(() => {
    for (const [year, teams] of Object.entries(eloByYear)) {
      for (const [team, rating] of Object.entries(teams)) {
        updateEloStmt.run(Math.round(rating), team, parseInt(year));
      }
    }
  });
  updateEloTx();
  console.log('[Seed] Elo ratings computed.');

  console.log('[Seed] Data import complete!');
}

if (require.main === module) {
  seed();
  process.exit(0);
}

module.exports = { seed };
