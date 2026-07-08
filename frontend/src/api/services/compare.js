/**
 * 队伍对比 API 服务
 * 对应后端 POST /api/compare/teams
 */
import client from '../client'

export function compareTeams(teamA, teamB) {
  return client.post('/compare/teams', { team_a: teamA, team_b: teamB })
}
