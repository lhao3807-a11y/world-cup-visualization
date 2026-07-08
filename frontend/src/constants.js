/**
 * constants.js — 全局常量定义
 */

// 世界杯 — 共23届 (1930-2026)，比赛数据覆盖22届 (1930-2022)
// 2026年第23届美加墨世界杯，CSV数据为模拟比分故不导入
export const WC_MIN_YEAR = 1930
export const WC_MAX_YEAR = 2026
export const WC_VERIFIED_MAX_YEAR = 2022
export const WC_TOTAL_EDITIONS = 23

// 跳过的非世界杯年份 (二战)
export const WC_SKIP_YEARS = [1942, 1946]

// 分页
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200

// 缓存 TTL (毫秒)
export const CACHE_TTL_5MIN = 5 * 60 * 1000

// 请求
export const REQUEST_TIMEOUT = 15000

// 轮询
export const LIVE_POLL_INTERVAL = 60000

// 动画
export const COUNTUP_DURATION = 1200
export const COUNTUP_DELAY_STAGGER = 150

// Elo
export const DEFAULT_ELO = 1500
export const ELO_K_WC_FINAL = 60
export const ELO_K_CONTINENTAL = 40
export const ELO_K_FRIENDLY = 20

// 图表配色
export const COLOR_BLUE = '#2374FF'
export const COLOR_CYAN = '#00C48C'
export const COLOR_ORANGE = '#FF7D34'
export const COLOR_PURPLE = '#9966FF'
export const COLOR_DANGER = '#f56c6c'
