/**
 * 实时赛事 API 服务
 * 对应后端 GET /api/live/*
 */
import client from '../client'

export function fetchLiveMatches() {
  return client.get('/live/matches')
}

export function fetchLiveConfig() {
  return client.get('/live/config')
}

export function triggerSync() {
  return client.post('/live/trigger-sync')
}
