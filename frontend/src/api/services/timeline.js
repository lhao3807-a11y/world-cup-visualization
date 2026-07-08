/**
 * 时间轴 API 服务
 * 对应后端 GET /api/timeline/*
 */
import client from '../client'

export function fetchTimeline() {
  return client.get('/timeline')
}

export function fetchTimelineYear(year) {
  return client.get(`/timeline/${year}`)
}
