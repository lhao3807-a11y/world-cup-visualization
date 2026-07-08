<template>
  <div class="data-viz">
    <div class="page-header">
      <div>
        <h2>📺 世界杯数据大屏</h2>
        <p>全屏世界杯数据总览，适配大屏展示</p>
      </div>
      <el-button @click="toggleFullscreen" circle size="default">
        <el-icon :size="18"><FullScreen /></el-icon>
      </el-button>
    </div>

    <div class="viz-grid" ref="vizContainer">
      <div v-for="i in 8" :key="i" :ref="(el) => chartRefs[i - 1] = el" class="viz-card" :class="{ 'viz-wide': i === 4 }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import client from '../api/client'

const vizContainer = ref(null)
const chartRefs = ref([])
let charts = []

function toggleFullscreen() {
  if (vizContainer.value) {
    document.fullscreenElement ? document.exitFullscreen() : vizContainer.value.requestFullscreen()
  }
}

async function loadViz() {
  try {
    const [trendRes, champRes, yearlyRes, topRes, heatRes] = await Promise.all([
      client.get('/statistics/goals-trend'),
      client.get('/statistics/champions'),
      client.get('/statistics/yearly'),
      client.get('/rankings', { params: { limit: 15 } }),
      client.get('/statistics/heatmap')
    ])

    charts.forEach(c => c.dispose()); charts = []

    const tStyle = { textStyle: { fontSize: 14, color: '#F2F5FF' } }
    const axLine = { axisLabel: { color: '#A0AEC7', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } } }
    const tooltip = { trigger: 'axis', backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)', textStyle: { color: '#F2F5FF' } }

    // 1: 历届总进球趋势线
    const td = trendRes.data
    echarts.init(chartRefs.value[0]).setOption({
      title: { ...tStyle, text: '历届总进球趋势', left: 'center', top: 8 },
      tooltip, grid: { left: 48, right: 16, top: 44, bottom: 20 },
      xAxis: { type: 'category', data: td.map(d => d.year), axisLabel: { color: '#687693', fontSize: 9, rotate: 45, interval: 19 } },
      yAxis: { type: 'value', ...axLine },
      series: [{
        type: 'line', data: td.map(d => d.total_goals), smooth: true, showSymbol: false,
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0,color:'rgba(35,116,255,0.3)'},{offset:1,color:'rgba(35,116,255,0.02)'}]) },
        lineStyle: { color: '#2374FF', width: 1.5 }
      }]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[0]))

    // 2: 冠军榜
    const cd = champRes.data.slice(0, 12).reverse()
    echarts.init(chartRefs.value[1]).setOption({
      title: { ...tStyle, text: '世界杯冠军榜', left: 'center', top: 8 },
      tooltip, grid: { left: 100, right: 40, top: 44, bottom: 12 },
      xAxis: { type: 'value', ...axLine },
      yAxis: { type: 'category', data: cd.map(d => d.team), axisLabel: { color: '#A0AEC7', fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{ type: 'bar', data: cd.map(d => ({ value: d.titles, itemStyle: { color: d.titles >= 5 ? '#FFD700' : d.titles >= 3 ? '#00C48C' : '#2374FF', borderRadius: [0,3,3,0] } })), barMaxWidth: 24 }]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[1]))

    // 3: 举办国 Top12
    const hostData = heatRes.data.sort((a,b)=>b.match_count-a.match_count).slice(0,12).reverse()
    echarts.init(chartRefs.value[2]).setOption({
      title: { ...tStyle, text: '世界杯举办国 Top 12', left: 'center', top: 8 },
      tooltip, grid: { left: 110, right: 40, top: 44, bottom: 12 },
      xAxis: { type: 'value', ...axLine },
      yAxis: { type: 'category', data: hostData.map(d=>d.name), axisLabel: { color: '#A0AEC7', fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{ type: 'bar', data: hostData.map(d=>({value:d.match_count,itemStyle:{color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#9966FF'},{offset:1,color:'#2374FF'}]),borderRadius:[0,3,3,0]}})), barMaxWidth: 18 }]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[2]))

    // 4: 历届比赛场次 + DataZoom (wide)
    const yd = yearlyRes.data
    echarts.init(chartRefs.value[3]).setOption({
      title: { ...tStyle, text: '历届比赛场次走势', left: 'center', top: 8 },
      tooltip, grid: { left: 52, right: 16, top: 44, bottom: 30 },
      xAxis: { type: 'category', data: yd.map(d => d.year), axisLabel: { color: '#687693', fontSize: 9, rotate: 45, interval: 19 } },
      yAxis: axLine,
      dataZoom: [{ type: 'slider', start: 0, end: 100, height: 16, bottom: 4 }],
      series: [
        { type: 'bar', data: yd.map(d => d.total_matches), itemStyle: { color: '#2374FF', borderRadius: [2,2,0,0] }, name: '比赛场次' },
        { type: 'line', data: yd.map(d => d.avg_goals_per_match), smooth: true, showSymbol: false, lineStyle: { color: '#f56c6c' }, name: '场均进球', yAxisIndex: 1 }
      ]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[3]))

    // 5: 场均进球
    echarts.init(chartRefs.value[4]).setOption({
      title: { ...tStyle, text: '场均进球变化', left: 'center', top: 8 },
      tooltip, grid: { left: 42, right: 16, top: 44, bottom: 20 },
      xAxis: { type: 'category', data: td.map(d => d.year), axisLabel: { color: '#687693', fontSize: 9, rotate: 45, interval: 19 } },
      yAxis: { ...axLine, min: 0 },
      series: [{
        type: 'line', data: td.map(d => d.avg_goals), smooth: true, showSymbol: false,
        lineStyle: { color: '#00C48C', width: 2 },
        markLine: { data: [{ type: 'average', name: '历史均值' }], lineStyle: { color: '#FF7D34', type: 'dashed' } }
      }]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[4]))

    // 6: Elo Top 12
    const td2 = topRes.data.slice(0, 12).reverse()
    echarts.init(chartRefs.value[5]).setOption({
      title: { ...tStyle, text: '世界杯 Elo 排名 Top 12', left: 'center', top: 8 },
      tooltip, grid: { left: 110, right: 50, top: 44, bottom: 12 },
      xAxis: { type: 'value', ...axLine },
      yAxis: { type: 'category', data: td2.map(d => d.team_name), axisLabel: { color: '#A0AEC7', fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{ type: 'bar', data: td2.map(d => Math.round(d.elo_rating)), itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#9966FF'},{offset:1,color:'#2374FF'}]), borderRadius: [0,3,3,0] }, barMaxWidth: 20 }]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[5]))

    // 7: 举办国分布 Treemap
    const hd = heatRes.data.slice(0, 25).map(d => ({ name: d.name, value: d.match_count }))
    echarts.init(chartRefs.value[6]).setOption({
      title: { ...tStyle, text: '举办国赛事分布', left: 'center', top: 8 },
      tooltip: { trigger: 'item', backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)', textStyle: { color: '#F2F5FF' } },
      series: [{ type: 'treemap', data: hd, label: { fontSize: 9, color: '#A0AEC7' }, levels: [{ colorMapping: { min: 0, max: Math.max(...hd.map(d=>d.value),1), color: ['#12253d','#1a5c78','#00C48C'] } }] }]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[6]))

    // 8: 历届参赛队伍数
    echarts.init(chartRefs.value[7]).setOption({
      title: { ...tStyle, text: '历届参赛队伍数', left: 'center', top: 8 },
      tooltip, grid: { left: 48, right: 16, top: 44, bottom: 20 },
      xAxis: { type: 'category', data: yd.map(d => d.year), axisLabel: { color: '#687693', fontSize: 9, rotate: 45, interval: 19 } },
      yAxis: axLine,
      series: [{
        type: 'line', data: yd.map(d => d.unique_teams), smooth: true, showSymbol: false,
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0,color:'rgba(0,196,140,0.25)'},{offset:1,color:'rgba(0,196,140,0.01)'}]) },
        lineStyle: { color: '#00C48C', width: 2 }
      }]
    })
    charts.push(echarts.getInstanceByDom(chartRefs.value[7]))

  } catch (err) { console.error('Viz error:', err) }
}

onMounted(loadViz)

const rh = () => charts.forEach(c => c.resize?.())
window.addEventListener('resize', rh)
onUnmounted(() => { charts.forEach(c => c.dispose?.()); window.removeEventListener('resize', rh) })
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.page-header h2 { font-size: 24px; font-weight: 700; color: var(--text-title); }
.page-header p { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.viz-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: 320px 320px 320px; gap: 16px; }
.viz-card { min-height: 280px; }
.viz-wide { grid-column: span 2; }
.viz-grid:fullscreen { background: #080B14; padding: 20px; grid-template-rows: 1fr 1fr 1fr; height: calc(100vh - 40px); gap: 16px; }

@media (max-width: 1200px) { .viz-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: auto; } .viz-wide { grid-column: span 1; } }
@media (max-width: 768px)  { .viz-grid { grid-template-columns: 1fr; } .viz-wide { grid-column: span 1; } }
</style>
