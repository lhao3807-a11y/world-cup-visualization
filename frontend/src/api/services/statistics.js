/**
 * 统计数据 API 服务
 * 对应后端 GET /api/statistics/*
 */
import client from '../client'

export function fetchOverview() {
  return client.get('/statistics/overview')
}

export function fetchYearly(params) {
  return client.get('/statistics/yearly', { params })
}

export function fetchChampions() {
  return client.get('/statistics/champions')
}

export function fetchGoalsTrend() {
  return client.get('/statistics/goals-trend')
}

export function fetchTournamentDistribution() {
  return client.get('/statistics/tournament-distribution')
}

export function fetchTopScoring() {
  return client.get('/statistics/top-scoring')
}

export function fetchHeatmap() {
  return client.get('/statistics/heatmap')
}
