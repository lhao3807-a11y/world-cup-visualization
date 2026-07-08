const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const { LRUCache } = require('lru-cache');
const footballApi = require('../services/footballApi');

// 缓存 live 数据仅 60 秒（实时数据不能缓存太久）
const liveCache = new LRUCache({ max: 10, ttl: 60 * 1000 });

// ========================
// GET /api/live/matches — 2026 世界杯实时比赛
// ========================
router.get('/matches', asyncHandler(async (req, res) => {
  const db = getDb();

  // 从 live_matches 表获取已同步的2026比赛
  const live2026 = db.prepare(`
    SELECT lm.*,
      CASE WHEN lm.status = 'live' THEN 1
           WHEN lm.status = 'finished' THEN 2
           ELSE 3 END as sort_order
    FROM live_matches lm
    ORDER BY sort_order, lm.start_time DESC
  `).all();

  // 统计
  const counts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live_count,
      SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished_count,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count
    FROM live_matches
  `).get();

  // 如果 live_matches 表为空，尝试从 matches 表取 2026 年数据
  let matches2026 = live2026;
  if (live2026.length === 0) {
    matches2026 = db.prepare(`
      SELECT *, 'finished' as status, NULL as minute, date as start_time, date as last_updated
      FROM matches WHERE year = 2026 ORDER BY date DESC
    `).all();
  }

  res.json({
    success: true,
    data: {
      matches: matches2026,
      counts,
      last_updated: new Date().toISOString(),
      is_live_season: counts.live_count > 0 || counts.scheduled_count > 0,
      api_configured: footballApi.isConfigured()
    }
  });
}));

// ========================
// POST /api/live/sync — 从 football-data.org 同步 2026 数据
// ========================
router.post('/sync', asyncHandler(async (req, res) => {
  const db = getDb();

  if (!footballApi.isConfigured()) {
    return res.json({
      success: true,
      message: 'FOOTBALL_API_KEY 未配置。请设置环境变量后重试。',
      synced: 0,
      data: { api_configured: false }
    });
  }

  try {
    // 拉取 2026 世界杯全部比赛
    const apiData = await footballApi.fetchWorldCup2026Matches();
    const matches = apiData.matches || [];

    // 使用事务批量 upsert
    const upsert = db.prepare(`
      INSERT INTO live_matches (match_id, home_team, away_team, home_score, away_score, status, minute, tournament, start_time, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(match_id) DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        status = excluded.status,
        minute = excluded.minute,
        last_updated = datetime('now')
    `);

    const syncMany = db.transaction((items) => {
      for (const m of items) {
        const normalized = footballApi.normalizeMatch(m);
        upsert.run(
          normalized.match_id,
          normalized.home_team,
          normalized.away_team,
          normalized.home_score,
          normalized.away_score,
          normalized.status,
          normalized.minute,
          'World Cup',
          m.utcDate || null
        );
      }
    });

    syncMany(matches);

    // 同步完成后，将已完成的比赛同步到 matches 主表
    const finishedMatches = db.prepare(
      "SELECT * FROM live_matches WHERE status = 'finished'"
    ).all();

    const insertToMatches = db.prepare(`
      INSERT OR REPLACE INTO matches (id, date, home_team, away_team, home_team_norm, away_team_norm,
        home_score, away_score, tournament, country, neutral, year, month, is_world_cup)
      VALUES ((SELECT id FROM matches WHERE date = ? AND home_team_norm = ? AND away_team_norm = ?),
        ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1)
    `);

    let syncedToMain = 0;
    for (const fm of finishedMatches) {
      const existing = db.prepare(
        'SELECT id FROM matches WHERE date = ? AND home_team = ? AND away_team = ? AND year = 2026'
      ).get(fm.start_time?.substring(0, 10), fm.home_team, fm.away_team);

      if (existing) {
        db.prepare('UPDATE matches SET home_score=?, away_score=? WHERE id=?')
          .run(fm.home_score, fm.away_score, existing.id);
      } else {
        // Insert new
        const date = fm.start_time?.substring(0, 10) || '';
        const month = date ? parseInt(date.substring(5, 7)) : 6;
        db.prepare(`
          INSERT INTO matches (date, home_team, away_team, home_team_norm, away_team_norm,
            home_score, away_score, tournament, country, neutral, year, month, is_world_cup)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'World Cup', 'United States / Mexico / Canada', 1, 2026, ?, 1)
        `).run(date, fm.home_team, fm.away_team, fm.home_team, fm.away_team,
          fm.home_score, fm.away_score, month);
      }
      syncedToMain++;
    }

    // 清除缓存
    liveCache.clear();

    res.json({
      success: true,
      message: `同步完成：${matches.length} 场比赛 (live_matches)，${syncedToMain} 场已写入主表`,
      synced: matches.length,
      data: {
        total: matches.length,
        live: matches.filter(m => m.status === 'IN_PLAY').length,
        finished: matches.filter(m => m.status === 'FINISHED').length,
        scheduled: matches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED').length,
        api_configured: true
      }
    });
  } catch (err) {
    console.error('[Live Sync] Error:', err.message);
    res.status(502).json({
      success: false,
      error: {
        code: 'SYNC_FAILED',
        message: `同步失败: ${err.message}`
      }
    });
  }
}));

// ========================
// POST /api/live/match — 手动添加/更新 2026 比赛
// ========================
router.post('/match', asyncHandler(async (req, res) => {
  const db = getDb();
  const { date, home_team, away_team, home_score, away_score, status } = req.body;

  if (!date || !home_team || !away_team) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAMS', message: 'date, home_team, away_team are required' }
    });
  }

  const matchId = `manual_${date}_${home_team}_${away_team}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Upsert into live_matches
  db.prepare(`
    INSERT INTO live_matches (match_id, home_team, away_team, home_score, away_score, status, minute, tournament, start_time, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, NULL, 'World Cup', ?, datetime('now'))
    ON CONFLICT(match_id) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      status = excluded.status,
      last_updated = datetime('now')
  `).run(matchId, home_team, away_team, home_score || 0, away_score || 0, status || 'scheduled', date);

  // 同时写入 matches 主表（如果已完成）
  if (status === 'finished') {
    const month = date.substring(5, 7);
    const existing = db.prepare(
      'SELECT id FROM matches WHERE date = ? AND home_team = ? AND away_team = ? AND year = 2026'
    ).get(date, home_team, away_team);

    if (existing) {
      db.prepare('UPDATE matches SET home_score=?, away_score=? WHERE id=?')
        .run(home_score, away_score, existing.id);
    } else {
      db.prepare(`
        INSERT INTO matches (date, home_team, away_team, home_team_norm, away_team_norm,
          home_score, away_score, tournament, country, neutral, year, month, is_world_cup)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'World Cup', 'United States / Mexico / Canada', 1, 2026, ?, 1)
      `).run(date, home_team, away_team, home_team, away_team, home_score, away_score, parseInt(month));
    }
  }

  liveCache.clear();

  res.json({
    success: true,
    message: `比赛已${status === 'finished' ? '录入并写入主表' : '添加'}`,
    data: { match_id: matchId, date, home_team, away_team, home_score, away_score, status }
  });
}));

