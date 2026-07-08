<template>
  <div class="team-rankings">
    <div class="page-header">
      <h2>🏆 世界杯队伍排名</h2>
      <p>基于世界杯历史数据的队伍实力排名</p>
    </div>

    <div class="controls card-block" style="cursor:default;">
      <div class="control-item">
        <label>排名指标</label>
        <el-radio-group v-model="metric" @change="loadRankings" size="default">
          <el-radio-button value="elo">Elo评分</el-radio-button>
          <el-radio-button value="wins">胜场数</el-radio-button>
          <el-radio-button value="goals">总进球</el-radio-button>
        </el-radio-group>
      </div>
      <div class="control-item">
        <label>届次 (空=历史总计)</label>
        <el-input-number v-model="year" :min="1930" :max="2026" :step="4" placeholder="全部" clearable @change="loadRankings" size="default" />
      </div>
    </div>

    <div class="rankings-grid">
      <div class="chart-card card-block" style="cursor:default;">
        <div ref="chartRef" class="chart-body"></div>
      </div>
      <div class="table-card card-block" style="cursor:default;overflow:hidden;">
        <el-table :data="rankings" max-height="620" style="width:100%">
          <el-table-column type="index" label="排名" width="60" align="center">
            <template #default="{ $index }">
              <span :style="{ color: $index < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][$index] : 'var(--text-muted)', fontWeight: 700 }">
                {{ $index + 1 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="队伍" width="180">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="color-dot" :style="{ background: row.color_code || 'var(--brand-blue)' }"></span>
                <span style="font-weight:600;">{{ row.team_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="metricLabel" width="110" align="center">
            <template #default="{ row }">
              <strong :style="{ color: 'var(--text-primary)', fontSize: '15px' }">
                {{ metric === 'goals' ? (row.total_gf || row.goals_for || 0).toLocaleString() : metric === 'wins' ? (row.total_wins || row.wins || 0).toLocaleString() : Math.round(row.elo_rating || 0) }}
              </strong>
            </template>
          </el-table-column>
          <el-table-column label="场次" width="80" align="center" v-if="!year">
            <template #default="{ row }"><span style="color:var(--text-muted)">{{ (row.total_played || row.matches_played || 0).toLocaleString() }}</span></template>
          </el-table-column>
          <el-table-column label="胜率" width="80" align="center">
            <template #default="{ row }">
              <span :style="{ color: (row.win_rate || 0) > 60 ? 'var(--brand-cyan)' : 'var(--text-secondary)' }">{{ row.win_rate || 0 }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="进球/失球" width="110" align="center">
            <template #default="{ row }">
              <span style="color:var(--brand-cyan)">{{ (row.total_gf || row.goals_for || 0).toLocaleString() }}</span>
              <span style="color:var(--text-muted)">/</span>
              <span style="color:var(--accent-danger)">{{ (row.total_ga || row.goals_against || 0).toLocaleString() }}</span>
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

  const top15 = res.data.slice(0, 15).reverse()
  if (!chart && chartRef.value) chart = echarts.init(chartRef.value)
  if (chart) {
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)', textStyle: { color: '#F2F5FF' } },
      grid: { left: 120, right: 60, top: 10, bottom: 10 },
      xAxis: { type: 'value', axisLabel: { color: '#687693', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } } },
      yAxis: { type: 'category', data: top15.map(r => r.team_name), axisLabel: { color: '#A0AEC7', fontSize: 12 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        type: 'bar',
        data: top15.map(r => ({
          value: metric.value === 'goals' ? (r.total_gf || r.goals_for) : metric.value === 'wins' ? (r.total_wins || r.wins) : Math.round(r.elo_rating),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#2374FF' }, { offset: 1, color: '#00C48C' }]),
            borderRadius: [0, 3, 3, 0]
          }
        })),
        label: { show: true, position: 'right', color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
        barMaxWidth: 26
      }]
    })
  }
}

onMounted(loadRankings)
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; color: var(--text-title); }
.page-header p { color: var(--text-secondary); margin-top: 4px; font-size: 14px; }

.controls { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; align-items: flex-end; }
.control-item { display: flex; flex-direction: column; gap: 6px; }
.control-item label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }

.rankings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-card { padding: 18px; }
.chart-body { height: 520px; }
.table-card { overflow: hidden; }
.color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

@media (max-width: 1024px) { .rankings-grid { grid-template-columns: 1fr; } }
</style>
