/**
 * 比赛数据 API 服务
 * 对应后端 GET /api/matches/*
 */
import client from '../client'

export function fetchMatches(params) {
  return client.get('/matches', { params })
}

export function fetchMatchById(id) {
  return client.get(`/matches/${id}`)
}