// ========================
// DELETE /api/live/match/:matchId — 删除比赛
// ========================
router.delete('/match/:matchId', asyncHandler(async (req, res) => {
  const db = getDb();
  const { matchId } = req.params;
  const result = db.prepare('DELETE FROM live_matches WHERE match_id = ?').run(matchId);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Match not found' } });
  }

  liveCache.clear();
  res.json({ success: true, message: '比赛已删除' });
}));

// ========================
// GET /api/live/config — 配置信息
// ========================
router.get('/config', asyncHandler(async (req, res) => {
  const db = getDb();
  const matchCount = db.prepare('SELECT COUNT(*) as c FROM live_matches').get();
  const mainCount = db.prepare('SELECT COUNT(*) as c FROM matches WHERE year = 2026').get();

  res.json({
    success: true,
    data: {
      sync_interval_seconds: parseInt(process.env.LIVE_SYNC_INTERVAL || '60'),
      sync_enabled: process.env.LIVE_SYNC_ENABLED === 'true',
      api_configured: footballApi.isConfigured(),
      api_provider: footballApi.isConfigured() ? 'football-data.org v4' : 'Not configured',
      live_matches_count: matchCount.c,
      main_table_2026_count: mainCount.c,
      supported_actions: [
        'POST /api/live/sync        — 从 football-data.org 同步',
        'POST /api/live/match       — 手动添加/更新比赛',
        'DELETE /api/live/match/:id — 删除比赛'
      ]
    }
  });
}));

module.exports = router;
