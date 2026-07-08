const rateLimit = require('express-rate-limit')

/**
 * 通用 API 速率限制
 * 每个 IP 每分钟最多 120 次请求
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' }
  }
})

/**
 * POST 接口更严格的速率限制
 * 每个 IP 每分钟最多 30 次 POST 请求
 */
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' }
  }
})

module.exports = { apiLimiter, postLimiter }
