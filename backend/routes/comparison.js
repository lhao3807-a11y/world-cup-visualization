const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/compare/teams — 两支队伍对比
router.post('/teams', asyncHandler(async (req, res) => {
  const db = getDb();
  const { team_a, team_b } = req.body;

  if (!team_a || !team_b) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'team_a and team_b are required' } });
  }

  // Head-to-head matches
  const h2h = db.prepare(`
    SELECT * FROM matches
    WHERE (home_team_norm = ? AND away_team_norm = ?)
       OR (home_team_norm = ? AND away_team_norm = ?)
    ORDER BY date DESC
  `).all(team_a, team_b, team_b, team_a);

  // Team A all-time stats
  const statsA = db.prepare(`
    SELECT SUM(matches_played) as played, SUM(wins) as wins, SUM(draws) as draws, SUM(losses) as losses,
      SUM(goals_for) as gf, SUM(goals_against) as ga
    FROM team_stats WHERE team_name = ?
  `).get(team_a);

  // Team B all-time stats
  const statsB = db.prepare(`
    SELECT SUM(matches_played) as played, SUM(wins) as wins, SUM(draws) as draws, SUM(losses) as losses,
      SUM(goals_for) as gf, SUM(goals_against) as ga
    FROM team_stats WHERE team_name = ?
  `).get(team_b);

  // Head-to-head summary
  const h2hSummary = { teamA_wins: 0, teamB_wins: 0, draws: 0, teamA_goals: 0, teamB_goals: 0 };
  for (const m of h2h) {
    if (m.home_team_norm === team_a) {
      h2hSummary.teamA_goals += m.home_score;
      h2hSummary.teamB_goals += m.away_score;
      if (m.home_score > m.away_score) h2hSummary.teamA_wins++;
      else if (m.home_score < m.away_score) h2hSummary.teamB_wins++;
      else h2hSummary.draws++;
    } else {
      h2hSummary.teamA_goals += m.away_score;
      h2hSummary.teamB_goals += m.home_score;
      if (m.away_score > m.home_score) h2hSummary.teamA_wins++;
      else if (m.away_score < m.home_score) h2hSummary.teamB_wins++;
      else h2hSummary.draws++;
    }
  }

  // Recent form (last 10 matches)
  const recentA = db.prepare(`
    SELECT * FROM matches WHERE (home_team_norm = ? OR away_team_norm = ?) ORDER BY date DESC LIMIT 10
  `).all(team_a, team_a);

  const recentB = db.prepare(`
    SELECT * FROM matches WHERE (home_team_norm = ? OR away_team_norm = ?) ORDER BY date DESC LIMIT 10
  `).all(team_b, team_b);

  res.json({
    success: true,
    data: {
      team_a: { name: team_a, stats: statsA, recent: recentA },
      team_b: { name: team_b, stats: statsB, recent: recentB },
      head_to_head: { matches: h2h.slice(0, 20), summary: h2hSummary },
      radar: {
        indicators: ['胜率', '总进球', '场均进球', '失球数', '比赛场次', '胜场数'],
        team_a: [
          statsA.played > 0 ? Math.round((statsA.wins / statsA.played) * 100) : 0,
          statsA.gf || 0,
          statsA.played > 0 ? Math.round((statsA.gf / statsA.played) * 100) / 100 : 0,
          statsA.ga || 0,
          statsA.played || 0,
          statsA.wins || 0
        ],
        team_b: [
          statsB.played > 0 ? Math.round((statsB.wins / statsB.played) * 100) : 0,
          statsB.gf || 0,
          statsB.played > 0 ? Math.round((statsB.gf / statsB.played) * 100) / 100 : 0,
          statsB.ga || 0,
          statsB.played || 0,
          statsB.wins || 0
        ]
      }
    }
  });
}));

module.exports = router;
