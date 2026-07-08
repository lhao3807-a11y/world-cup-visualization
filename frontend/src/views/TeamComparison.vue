<template>
  <div class="team-comparison">
    <div class="page-header">
      <h2>⚔️ 世界杯队伍对比</h2>
      <p>对比两支世界杯队伍的历史数据与交锋记录</p>
    </div>

    <TeamSelectors :teams="teamStore.teams" :loaded="teamStore.loaded" @compare="handleCompare" />

    <div v-if="result">
      <H2HSummary :teamA="teamA" :teamB="teamB" :summary="result.head_to_head?.summary" />
      <ComparisonCharts :result="result" :teamA="teamA" :teamB="teamB" />

      <!-- H2H 交锋记录 -->
      <div class="chart-card card-block" style="cursor:default;" v-if="result.head_to_head?.matches?.length">
        <h3 class="module-title" style="margin-bottom:10px;">🤝 世界杯交锋记录</h3>
        <el-table :data="result.head_to_head.matches" max-height="400" style="width:100%">
          <el-table-column prop="date" label="日期" width="120">
            <template #default="{ row }"><span style="color:var(--text-muted);font-size:13px;">{{ row.date }}</span></template>
          </el-table-column>
          <el-table-column label="主队">
            <template #default="{ row }">
              <span :style="{ fontWeight: row.home_team_norm === teamA ? 700 : 400, color: 'var(--text-primary)' }">{{ row.home_team }}</span>
            </template>
          </el-table-column>
          <el-table-column label="比分" width="100" align="center">
            <template #default="{ row }"><ScoreCell :homeScore="row.home_score" :awayScore="row.away_score" /></template>
          </el-table-column>
          <el-table-column label="客队">
            <template #default="{ row }">
              <span :style="{ fontWeight: row.away_team_norm === teamB ? 700 : 400, color: 'var(--text-primary)' }">{{ row.away_team }}</span>
            </template>
          </el-table-column>
          <el-table-column label="举办国" width="130">
            <template #default="{ row }"><span style="color:var(--text-secondary);font-size:13px;">{{ row.country }}</span></template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div v-else class="card-block" style="text-align:center;padding:60px;cursor:default;">
      <span style="font-size:48px;opacity:0.3;">⚽</span>
      <p style="color:var(--text-muted);margin-top:12px;">选择两支队伍开始对比</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTeamStore } from '../stores/teamStore'
import client from '../api/client'
import TeamSelectors from '../components/comparison/TeamSelectors.vue'
import H2HSummary from '../components/comparison/H2HSummary.vue'
import ComparisonCharts from '../components/comparison/ComparisonCharts.vue'
import ScoreCell from '../components/common/ScoreCell.vue'

const teamStore = useTeamStore()
const teamA = ref('')
const teamB = ref('')
const result = ref(null)

async function handleCompare(a, b) {
  teamA.value = a; teamB.value = b
  const res = await client.post('/compare/teams', { team_a: a, team_b: b })
  result.value = res.data
}

onMounted(() => teamStore.fetchTeams())
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; color: var(--text-title); }
.page-header p { color: var(--text-secondary); margin-top: 4px; font-size: 14px; }
</style>
