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

  // 2026 年为第23届世界杯 — 从主表 + live_matches 获取
  if (year === 2026) {
    const mainMatches = db.prepare('SELECT * FROM matches WHERE year = 2026 ORDER BY date').all();

    // 已完成的比赛已在主表中，这里额外获取未开始/进行中的
    const pendingMatches = db.prepare(`
      SELECT match_id as id, start_time as date, home_team, away_team,
             home_score, away_score, 'World Cup' as tournament, status,
             'United States / Mexico / Canada' as country, 1 as neutral,
             2026 as year, CAST(substr(start_time,6,2) AS INTEGER) as month, 1 as is_world_cup
      FROM live_matches WHERE status != 'finished' ORDER BY start_time
    `).all();

    const allMatches = [...mainMatches, ...pendingMatches];
    const totalGoals = allMatches.reduce((s, m) => s + (m.home_score || 0) + (m.away_score || 0), 0);
    const avgG = allMatches.length > 0 ? (totalGoals / allMatches.length).toFixed(2) : 0;

    return res.json({
      success: true,
      data: {
        stats: { year: 2026, matches: allMatches.length, goals: totalGoals, avg_goals: parseFloat(avgG) },
        matches: allMatches,
        topTeams: [],
        is_current: true,
        edition: 23,
        note: allMatches.length > 0
          ? `2026年美加墨世界杯 — 第23届，已录入 ${allMatches.length} 场比赛`
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
