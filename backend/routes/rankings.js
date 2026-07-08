const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// 排序字段白名单映射 — 防止 SQL 注入
const SORT_COLUMNS = {
  elo: { yearly: 'ts.elo_rating', alltime: 'elo_rating' },
  goals: { yearly: 'ts.goals_for', alltime: 'total_gf' },
  wins: { yearly: 'ts.wins', alltime: 'total_wins' }
};

// GET /api/rankings — 队伍排名
router.get('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const { year, metric = 'elo', limit = 50 } = req.query;

  // 白名单校验 metric
  const safeMetric = SORT_COLUMNS[metric] ? metric : 'elo';
  const limitNum = Math.min(parseInt(limit) || 50, 100);

  let data;
  if (year) {
    const sortCol = SORT_COLUMNS[safeMetric].yearly;
    data = db.prepare(`
      SELECT ts.*, t.color_code, t.secondary_color_code
      FROM team_stats ts
      LEFT JOIN teams t ON ts.team_name = t.current_name
      WHERE ts.year = ? AND ts.matches_played > 0
      ORDER BY ${sortCol} DESC
      LIMIT ?
    `).all(parseInt(year), limitNum);
  } else {
    const sortCol = SORT_COLUMNS[safeMetric].alltime;
    data = db.prepare(`
      SELECT
        team_name,
        SUM(matches_played) as total_played,
        SUM(wins) as total_wins,
        SUM(draws) as total_draws,
        SUM(losses) as total_losses,
        SUM(goals_for) as total_gf,
        SUM(goals_against) as total_ga,
        ROUND(CAST(SUM(wins) AS REAL) / SUM(matches_played) * 100, 2) as win_rate,
        (SELECT elo_rating FROM team_stats ts2 WHERE ts2.team_name = ts.team_name ORDER BY ts2.year DESC LIMIT 1) as elo_rating,
        (SELECT color_code FROM teams t WHERE t.current_name = ts.team_name LIMIT 1) as color_code
      FROM team_stats ts
      GROUP BY team_name
      HAVING total_played > 10
      ORDER BY ${sortCol} DESC
      LIMIT ?
    `).all(limitNum);
  }

  res.json({ success: true, data });
}));

module.exports = router;
