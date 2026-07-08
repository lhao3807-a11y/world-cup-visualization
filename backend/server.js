// 加载 .env 文件（本地开发用，生产环境由平台注入环境变量）
try {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
} catch {
  // dotenv not available in production, env vars are set by platform
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { getDb } = require('./db');
const { seed } = require('./seed');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter, postLimiter } = require('./middleware/security');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// 安全 & 基础中间件
// ========================

// Helmet 安全响应头 (CSP, X-Frame-Options, HSTS 等)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS — 生产环境限制来源
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://worldcup-football-viz.vercel.app',
      /^https:\/\/worldcup-football.*\.vercel\.app$/,  // 允许所有 Vercel 预览分支
    ];

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求 (如 curl、Postman、同源请求)
    if (!origin) return callback(null, true);
    // 检查字符串匹配和正则匹配
    const allowed = ALLOWED_ORIGINS.some(o =>
      (typeof o === 'string' && o === origin) ||
      (o instanceof RegExp && o.test(origin))
    );
    if (allowed) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// 全 API 速率限制
app.use('/api', apiLimiter);
// POST 接口更严格的限制
app.use('/api/compare', postLimiter);

// 请求日志 (使用结构化 logger)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, ms);
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

// Health check — 增强诊断
app.get('/api/health', (req, res) => {
  try {
    const db = getDb();
    const matchCount = db.prepare('SELECT COUNT(*) as c FROM matches').get();
    const teamCount = db.prepare('SELECT COUNT(*) as c FROM teams').get();
    const memUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: Math.round(process.uptime()),
        matches_count: matchCount.c,
        teams_count: teamCount.c,
        memory_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        node_version: process.version,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Database connection failed' }
    });
  }
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

// 全局错误处理 (在所有路由之后)
app.use(globalErrorHandler);

// Initialize database and start server
async function start() {
  try {
    logger.info('server', 'Initializing database...');
    getDb();

    logger.info('server', 'Running seed...');
    seed();

    app.listen(PORT, () => {
      logger.info('server', `World Cup API running on http://localhost:${PORT}`);
      logger.info('server', `Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    logger.error('server', 'Failed to start', { error: err.message });
    process.exit(1);
  }
}

start();
