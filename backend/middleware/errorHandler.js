/**
 * 统一错误处理中间件
 * 包裹所有路由处理器，自动捕获异步错误
 */

/**
 * 异步路由包装器 — 自动捕获 Promise rejection 并传递给 next()
 * 用法: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 全局错误处理中间件 (Express error-handling middleware)
 * 必须在所有路由之后注册
 */
function globalErrorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_ERROR'
  const message = statusCode === 500 ? 'Internal server error' : err.message

  if (statusCode === 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err)
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message }
  })
}

/**
 * 创建带状态码的业务错误
 */
function createError(statusCode, code, message) {
  const err = new Error(message)
  err.statusCode = statusCode
  err.code = code
  return err
}

module.exports = { asyncHandler, globalErrorHandler, createError }
