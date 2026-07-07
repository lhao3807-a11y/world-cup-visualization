<template>
  <div class="timeline-page">
    <div class="page-header">
      <h2>⏳ 时间轴回溯</h2>
      <p>拖动时间轴探索1872年至今的足球历史</p>
    </div>

    <!-- Timeline Slider -->
    <div class="timeline-card">
      <div class="timeline-years">
        <button v-for="y in yearMarkers" :key="y" class="year-dot"
          :class="{ active: selectedYear === y, 'wc-year': wcYears.includes(y) }"
          @click="selectYear(y)">
          {{ y }}
        </button>
      </div>
      <div class="slider-wrap">
        <el-slider v-model="selectedYear" :min="1872" :max="2026" :step="1"
          show-input :format-tooltip="(v) => v + '年'" @change="loadYear" />
      </div>
      <div class="quick-jumps">
        <el-button size="small" v-for="y in [1872, 1900, 1930, 1950, 1966, 1970, 1990, 2002, 2018, 2022]" :key="y"
          :type="selectedYear === y ? 'primary' : 'default'" @click="selectYear(y)">{{ y }}</el-button>
      </div>
    </div>

    <!-- Year Detail -->
    <div v-if="yearData" class="year-detail">
      <div class="kpi-row">
        <div class="mini-kpi">
          <div class="mini-value">{{ yearData.stats.matches }}</div>
          <div class="mini-label">比赛场次</div>
        </div>
        <div class="mini-kpi">
          <div class="mini-value">{{ yearData.stats.goals }}</div>
          <div class="mini-label">总进球</div>
        </div>
        <div class="mini-kpi">
          <div class="mini-value">{{ yearData.stats.avg_goals }}</div>
          <div class="mini-label">场均进球</div>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <h3>🏅 {{ selectedYear }} 年 Top 10 队伍</h3>
          <div ref="topTeamsChart" class="chart-body"></div>
        </div>
        <div class="chart-card">
          <h3>📊 月度比赛分布</h3>
          <div ref="monthlyChart" class="chart-body"></div>
        </div>
      </div>

      <div class="chart-card">
        <h3>📋 {{ selectedYear }} 年比赛列表</h3>
        <el-table :data="yearData.matches.slice(0, 50)" stripe max-height="400" style="width:100%">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="home_team" label="主队" />
          <el-table-column label="比分" width="100" align="center">
            <template #default="{ row }">
              <span class="score-badge">{{ row.home_score }} - {{ row.away_score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="away_team" label="客队" />
          <el-table-column prop="tournament" label="赛事" />
          <el-table-column prop="country" label="举办地" width="140" />
        </el-table>
        <div v-if="yearData.matches.length > 50" class="more-hint">
          仅显示前50场比赛，共 {{ yearData.matches.length }} 场
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as echarts from 'echarts'
import client from '../api/client'

const selectedYear = ref(2022)
const yearData = ref(null)
const topTeamsChart = ref(null)
const monthlyChart = ref(null)

let charts = []

// Years with World Cup (men's, since 1930, every 4 years except 1942, 1946)
const wcYears = computed(() => {
  const years = []
  for (let y = 1930; y <= 2022; y += 4) {
    if (y !== 1942 && y !== 1946) years.push(y)
  }
  return years
})

const yearMarkers = computed(() => {
  const markers = []
  for (let y = 1872; y <= 2026; y += 10) markers.push(y)
  if (!markers.includes(2026)) markers.push(2026)
  return markers
})

async function loadYear() {
  try {
    const res = await client.get(`/timeline/${selectedYear.value}`)
    yearData.value = res.data

    charts.forEach(c => c.dispose())
    charts = []

    // Top teams chart
    if (topTeamsChart.value && res.data.topTeams?.length) {
      const chart = echarts.init(topTeamsChart.value)
      charts.push(chart)
      const teams = [...res.data.topTeams].reverse()
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 120, right: 40, top: 10, bottom: 10 },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: teams.map(t => t.team_name), axisLabel: { fontSize: 11 } },
        series: [{
          type: 'bar', data: teams.map(t => Math.round(t.elo_rating)),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#409EFF' }, { offset: 1, color: '#00d4aa' }
            ])
          }
        }]
      })
    }

    // Monthly distribution
    if (monthlyChart.value) {
      const chart = echarts.init(monthlyChart.value)
      charts.push(chart)
      const monthly = Array(12).fill(0)
      for (const m of res.data.matches) {
        monthly[m.month - 1]++
      }
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'] },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar', data: monthly,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#00d4aa' }, { offset: 1, color: 'rgba(0,212,170,0.2)' }
            ])
          }
        }]
      })
    }
  } catch (err) {
    console.error('Timeline load error:', err)
  }
}

function selectYear(y) {
  selectedYear.value = y
  loadYear()
}

onMounted(() => loadYear())
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; }
.page-header p { color: var(--text-secondary); }

.timeline-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
  padding: 24px; margin-bottom: 20px;
}
.timeline-years {
  display: flex; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 4px;
}
.year-dot {
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  color: var(--text-muted); border-radius: 6px; padding: 4px 8px; font-size: 11px;
  cursor: pointer; transition: all 0.2s;
}
.year-dot:hover, .year-dot.active {
  background: var(--accent-primary); color: #fff; border-color: var(--accent-primary);
}
.year-dot.wc-year { font-weight: 700; }
.slider-wrap { padding: 0 8px; }
.quick-jumps { display: flex; gap: 6px; margin-top: 16px; flex-wrap: wrap; }

.year-detail { display: flex; flex-direction: column; gap: 20px; }
.kpi-row { display: flex; gap: 16px; }
.mini-kpi {
  flex: 1; background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 20px; text-align: center;
}
.mini-value { font-size: 32px; font-weight: 700; color: var(--accent-primary); }
.mini-label { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;
}
.chart-card h3 { font-size: 16px; margin-bottom: 12px; }
.chart-body { height: 320px; }
.score-badge { font-weight: 700; color: var(--accent-primary); }
.more-hint { text-align: center; padding: 12px; color: var(--text-muted); font-size: 13px; }

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
  .mini-kpi { min-width: 90px; }
  .mini-value { font-size: 24px; }
}
</style>
