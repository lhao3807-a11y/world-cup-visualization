<template>
  <div class="dashboard">
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" v-for="kpi in kpis" :key="kpi.label">
        <div class="kpi-icon" :style="{ background: kpi.color }">
          <el-icon :size="24"><component :is="kpi.icon" /></el-icon>
        </div>
        <div class="kpi-info">
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="charts-row">
      <div class="chart-card chart-large">
        <div class="chart-header"><h3>🌍 全球赛事热力图</h3></div>
        <div ref="heatmapRef" class="chart-body"></div>
      </div>
      <div class="chart-card chart-medium">
        <div class="chart-header"><h3>🏆 世界杯冠军榜</h3></div>
        <div ref="championsRef" class="chart-body"></div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="charts-row">
      <div class="chart-card chart-medium">
        <div class="chart-header"><h3>📈 年度进球趋势</h3></div>
        <div ref="goalsTrendRef" class="chart-body"></div>
      </div>
      <div class="chart-card chart-medium">
        <div class="chart-header"><h3>📊 赛事类型分布</h3></div>
        <div ref="tournamentRef" class="chart-body"></div>
      </div>
    </div>

    <!-- Recent Matches -->
    <div class="chart-card">
      <div class="chart-header"><h3>🕐 近期比赛</h3></div>
      <el-table :data="recentMatches" stripe max-height="400" style="width:100%">
        <el-table-column prop="date" label="日期" width="120" sortable />
        <el-table-column prop="home_team" label="主队" />
        <el-table-column label="比分" width="100" align="center">
          <template #default="{ row }">
            <span class="score">{{ row.home_score }} - {{ row.away_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="away_team" label="客队" />
        <el-table-column prop="tournament" label="赛事" />
        <el-table-column prop="country" label="举办地" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import client from '../api/client'

const heatmapRef = ref(null)
const championsRef = ref(null)
const goalsTrendRef = ref(null)
const tournamentRef = ref(null)
const recentMatches = ref([])

let charts = []

const kpis = ref([
  { label: '总比赛场次', value: '...', icon: 'TrophyBase', color: 'linear-gradient(135deg, #409EFF, #00d4aa)' },
  { label: '总进球数', value: '...', icon: 'Football', color: 'linear-gradient(135deg, #f56c6c, #e6a23c)' },
  { label: '参赛国家/地区', value: '...', icon: 'MapLocation', color: 'linear-gradient(135deg, #67c23a, #00d4aa)' },
  { label: '赛事类型', value: '...', icon: 'CollectionTag', color: 'linear-gradient(135deg, #a855f7, #409EFF)' },
])

function createChart(refEl, option) {
  if (!refEl.value) return
  const chart = echarts.init(refEl.value)
  chart.setOption(option)
  charts.push(chart)
  return chart
}

async function loadData() {
  try {
    // Overview stats
    const overviewRes = await client.get('/statistics/overview')
    const ov = overviewRes.data.overview
    kpis.value = [
      { label: '总比赛场次', value: (ov?.total_matches || 0).toLocaleString(), icon: 'TrophyBase', color: 'linear-gradient(135deg, #409EFF, #00d4aa)' },
      { label: '总进球数', value: (ov?.total_goals || 0).toLocaleString(), icon: 'Football', color: 'linear-gradient(135deg, #f56c6c, #e6a23c)' },
      { label: '参赛国家/地区', value: (ov?.total_countries || 0).toLocaleString(), icon: 'MapLocation', color: 'linear-gradient(135deg, #67c23a, #00d4aa)' },
      { label: '赛事类型', value: (ov?.total_tournaments || 0).toLocaleString(), icon: 'CollectionTag', color: 'linear-gradient(135deg, #a855f7, #409EFF)' },
    ]

    // Heatmap
    const heatRes = await client.get('/statistics/heatmap')
    const heatData = heatRes.data.slice(0, 30).map(d => ({ name: d.name, value: d.match_count }))
    const maxHeat = Math.max(...heatData.map(d => d.value), 1)
    createChart(heatmapRef, {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'treemap',
        data: heatData,
        label: { show: true, formatter: '{b}' },
        upperLabel: { show: true, height: 30 },
        itemStyle: { borderColor: 'var(--bg-primary)' },
        levels: [{ colorMapping: { min: 0, max: maxHeat, color: ['#1a3050', '#409EFF'] } }]
      }]
    })

    // Champions
    const champRes = await client.get('/statistics/champions')
    const champData = champRes.data.slice(0, 15)
    createChart(championsRef, {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 100, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: champData.map(d => d.team), inverse: true, axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar', data: champData.map(d => d.titles),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#409EFF' }, { offset: 1, color: '#00d4aa' }
        ])},
        label: { show: true, position: 'right', color: 'var(--text-primary)' }
      }]
    })

    // Goals trend
    const trendRes = await client.get('/statistics/goals-trend')
    const trendData = trendRes.data
    createChart(goalsTrendRef, {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: trendData.map(d => d.year), axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: { type: 'value' },
      dataZoom: [{ type: 'slider', start: 0, end: 100, height: 20, bottom: 0 }],
      series: [{
        type: 'line', data: trendData.map(d => d.avg_goals), smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64,158,255,0.3)' }, { offset: 1, color: 'rgba(64,158,255,0.02)' }
        ])},
        lineStyle: { color: '#409EFF', width: 2 },
        itemStyle: { color: '#409EFF' }
      }]
    })

    // Tournament distribution
    const tournRes = await client.get('/statistics/tournament-distribution')
    const tournData = tournRes.data.slice(0, 10)
    createChart(tournamentRef, {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '50%'],
        data: tournData,
        label: { formatter: '{b}\n{d}%', fontSize: 10 },
        itemStyle: { borderColor: 'var(--bg-primary)', borderWidth: 2 }
      }]
    })

    // Recent matches
    const matchesRes = await client.get('/matches', { params: { limit: 20, sort: 'date', order: 'desc' } })
    recentMatches.value = matchesRes.data
  } catch (err) {
    console.error('Dashboard load error:', err)
  }
}

onMounted(() => loadData())

onUnmounted(() => {
  charts.forEach(c => c.dispose())
})

const resizeHandler = () => charts.forEach(c => c.resize())
window.addEventListener('resize', resizeHandler)
onUnmounted(() => window.removeEventListener('resize', resizeHandler))
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}
.kpi-card:hover { border-color: var(--border-active); box-shadow: var(--glow-accent); transform: translateY(-2px); }
.kpi-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.kpi-value { font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.kpi-label { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}
.chart-large { grid-column: span 1; }
.chart-medium { grid-column: span 1; }
.chart-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.chart-header h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.chart-body { height: 320px; }

.score {
  font-weight: 700; font-size: 16px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .chart-body { height: 240px; }
}
</style>
