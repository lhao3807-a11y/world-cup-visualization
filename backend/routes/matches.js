const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/matches — 分页+筛选查询世界杯比赛
router.get('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const {
    page = 1, limit = 50,
    year_gte, year_lte,
    home_team, away_team, team,
    country, neutral,
    sort = 'date', order = 'desc'
  } = req.query;

  const conditions = [];
  const params = [];

  if (year_gte) { conditions.push('year >= ?'); params.push(parseInt(year_gte)); }
  if (year_lte) { conditions.push('year <= ?'); params.push(parseInt(year_lte)); }
  if (home_team) { conditions.push('home_team_norm = ?'); params.push(home_team); }
  if (away_team) { conditions.push('away_team_norm = ?'); params.push(away_team); }
  if (team) { conditions.push('(home_team_norm = ? OR away_team_norm = ?)'); params.push(team, team); }
  if (country) { conditions.push('country = ?'); params.push(country); }
  if (neutral !== undefined) { conditions.push('neutral = ?'); params.push(parseInt(neutral)); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const allowedSorts = ['date', 'home_score', 'away_score', 'year'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'date';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const limitNum = Math.min(parseInt(limit) || 50, 200);
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limitNum;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM matches ${where}`).get(...params);
  const rows = db.prepare(`SELECT * FROM matches ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

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

// GET /api/matches/:id — 单场比赛详情
router.get('/:id', asyncHandler(async (req, res) => {
  const db = getDb();
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(parseInt(req.params.id));
  if (!match) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Match not found' } });
  }
  res.json({ success: true, data: match });
}));

module.exports = router;
