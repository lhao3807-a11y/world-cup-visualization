const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/live/matches — 获取当前实时比赛
router.get('/matches', (req, res) => {
  const db = getDb();
  // In production, this would fetch from external API and cache in live_matches table
  // For now, return the most recent matches as "live" simulation
  const recent = db.prepare(`
    SELECT *, 'finished' as status, NULL as minute
    FROM matches
    ORDER BY date DESC
    LIMIT 10
  `).all();

  // Also check if there are any stored live matches
  const live = db.prepare("SELECT * FROM live_matches WHERE status = 'live'").all();

  res.json({
    success: true,
    data: {
      live: live,
      recent: recent,
      last_updated: new Date().toISOString(),
      is_live_season: live.length > 0
    }
  });
});

// POST /api/live/trigger-sync — 手动触发同步
router.post('/trigger-sync', (req, res) => {
  // In production, this would trigger the external API sync
  res.json({
    success: true,
    message: 'Sync triggered. Live match data is simulated in this environment.',
    data: { synced_at: new Date().toISOString() }
  });
});

// GET /api/live/config — 同步配置信息
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      sync_interval_seconds: parseInt(process.env.LIVE_SYNC_INTERVAL || '60'),
      sync_enabled: process.env.LIVE_SYNC_ENABLED === 'true',
      api_provider: process.env.FOOTBALL_API_KEY ? 'Configured' : 'Not configured (simulated)'
    }
  });
});

module.exports = router;
