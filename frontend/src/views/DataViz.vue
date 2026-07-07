<template>
  <div class="data-viz">
    <div class="page-header">
      <h2>📺 数据可视化大屏</h2>
      <p>全屏数据总览，适配大屏展示</p>
      <el-button @click="toggleFullscreen" circle>
        <el-icon><FullScreen /></el-icon>
      </el-button>
    </div>

    <div class="viz-grid" ref="vizContainer">
      <!-- Row 1: 3 charts -->
      <div class="viz-card" ref="chart1"></div>
      <div class="viz-card" ref="chart2"></div>
      <div class="viz-card" ref="chart3"></div>

      <!-- Row 2: 1 wide + 2 medium -->
      <div class="viz-card viz-wide" ref="chart4"></div>
      <div class="viz-card" ref="chart5"></div>
      <div class="viz-card" ref="chart6"></div>

      <!-- Row 3: 2 charts -->
      <div class="viz-card" ref="chart7"></div>
      <div class="viz-card" ref="chart8"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import client from '../api/client'

const vizContainer = ref(null)
const chartRefs = [ref(null), ref(null), ref(null), ref(null), ref(null), ref(null), ref(null), ref(null)]
const [chart1, chart2, chart3, chart4, chart5, chart6, chart7, chart8] = chartRefs

let charts = []

function fullscreenChart(chart) {
  if (!chart) return
  chart.setOption({})
}

function toggleFullscreen() {
  if (vizContainer.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      vizContainer.value.requestFullscreen()
    }
  }
}

