/**
 * logger.js — 轻量级结构化日志
 *
 * 替代裸 console.log，提供统一的日志格式和级别控制。
 * 生产环境: LOG_LEVEL=info 时跳过 debug 日志
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'debug'] || 0

function format(level, module, message, data) {
  const ts = new Date().toISOString()
  const base = `[${ts}] [${level.toUpperCase()}] [${module}] ${message}`
  if (data !== undefined) {
    try {
      return `${base} ${JSON.stringify(data)}`
    } catch {
      return `${base} ${String(data)}`
    }
  }
  return base
}

const logger = {
  debug(module, message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.debug) console.log(format('debug', module, message, data))
  },
  info(module, message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.info) console.log(format('info', module, message, data))
  },
  warn(module, message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.warn) console.warn(format('warn', module, message, data))
  },
  error(module, message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.error) console.error(format('error', module, message, data))
  },
  /** 请求专用日志 */
  request(method, url, statusCode, ms) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    logger[level]('http', `${method} ${url}`, { status: statusCode, ms })
  }
}

module.exports = logger
