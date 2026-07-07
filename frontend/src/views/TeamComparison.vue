<template>
  <div class="team-comparison">
    <div class="page-header">
      <h2>⚔️ 数据对比</h2>
      <p>对比两支队伍的历史数据与交锋记录</p>
    </div>

    <div class="compare-selectors">
      <div class="selector-item">
        <label>队伍 A</label>
        <el-select v-model="teamA" filterable placeholder="选择队伍" @change="compare" :loading="!teamStore.loaded">
          <el-option v-for="t in teamStore.teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
        </el-select>
      </div>
      <div class="vs-divider">
        <span>VS</span>
      </div>
      <div class="selector-item">
        <label>队伍 B</label>
        <el-select v-model="teamB" filterable placeholder="选择队伍" @change="compare" :loading="!teamStore.loaded">
          <el-option v-for="t in teamStore.teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
        </el-select>
      </div>
    </div>

    <div v-if="result" class="compare-results">
      <!-- H2H Summary -->
      <div class="h2h-summary">
        <div class="h2h-card" v-for="(item, key) in h2hCards" :key="key">
          <div class="h2h-value">{{ item.value }}</div>
          <div class="h2h-label">{{ item.label }}</div>
        </div>
      </div>

      <!-- Radar Chart -->
      <div class="charts-row">
        <div class="chart-card">
          <h3>📊 雷达对比</h3>
          <div ref="radarRef" class="chart-body"></div>
        </div>
        <div class="chart-card">
          <h3>📈 交锋统计</h3>
          <div ref="h2hRef" class="chart-body"></div>
        </div>
      </div>

      <!-- H2H Match History -->
      <div class="chart-card" v-if="result.head_to_head?.matches?.length">
        <h3>🤝 历史交锋记录</h3>
        <el-table :data="result.head_to_head.matches" stripe max-height="400" style="width:100%">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column label="主队">
            <template #default="{ row }">
              <span :style="{ fontWeight: row.home_team_norm === teamA ? '700' : '400' }">{{ row.home_team }}</span>
            </template>
          </el-table-column>
          <el-table-column label="比分" width="100" align="center">
            <template #default="{ row }">
              <span class="score-badge">{{ row.home_score }} - {{ row.away_score }}</span>
            </template>
          </el-table-column>
          <el-table-column label="客队">
            <template #default="{ row }">
              <span :style="{ fontWeight: row.away_team_norm === teamB ? '700' : '400' }">{{ row.away_team }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="tournament" label="赛事" />
        </el-table>
      </div>
    </div>

    <el-empty v-else description="选择两支队伍开始对比" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as echarts from 'echarts'
import { useTeamStore } from '../stores/teamStore'
import client from '../api/client'

const teamStore = useTeamStore()
const teamA = ref('')
const teamB = ref('')
const result = ref(null)
const radarRef = ref(null)
const h2hRef = ref(null)

let charts = []

const h2hCards = computed(() => {
  if (!result.value) return []
  const s = result.value.head_to_head?.summary
  if (!s) return []
  return [
    { label: `${teamA.value} 胜`, value: s.teamA_wins },
    { label: '平局', value: s.draws },
    { label: `${teamB.value} 胜`, value: s.teamB_wins },
    { label: `${teamA.value} 进球`, value: s.teamA_goals },
    { label: `${teamB.value} 进球`, value: s.teamB_goals },
  ]
})

async function compare() {
  if (!teamA.value || !teamB.value) return

  const res = await client.post('/compare/teams', { team_a: teamA.value, team_b: teamB.value })
  result.value = res.data

  // Destroy previous charts
  charts.forEach(c => c.dispose())
  charts = []

  // Radar
  if (radarRef.value && res.data.radar) {
    const radar = echarts.init(radarRef.value)
    charts.push(radar)
    const maxVals = res.data.radar.indicators.map((_, i) =>
      Math.max(res.data.radar.team_a[i], res.data.radar.team_b[i]) * 1.2 || 1
    )
    radar.setOption({
      tooltip: {},
      legend: { data: [teamA.value, teamB.value], bottom: 0, textStyle: { color: 'var(--text-secondary)' } },
      radar: {
        indicator: res.data.radar.indicators.map((ind, i) => ({ name: ind, max: maxVals[i] })),
        center: ['50%', '45%'],
        radius: '65%'
      },
      series: [{
        type: 'radar',
        data: [
          { value: res.data.radar.team_a, name: teamA.value, areaStyle: { color: 'rgba(64,158,255,0.2)' }, lineStyle: { color: '#409EFF' }, itemStyle: { color: '#409EFF' } },
          { value: res.data.radar.team_b, name: teamB.value, areaStyle: { color: 'rgba(0,212,170,0.2)' }, lineStyle: { color: '#00d4aa' }, itemStyle: { color: '#00d4aa' } }
        ]
      }]
    })
  }

  // H2H bar
  if (h2hRef.value) {
    const h2hChart = echarts.init(h2hRef.value)
    charts.push(h2hChart)
    const s = res.data.head_to_head?.summary
    h2hChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: ['胜场', '进球'] },
      yAxis: { type: 'value' },
      series: [
        { type: 'bar', name: teamA.value, data: [s?.teamA_wins || 0, s?.teamA_goals || 0], itemStyle: { color: '#409EFF' } },
        { type: 'bar', name: teamB.value, data: [s?.teamB_wins || 0, s?.teamB_goals || 0], itemStyle: { color: '#00d4aa' } }
      ]
    })
  }
}

onMounted(() => teamStore.fetchTeams())
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; }
.page-header p { color: var(--text-secondary); }

.compare-selectors {
  display: flex; align-items: flex-end; gap: 20px; margin-bottom: 24px;
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;
  flex-wrap: wrap;
}
.selector-item { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px; }
.selector-item label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.vs-divider { font-size: 24px; font-weight: 800; color: var(--accent-primary); padding-bottom: 8px; }

.h2h-summary { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.h2h-card {
  flex: 1; min-width: 100px; background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 16px; text-align: center;
}
.h2h-value { font-size: 28px; font-weight: 700; color: var(--accent-primary); }
.h2h-label { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.chart-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;
}
.chart-card h3 { font-size: 16px; margin-bottom: 12px; }
.chart-body { height: 320px; }
.score-badge { font-weight: 700; color: var(--accent-primary); }

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
  .compare-selectors { flex-direction: column; align-items: stretch; }
  .vs-divider { text-align: center; }
}
</style>
