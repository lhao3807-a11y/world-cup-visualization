const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/timeline — 完整时间轴数据
router.get('/', asyncHandler(async (req, res) => {
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
}));

// GET /api/timeline/:year — 特定年份详细数据
router.get('/:year', asyncHandler(async (req, res) => {
  const db = getDb();
  const year = parseInt(req.params.year);

  // 2026 年为第23届世界杯 — 优先从 live_matches + matches 表获取
  if (year === 2026) {
    const liveMatches = db.prepare(`
      SELECT match_id as id, start_time as date, home_team, away_team,
             home_score, away_score, 'World Cup' as tournament, status,
             'United States / Mexico / Canada' as country, 1 as neutral,
             2026 as year, CAST(substr(start_time,6,2) AS INTEGER) as month, 1 as is_world_cup
      FROM live_matches ORDER BY start_time
    `).all();

    const mainMatches = db.prepare('SELECT * FROM matches WHERE year = 2026 ORDER BY date').all();

    // 去重合并
    const seen = new Set(mainMatches.map(m => m.id));
    const merged = [...mainMatches];
    for (const lm of liveMatches) {
      if (!seen.has(lm.id) && lm.status === 'finished') {
        merged.push(lm);
      }
    }

    const totalGoals = merged.reduce((s, m) => s + (m.home_score || 0) + (m.away_score || 0), 0);
    const avgG = merged.length > 0 ? (totalGoals / merged.length).toFixed(2) : 0;

    return res.json({
      success: true,
      data: {
        stats: { year: 2026, matches: merged.length, goals: totalGoals, avg_goals: parseFloat(avgG) },
        matches: merged,
        topTeams: [],
        is_current: true,
        edition: 23,
        note: merged.length > 0
          ? `2026年美加墨世界杯 — 第23届，已录入 ${merged.length} 场比赛`
          : '2026年美加墨世界杯 — 第23届，比赛数据待更新'
      }
    });
  }

  const stats = db.prepare(`
    SELECT year,
      COUNT(*) as matches,
      SUM(home_score + away_score) as goals,
      ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals
    FROM matches WHERE year = ? GROUP BY year
  `).get(year);

  if (!stats) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No data for this year' } });
  }

  const matches = db.prepare('SELECT * FROM matches WHERE year = ? ORDER BY date').all(year);

  const topTeams = db.prepare(`
    SELECT team_name, matches_played, wins, draws, losses, goals_for, goals_against, elo_rating
    FROM team_stats WHERE year = ? ORDER BY elo_rating DESC LIMIT 10
  `).all(year);

  res.json({
    success: true,
    data: { stats, matches, topTeams }
  });
}));

module.exports = router;
