const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/tournaments — 所有赛事列表
router.get('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const tournaments = db.prepare(`
    SELECT tournament as name, COUNT(*) as match_count,
      MIN(year) as first_year, MAX(year) as last_year,
      SUM(home_score + away_score) as total_goals
    FROM matches
    GROUP BY tournament
    ORDER BY match_count DESC
  `).all();
  res.json({ success: true, data: tournaments });
}));

// GET /api/tournaments/:name — 赛事详情
router.get('/:name', asyncHandler(async (req, res) => {
  const db = getDb();
  const name = req.params.name;
  const stats = db.prepare(`
    SELECT tournament as name, COUNT(*) as match_count,
      MIN(year) as first_year, MAX(year) as last_year,
      SUM(home_score + away_score) as total_goals,
      COUNT(DISTINCT home_team_norm) + COUNT(DISTINCT away_team_norm) as teams_count
    FROM matches WHERE tournament = ?
    GROUP BY tournament
  `).get(name);

  if (!stats) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } });
  }

  res.json({ success: true, data: stats });
}));

module.exports = router;
