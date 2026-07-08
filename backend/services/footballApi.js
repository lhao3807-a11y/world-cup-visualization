/**
 * footballApi.js — 足球数据 API 对接层
 *
 * 支持 football-data.org v4 API (免费套餐: 10次/分钟)
 * 文档: https://www.football-data.org/documentation/quickstart
 *
 * 环境变量:
 *   FOOTBALL_API_KEY      — API 密钥 (必填)
 *   FOOTBALL_API_BASE_URL — 默认 https://api.football-data.org/v4
 */

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY || ''
const BASE_URL = process.env.FOOTBALL_API_BASE_URL || 'https://api.football-data.org/v4'

// 世界杯赛事 ID (football-data.org)
const WORLD_CUP_ID = 'WC'
const SEASON_2026 = 2026

function isConfigured() {
  return !!FOOTBALL_API_KEY
}

/**
 * 通用请求封装，自动处理 rate limit
 */
async function apiRequest(path) {
  if (!isConfigured()) {
    throw new Error('FOOTBALL_API_KEY not configured')
  }

  const url = `${BASE_URL}${path}`
  console.log(`[FootballAPI] GET ${url}`)

  const response = await fetch(url, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY }
  })

  // Rate limit headers
  const remaining = response.headers.get('X-Requests-Available-Minute')
  if (remaining && parseInt(remaining) < 5) {
    console.warn(`[FootballAPI] Rate limit low: ${remaining} remaining`)
  }

  if (!response.ok) {
    throw new Error(`Football API error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取 2026 世界杯所有比赛
 * 返回格式:
 * {
 *   competition: { name, ... },
 *   matches: [{
 *     id, utcDate, status, matchday, stage,
 *     homeTeam: { name, shortName, crest },
 *     awayTeam: { name, shortName, crest },
 *     score: { winner, fullTime: { home, away }, halfTime: { home, away } }
 *   }, ...]
 * }
 */
async function fetchWorldCup2026Matches() {
  const data = await apiRequest(`/competitions/${WORLD_CUP_ID}/matches?season=${SEASON_2026}`)
  return data
}

/**
 * 获取 2026 世界杯比赛日列表
 */
async function fetchWorldCup2026Matchday(matchday) {
  const data = await apiRequest(
    `/competitions/${WORLD_CUP_ID}/matches?season=${SEASON_2026}&matchday=${matchday}`
  )
  return data
}

/**
 * 获取 2026 世界杯积分榜
 */
async function fetchWorldCup2026Standings() {
  const data = await apiRequest(`/competitions/${WORLD_CUP_ID}/standings?season=${SEASON_2026}`)
  return data
}

/**
 * 将 football-data.org 比赛数据转换为数据库格式
 */
function normalizeMatch(apiMatch) {
  const date = apiMatch.utcDate?.substring(0, 10) || ''
  const homeTeam = apiMatch.homeTeam?.name || ''
  const awayTeam = apiMatch.awayTeam?.name || ''
  const homeScore = apiMatch.score?.fullTime?.home ?? apiMatch.score?.regularTime?.home ?? 0
  const awayScore = apiMatch.score?.fullTime?.away ?? apiMatch.score?.regularTime?.away ?? 0

  let status = 'scheduled'
  if (apiMatch.status === 'FINISHED') status = 'finished'
  else if (apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED') status = 'live'
  else if (apiMatch.status === 'POSTPONED') status = 'postponed'

  return {
    match_id: String(apiMatch.id),
    date,
    home_team: homeTeam,
    away_team: awayTeam,
    home_team_norm: homeTeam,
    away_team_norm: awayTeam,
    home_score: homeScore,
    away_score: awayScore,
    status,
    minute: null, // football-data.org v4 不提供分钟数
    tournament: 'World Cup',
    country: 'United States / Mexico / Canada',
    neutral: 1,
    year: 2026,
    month: date ? parseInt(date.substring(5, 7)) : 6,
    is_world_cup: 1,
    stage: apiMatch.stage || '',
    matchday: apiMatch.matchday || 0
  }
}

module.exports = {
  isConfigured,
  fetchWorldCup2026Matches,
  fetchWorldCup2026Matchday,
  fetchWorldCup2026Standings,
  normalizeMatch
}
