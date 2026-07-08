/**
 * 排名数据 API 服务
 * 对应后端 GET /api/rankings
 */
import client from '../client'

export function fetchRankings(params) {
  return client.get('/rankings', { params })
}
