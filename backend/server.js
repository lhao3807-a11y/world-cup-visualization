const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');
const { seed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// API Routes
app.use('/api/matches', require('./routes/matches'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/rankings', require('./routes/rankings'));
app.use('/api/compare', require('./routes/comparison'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/live', require('./routes/live'));

// Health check
app.get('/api/health', (req, res) => {
  const db = getDb();
  const matchCount = db.prepare('SELECT COUNT(*) as c FROM matches').get();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      matches_count: matchCount.c,
      timestamp: new Date().toISOString()
    }
  });
});

// Serve frontend static files in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } });
      }
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  });
});

// Initialize database and start server
async function start() {
  try {
    console.log('[Server] Initializing database...');
    getDb(); // Ensure DB is created

    console.log('[Server] Running seed...');
    seed();

    app.listen(PORT, () => {
      console.log(`[Server] World Cup API running on http://localhost:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();
