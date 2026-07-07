const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/timeline — 完整时间轴数据
router.get('/', (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT year,
      COUNT(*) as matches,
      SUM(home_score + away_score) as goals,
      ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals,
      COUNT(DISTINCT tournament) as tournaments,
      COUNT(DISTINCT home_team_norm) + COUNT(DISTINCT away_team_norm) as teams
    FROM matches
    GROUP BY year
    ORDER BY year
  `).all();
  res.json({ success: true, data });
});

// GET /api/timeline/:year — 特定年份详细数据
router.get('/:year', (req, res) => {
  const db = getDb();
  const year = parseInt(req.params.year);

  const stats = db.prepare(`
    SELECT year,
      COUNT(*) as matches,
      SUM(home_score + away_score) as goals,
      ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals
    FROM matches WHERE year = ? GROUP BY year
  `).get(year);

  if (!stats) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No data for this year' } });

  const matches = db.prepare('SELECT * FROM matches WHERE year = ? ORDER BY date').all(year);

  const topTeams = db.prepare(`
    SELECT team_name, matches_played, wins, draws, losses, goals_for, goals_against, elo_rating
    FROM team_stats WHERE year = ? ORDER BY elo_rating DESC LIMIT 10
  `).all(year);

  res.json({
    success: true,
    data: { stats, matches, topTeams }
  });
});

module.exports = router;
