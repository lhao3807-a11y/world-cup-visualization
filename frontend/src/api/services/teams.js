/**
 * 队伍数据 API 服务
 * 对应后端 GET /api/teams/*
 */
import client from '../client'

export function fetchTeams() {
  return client.get('/teams')
}

export function fetchTeamDetail(name) {
  return client.get(`/teams/${encodeURIComponent(name)}`)
}

export function fetchTeamMatches(name, params) {
  return client.get(`/teams/${encodeURIComponent(name)}/matches`, { params })
}