async function loadViz() {
  try {
    const [overviewRes, trendRes, heatRes, champRes, tournRes, yearlyRes, topRes] = await Promise.all([
      client.get('/statistics/overview'),
      client.get('/statistics/goals-trend'),
      client.get('/statistics/heatmap'),
      client.get('/statistics/champions'),
      client.get('/statistics/tournament-distribution'),
      client.get('/statistics/yearly'),
      client.get('/rankings', { params: { limit: 15 } })
    ])

    charts.forEach(c => c.dispose())
    charts = []

    // Chart 1: Total goals by year (area)
    const c1 = echarts.init(chart1.value)
    charts.push(c1)
    const trendData = trendRes.data
    c1.setOption({
      title: { text: '年度总进球趋势', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'axis' },
      grid: { left: 45, right: 15, top: 45, bottom: 20 },
      xAxis: { type: 'category', data: trendData.map(d => d.year), axisLabel: { fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value' },
      series: [{
        type: 'line', data: trendData.map(d => d.total_goals), smooth: true, showSymbol: false,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(64,158,255,0.4)' }, { offset: 1, color: 'rgba(64,158,255,0.02)' }]) },
        lineStyle: { color: '#409EFF', width: 1.5 }
      }]
    })

    // Chart 2: Champions
    const c2 = echarts.init(chart2.value)
    charts.push(c2)
    const champData = champRes.data.slice(0, 12).reverse()
    c2.setOption({
      title: { text: '世界杯冠军榜', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 90, right: 30, top: 45, bottom: 15 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: champData.map(d => d.team), axisLabel: { fontSize: 10 } },
      series: [{ type: 'bar', data: champData.map(d => d.titles), itemStyle: { color: '#f56c6c', borderRadius: [0, 3, 3, 0] } }]
    })

    // Chart 3: Tournament pie
    const c3 = echarts.init(chart3.value)
    charts.push(c3)
    c3.setOption({
      title: { text: '赛事类型分布', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['35%', '60%'], center: ['50%', '55%'],
        data: tournRes.data.slice(0, 8),
        label: { fontSize: 10, formatter: '{b}\n{d}%' }
      }]
    })

    // Chart 4: Yearly matches (wide)
    const c4 = echarts.init(chart4.value)
    charts.push(c4)
    const yearlyData = yearlyRes.data
    c4.setOption({
      title: { text: '年度比赛场次走势', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 15, top: 45, bottom: 30 },
      xAxis: { type: 'category', data: yearlyData.map(d => d.year), axisLabel: { fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value' },
      dataZoom: [{ type: 'slider', start: 0, end: 100, height: 16, bottom: 2 }],
      series: [
        { type: 'bar', data: yearlyData.map(d => d.total_matches), itemStyle: { color: '#409EFF', borderRadius: [2, 2, 0, 0] }, name: '总场次' },
        { type: 'line', data: yearlyData.map(d => d.world_cup_matches), smooth: true, showSymbol: false, lineStyle: { color: '#f56c6c' }, name: '世界杯' }
      ]
    })

    // Chart 5: Avg goals trend
    const c5 = echarts.init(chart5.value)
    charts.push(c5)
    c5.setOption({
      title: { text: '场均进球变化', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 15, top: 45, bottom: 20 },
      xAxis: { type: 'category', data: trendData.map(d => d.year), axisLabel: { fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value', min: 0 },
      series: [{
        type: 'line', data: trendData.map(d => d.avg_goals), smooth: true, showSymbol: false,
        lineStyle: { color: '#00d4aa', width: 2 },
        markLine: { data: [{ type: 'average', name: '平均值' }], lineStyle: { color: '#e6a23c', type: 'dashed' } }
      }]
    })

    // Chart 6: Top scoring teams
    const c6 = echarts.init(chart6.value)
    charts.push(c6)
    const topData = topRes.data.slice(0, 12).reverse()
    c6.setOption({
      title: { text: 'Elo排名 Top 12', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 100, right: 40, top: 45, bottom: 15 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: topData.map(d => d.team_name), axisLabel: { fontSize: 10 } },
      series: [{ type: 'bar', data: topData.map(d => Math.round(d.elo_rating)), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#409EFF' }]), borderRadius: [0, 3, 3, 0] } }]
    })

    // Chart 7: Heatmap treemap
    const c7 = echarts.init(chart7.value)
    charts.push(c7)
    const heatData = heatRes.data.slice(0, 25).map(d => ({ name: d.name, value: d.match_count }))
    c7.setOption({
      title: { text: '各国举办赛事热力', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'treemap', data: heatData, label: { show: true, fontSize: 9 },
        levels: [{ colorMapping: { min: 0, max: Math.max(...heatData.map(d => d.value), 1), color: ['#1a3050', '#409EFF', '#00d4aa'] } }]
      }]
    })

    // Chart 8: Yearly unique teams
    const c8 = echarts.init(chart8.value)
    charts.push(c8)
    c8.setOption({
      title: { text: '年度参赛队伍数', left: 'center', top: 8, textStyle: { fontSize: 14, color: 'var(--text-primary)' } },
      tooltip: { trigger: 'axis' },
      grid: { left: 45, right: 15, top: 45, bottom: 20 },
      xAxis: { type: 'category', data: yearlyData.map(d => d.year), axisLabel: { fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: yearlyData.map(d => d.unique_teams), smooth: true, showSymbol: false, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,212,170,0.3)' }, { offset: 1, color: 'rgba(0,212,170,0.02)' }]) }, lineStyle: { color: '#00d4aa', width: 2 } }]
    })

  } catch (err) {
    console.error('Viz load error:', err)
  }
}

onMounted(loadViz)

const resizeHandler = () => charts.forEach(c => c.resize())
window.addEventListener('resize', resizeHandler)
onUnmounted(() => {
  charts.forEach(c => c.dispose())
  window.removeEventListener('resize', resizeHandler)
})
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; }
.page-header p { color: var(--text-secondary); flex: 1; }

.viz-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 320px 320px 320px;
  gap: 16px;
}
.viz-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
  min-height: 280px;
}
.viz-wide { grid-column: span 2; }

@media (max-width: 1200px) {
  .viz-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: auto; }
  .viz-wide { grid-column: span 1; }
}
@media (max-width: 768px) {
  .viz-grid { grid-template-columns: 1fr; }
  .viz-wide { grid-column: span 1; }
}

.viz-grid:fullscreen {
  background: var(--bg-primary);
  padding: 20px;
  grid-template-rows: 1fr 1fr 1fr;
  height: 100vh;
}
</style>
