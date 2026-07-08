const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/teams — 所有队伍列表
router.get('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const teams = db.prepare('SELECT * FROM teams ORDER BY current_name').all();
  res.json({ success: true, data: teams });
}));

// GET /api/teams/:name — 队伍详情 + 全时期数据
router.get('/:name', asyncHandler(async (req, res) => {
  const db = getDb();
  const name = req.params.name;

  const team = db.prepare('SELECT * FROM teams WHERE current_name = ? OR original_name = ?').get(name, name);
  if (!team) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
  }

  const allTime = db.prepare(`
    SELECT
      SUM(matches_played) as total_played,
      SUM(wins) as total_wins,
      SUM(draws) as total_draws,
      SUM(losses) as total_losses,
      SUM(goals_for) as total_gf,
      SUM(goals_against) as total_ga
    FROM team_stats WHERE team_name = ?
  `).get(team.current_name);

  const yearly = db.prepare('SELECT * FROM team_stats WHERE team_name = ? ORDER BY year DESC').all(team.current_name);

  const worldCupWins = db.prepare(`
    SELECT COUNT(*) as wc_wins FROM matches
    WHERE (home_team_norm = ? OR away_team_norm = ?)
    AND tournament LIKE '%World Cup%'
    AND ((home_team_norm = ? AND home_score > away_score) OR (away_team_norm = ? AND away_score > home_score))
  `).get(team.current_name, team.current_name, team.current_name, team.current_name);

  res.json({
    success: true,
    data: {
      ...team,
      stats: allTime,
      yearly,
      worldCupWins: worldCupWins.wc_wins
    }
  });
}));

// GET /api/teams/:name/matches — 队伍比赛记录
router.get('/:name/matches', asyncHandler(async (req, res) => {
  const db = getDb();
  const name = req.params.name;
  const { page = 1, limit = 50 } = req.query;
  const limitNum = Math.min(parseInt(limit) || 50, 200);
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limitNum;

  const countRow = db.prepare(
    'SELECT COUNT(*) as total FROM matches WHERE home_team_norm = ? OR away_team_norm = ?'
  ).get(name, name);

  const rows = db.prepare(
    'SELECT * FROM matches WHERE home_team_norm = ? OR away_team_norm = ? ORDER BY date DESC LIMIT ? OFFSET ?'
  ).all(name, name, limitNum, offset);

  res.json({
    success: true,
    data: rows,
    meta: {
      page: parseInt(page),
      limit: limitNum,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limitNum)
    }
  });
}));

module.exports = router;
