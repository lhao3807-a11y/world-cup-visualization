<template>
  <!--
    ComparisonCharts.vue — 雷达图 + 交锋统计双图表
    数据来源: POST /api/compare/teams { team_a, team_b }
    返回 radar 数据格式:
      { indicators: ["胜率","总进球",...],
        team_a: [56,150,...], team_b: [54,107,...] }
  -->
  <div class="charts-row" v-if="result">
    <div class="chart-card card-block" style="cursor:default;">
      <h3 class="module-title" style="margin-bottom:10px;">📊 雷达对比</h3>
      <div ref="radarRef" class="chart-body chart-container"></div>
    </div>
    <div class="chart-card card-block" style="cursor:default;">
      <h3 class="module-title" style="margin-bottom:10px;">📈 交锋统计</h3>
      <div ref="h2hRef" class="chart-body chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  result: { type: Object, default: null },
  teamA: { type: String, default: '' },
  teamB: { type: String, default: '' }
})

const radarRef = ref(null)
const h2hRef = ref(null)
let charts = []

watch(() => props.result, async (r) => {
  if (!r || !r.radar) return
  await nextTick()
  render()
})

function render() {
  charts.forEach(c => c.dispose()); charts = []
  const { radar: rd, head_to_head: h2h, team_a: a, team_b: b } = props.result

  // 雷达图
  if (radarRef.value && rd) {
    const radar = echarts.init(radarRef.value); charts.push(radar)
    const maxVals = rd.indicators.map((_, i) => Math.max(rd.team_a[i], rd.team_b[i]) * 1.2 || 1)
    radar.setOption({
      tooltip: {},
      legend: { data: [props.teamA, props.teamB], bottom: 0, textStyle: { color: '#A0AEC7' } },
      radar: { indicator: rd.indicators.map((ind, i) => ({ name: ind, max: maxVals[i] })), center: ['50%', '45%'], radius: '65%' },
      series: [{
        type: 'radar',
        data: [
          { value: rd.team_a, name: props.teamA, areaStyle: { color: 'rgba(35,116,255,0.2)' }, lineStyle: { color: '#2374FF' }, itemStyle: { color: '#2374FF' } },
          { value: rd.team_b, name: props.teamB, areaStyle: { color: 'rgba(0,196,140,0.2)' }, lineStyle: { color: '#00C48C' }, itemStyle: { color: '#00C48C' } }
        ]
      }]
    })
  }

  // H2H 柱状图
  if (h2hRef.value && h2h) {
    const chart = echarts.init(h2hRef.value); charts.push(chart)
    const s = h2h.summary
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: ['胜场', '进球'], axisLabel: { color: '#A0AEC7' } },
      yAxis: { type: 'value', axisLabel: { color: '#687693' }, splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } } },
      series: [
        { type: 'bar', name: props.teamA, data: [s?.teamA_wins || 0, s?.teamA_goals || 0], itemStyle: { color: '#2374FF', borderRadius: [3, 3, 0, 0] }, barMaxWidth: 40 },
        { type: 'bar', name: props.teamB, data: [s?.teamB_wins || 0, s?.teamB_goals || 0], itemStyle: { color: '#00C48C', borderRadius: [3, 3, 0, 0] }, barMaxWidth: 40 }
      ]
    })
  }
}
</script>

<style scoped>
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.chart-body { height: 320px; border-radius: 8px; }
@media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
</style>
