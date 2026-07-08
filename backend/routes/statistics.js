const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const { LRUCache } = require('lru-cache');

// LRU 缓存 — 5 分钟
const cache = new LRUCache({ max: 100, ttl: 5 * 60 * 1000 });

function cached(key, fn) {
  if (cache.has(key)) return cache.get(key);
  const result = fn();
  cache.set(key, result);
  return result;
}

// GET /api/statistics/overview — 世界杯总览 KPI
router.get('/overview', asyncHandler(async (req, res) => {
  const db = getDb();

  const data = cached('overview', () => {
    const overview = db.prepare(`
      SELECT
        COUNT(*) as total_matches,
        SUM(home_score + away_score) as total_goals,
        (SELECT COUNT(DISTINCT team) FROM (
          SELECT home_team_norm AS team FROM matches
          UNION SELECT away_team_norm AS team FROM matches
        )) as total_teams,
        COUNT(DISTINCT country) as host_countries,
        MIN(date) as first_match_date,
        MAX(date) as last_match_date,
        ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals
      FROM matches
    `).get();

    // 1930-2026 共23届世界杯，第23届(2026美加墨)比赛数据待更新
    overview.total_editions = 23;

    const biggestWin = db.prepare(`
      SELECT *, ABS(home_score - away_score) as diff
      FROM matches ORDER BY diff DESC LIMIT 1
    `).get();

    const mostGoals = db.prepare(`
      SELECT *, (home_score + away_score) as total
      FROM matches ORDER BY total DESC LIMIT 1
    `).get();

    const latestEdition = db.prepare(`
      SELECT year, country FROM matches
      ORDER BY date DESC LIMIT 1
    `).get();

    // 22届已完成 + 1届正在进行 (2026美加墨) = 共23届
    overview.total_editions = 23;

    return { overview, biggestWin, mostGoals, latestEdition };
  });

  res.json({ success: true, data });
}));

// GET /api/statistics/yearly — 年度统计（仅世界杯年）
router.get('/yearly', asyncHandler(async (req, res) => {
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
}));

// GET /api/statistics/champions — 世界杯冠军统计
router.get('/champions', asyncHandler(async (req, res) => {
  const db = getDb();

  const penaltyWinners = { '1994': 'Brazil', '2006': 'Italy', '2022': 'Argentina' };

  const data = cached('champions', () => {
    const wcYears = db.prepare('SELECT DISTINCT year FROM matches ORDER BY year').all();
    const champions = {};

    for (const { year } of wcYears) {
      const lastMatch = db.prepare(`
        SELECT * FROM matches WHERE year = ? ORDER BY date DESC, id DESC LIMIT 1
      `).get(year);

      if (!lastMatch) continue;

      let winner;
      if (lastMatch.home_score > lastMatch.away_score) winner = lastMatch.home_team_norm;
      else if (lastMatch.away_score > lastMatch.home_score) winner = lastMatch.away_team_norm;
      else winner = penaltyWinners[String(year)] || null;

      if (winner) {
        if (year === 1950) winner = 'Uruguay';
        if (!champions[winner]) champions[winner] = { team: winner, titles: 0, years: [], runner_ups: 0 };
        champions[winner].titles++;
        champions[winner].years.push(year);
      }
    }

    return Object.values(champions).sort((a, b) => b.titles - a.titles);
  });

  res.json({ success: true, data });
}));

// GET /api/statistics/goals-trend — 世界杯进球趋势
router.get('/goals-trend', asyncHandler(async (req, res) => {
  const db = getDb();
  const data = cached('goals_trend', () => db.prepare(`
    SELECT year, SUM(home_score + away_score) as total_goals,
      COUNT(*) as matches,
      ROUND(CAST(SUM(home_score + away_score) AS REAL) / COUNT(*), 2) as avg_goals
    FROM matches GROUP BY year ORDER BY year
  `).all());
  res.json({ success: true, data });
}));

// GET /api/statistics/top-scoring — 世界杯历史进球排名
router.get('/top-scoring', asyncHandler(async (req, res) => {
  const db = getDb();
  const data = cached('top_scoring', () => db.prepare(`
    SELECT team_name, SUM(goals_for) as total_goals, SUM(matches_played) as played,
      ROUND(CAST(SUM(goals_for) AS REAL) / SUM(matches_played), 2) as goals_per_game
    FROM team_stats GROUP BY team_name
    HAVING played > 5 ORDER BY total_goals DESC LIMIT 20
  `).all());
  res.json({ success: true, data });
}));

// GET /api/statistics/heatmap — 世界杯举办国热力图
router.get('/heatmap', asyncHandler(async (req, res) => {
  const db = getDb();
  const data = cached('heatmap', () => db.prepare(`
    SELECT country as name, COUNT(*) as match_count,
      SUM(home_score + away_score) as total_goals
    FROM matches WHERE country != 'Unknown'
    GROUP BY country
  `).all());
  res.json({ success: true, data });
}));

module.exports = router;
