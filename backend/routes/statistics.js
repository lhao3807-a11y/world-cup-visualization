const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/statistics/overview — 首页总览KPI
router.get('/overview', (req, res) => {
  const db = getDb();
  const overview = db.prepare(`
    SELECT
      COUNT(*) as total_matches,
      SUM(home_score + away_score) as total_goals,
      COUNT(DISTINCT home_team_norm) + COUNT(DISTINCT away_team_norm) as total_teams,
      COUNT(DISTINCT tournament) as total_tournaments,
      COUNT(DISTINCT country) as total_countries,
      MIN(date) as first_match_date,
      MAX(date) as last_match_date,
      ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals
    FROM matches
  `).get();

  const biggestWin = db.prepare(`
    SELECT *, (home_score - away_score) as diff FROM matches
    ORDER BY ABS(home_score - away_score) DESC LIMIT 1
  `).get();

  const mostGoals = db.prepare(`
    SELECT *, (home_score + away_score) as total FROM matches
    ORDER BY (home_score + away_score) DESC LIMIT 1
  `).get();

  res.json({
    success: true,
    data: { overview, biggestWin, mostGoals }
  });
});

// GET /api/statistics/yearly — 年度统计
router.get('/yearly', (req, res) => {
  const db = getDb();
  const { year_gte, year_lte } = req.query;
  let query = 'SELECT * FROM yearly_stats';
  const params = [];
  if (year_gte || year_lte) {
    const conditions = [];
    if (year_gte) { conditions.push('year >= ?'); params.push(parseInt(year_gte)); }
    if (year_lte) { conditions.push('year <= ?'); params.push(parseInt(year_lte)); }
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY year ASC';
  const data = db.prepare(query).all(...params);
  res.json({ success: true, data });
});

// GET /api/statistics/champions — 世界杯冠军统计
router.get('/champions', (req, res) => {
  const db = getDb();
  // Find World Cup final matches and determine winners
  const finals = db.prepare(`
    SELECT * FROM matches
    WHERE tournament LIKE '%World Cup%'
    AND (tournament LIKE '%Final%' OR tournament LIKE '%final%')
    ORDER BY date
  `).all();

  // Also search for World Cup finals that might not have "Final" in tournament name
  // Look for the last match of each World Cup year
  const wcYears = db.prepare(`
    SELECT DISTINCT year FROM matches
    WHERE tournament LIKE '%World Cup%'
    AND tournament NOT LIKE '%qualif%'
    ORDER BY year
  `).all();

  const champions = {};
  for (const { year } of wcYears) {
    const lastMatch = db.prepare(`
      SELECT * FROM matches
      WHERE year = ? AND tournament LIKE '%World Cup%' AND tournament NOT LIKE '%qualif%'
      ORDER BY date DESC LIMIT 1
    `).get(year);

    if (lastMatch) {
      let winner;
      if (lastMatch.home_score > lastMatch.away_score) winner = lastMatch.home_team_norm;
      else if (lastMatch.away_score > lastMatch.home_score) winner = lastMatch.away_team_norm;
      else winner = null; // Draw — likely not a final

      if (winner) {
        if (!champions[winner]) champions[winner] = { team: winner, titles: 0, years: [], runner_ups: 0 };
        champions[winner].titles++;
        champions[winner].years.push(year);
      }
    }
  }

  const data = Object.values(champions).sort((a, b) => b.titles - a.titles);
  res.json({ success: true, data });
});

// GET /api/statistics/goals-trend — 进球趋势
router.get('/goals-trend', (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT year,
      SUM(home_score + away_score) as total_goals,
      COUNT(*) as matches,
      ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals
    FROM matches
    GROUP BY year
    ORDER BY year
  `).all();
  res.json({ success: true, data });
});

// GET /api/statistics/tournament-distribution — 赛事分布
router.get('/tournament-distribution', (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT tournament as name, COUNT(*) as value
    FROM matches
    GROUP BY tournament
    ORDER BY value DESC
    LIMIT 20
  `).all();
  res.json({ success: true, data });
});

// GET /api/statistics/top-scoring — 进球最多队伍
router.get('/top-scoring', (req, res) => {
  const db = getDb();
  const top = db.prepare(`
    SELECT team_name, SUM(goals_for) as total_goals, SUM(matches_played) as played,
      ROUND(CAST(SUM(goals_for) AS REAL) / SUM(matches_played), 2) as goals_per_game
    FROM team_stats
    GROUP BY team_name
    HAVING played > 50
    ORDER BY total_goals DESC
    LIMIT 20
  `).all();
  res.json({ success: true, data: top });
});

// GET /api/heatmap — 世界热力图数据
router.get('/heatmap', (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT country as name, COUNT(*) as match_count,
      SUM(home_score + away_score) as total_goals
    FROM matches
    WHERE country != 'Unknown'
    GROUP BY country
  `).all();
  res.json({ success: true, data });
});

module.exports = router;
