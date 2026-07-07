<template>
  <div class="team-rankings">
    <div class="page-header">
      <h2>🏆 队伍排名</h2>
      <p>基于Elo评分系统的全球队伍实力排名</p>
    </div>

    <div class="controls">
      <div class="control-item">
        <label>排名指标</label>
        <el-radio-group v-model="metric" @change="loadRankings">
          <el-radio-button value="elo">Elo评分</el-radio-button>
          <el-radio-button value="wins">胜场数</el-radio-button>
          <el-radio-button value="goals">总进球</el-radio-button>
        </el-radio-group>
      </div>
      <div class="control-item">
        <label>年份 (空=全时期)</label>
        <el-input-number v-model="year" :min="1872" :max="2026" placeholder="全部" clearable @change="loadRankings" />
      </div>
    </div>

    <div class="rankings-grid">
      <div class="chart-card chart-large">
        <div ref="chartRef" class="chart-body"></div>
      </div>
      <div class="table-card">
        <el-table :data="rankings" stripe max-height="600" style="width:100%">
          <el-table-column type="index" label="排名" width="60" />
          <el-table-column label="队伍" width="180">
            <template #default="{ row }">
              <div class="team-cell">
                <span class="color-dot" :style="{ background: row.color_code || '#409EFF' }"></span>
                <span>{{ row.team_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="metricLabel" width="100" align="center">
            <template #default="{ row }">
              <strong>{{ metric === 'goals' ? (row.total_gf || row.goals_for).toLocaleString() : metric === 'wins' ? (row.total_wins || row.wins).toLocaleString() : Math.round(row.elo_rating) }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="total_played" label="场次" width="80" align="center" v-if="!year" />
          <el-table-column label="胜率" width="80" align="center">
            <template #default="{ row }">
              {{ row.win_rate || 0 }}%
            </template>
          </el-table-column>
          <el-table-column label="进球/失球" width="100" align="center">
            <template #default="{ row }">
              {{ (row.total_gf || row.goals_for || 0).toLocaleString() }}/{{ (row.total_ga || row.goals_against || 0).toLocaleString() }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as echarts from 'echarts'
import client from '../api/client'

const chartRef = ref(null)
const rankings = ref([])
const metric = ref('elo')
const year = ref(null)

let chart = null

const metricLabel = computed(() => metric.value === 'goals' ? '总进球' : metric.value === 'wins' ? '胜场' : 'Elo评分')

async function loadRankings() {
  const params = { metric: metric.value, limit: 30 }
  if (year.value) params.year = year.value
  const res = await client.get('/rankings', { params })
  rankings.value = res.data

  // Render chart
  const top15 = res.data.slice(0, 15).reverse()
  if (!chart && chartRef.value) chart = echarts.init(chartRef.value)
  if (chart) {
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 60, top: 10, bottom: 10 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: top15.map(r => r.team_name), axisLabel: { fontSize: 12 } },
      series: [{
        type: 'bar',
        data: top15.map(r => metric.value === 'goals' ? (r.total_gf || r.goals_for) : metric.value === 'wins' ? (r.total_wins || r.wins) : Math.round(r.elo_rating)),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#409EFF' }, { offset: 1, color: '#00d4aa' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: { show: true, position: 'right', fontSize: 11, color: 'var(--text-primary)' }
      }]
    })
  }
}

onMounted(loadRankings)
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; }
.page-header p { color: var(--text-secondary); margin-top: 4px; }

.controls { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; align-items: flex-end; }
.control-item { display: flex; flex-direction: column; gap: 6px; }
.control-item label { font-size: 13px; color: var(--text-secondary); }

.rankings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;
}
.chart-body { height: 500px; }
.table-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;
}
.team-cell { display: flex; align-items: center; gap: 8px; }
.color-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

@media (max-width: 1024px) {
  .rankings-grid { grid-template-columns: 1fr; }
}
</style>
