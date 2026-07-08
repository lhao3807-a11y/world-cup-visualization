<template>
  <!--
    GoalsTrendChart.vue — 年度进球趋势折线图
    后端接口: GET /api/statistics/goals-trend
    返回格式: [{ year: 1930, total_goals: 70, matches: 18, avg_goals: 3.89 }, ...]
    折线: 青绿 #00C48C 2px + 半透明渐变填充
    峰值标注: 橙色标记点（历史最高场均进球年份）
    底部: 可拖拽 DataZoom 滑块缩放年份范围
  -->
  <ChartCard
    title="年度进球趋势"
    icon="📈"
    detailType="goals"
    showDetail
    @detail="$emit('detail', 'goals')"
  >
    <div ref="chartRef" class="chart-canvas"></div>
  </ChartCard>
</template>

<script setup>
/**
 * GoalsTrendChart.vue
 * 历年场均进球趋势线
 * 后端 GET /api/statistics/goals-trend → 按 year 升序
 * X 轴刻度间隔 20 年避免拥挤
 */
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import client from '../../api/client'
import ChartCard from '../common/ChartCard.vue'

const emit = defineEmits(['detail'])
const chartRef = ref(null)
let chart = null

async function render() {
  const res = await client.get('/statistics/goals-trend')
  const data = res.data

  // ↓ 找到场均进球最高和最低的年份用于标注
  const maxPt = data.reduce((a, b) => a.avg_goals > b.avg_goals ? a : b, data[0])
  const maxIdx = data.indexOf(maxPt)

  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)',
      textStyle: { color: '#F2F5FF' }
    },
    grid: { left: 48, right: 24, top: 24, bottom: 36 },
    xAxis: {
      type: 'category', data: data.map(d => d.year),
      axisLabel: { color: '#687693', fontSize: 9, rotate: 45, interval: 19 },
      axisLine: { lineStyle: { color: 'rgba(40,80,180,0.15)' } }
    },
    yAxis: {
      type: 'value', name: '场均进球',
      axisLabel: { color: '#687693', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } }
    },
    dataZoom: [{
      type: 'slider', start: 0, end: 100, height: 16, bottom: 4,
      borderColor: 'rgba(40,80,180,0.12)', backgroundColor: 'rgba(17,22,34,0.8)',
      fillerColor: 'rgba(35,116,255,0.1)'
    }],
    series: [{
      type: 'line', data: data.map(d => d.avg_goals), smooth: true, showSymbol: false,
      lineStyle: { color: '#00C48C', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,196,140,0.25)' },
          { offset: 1, color: 'rgba(0,196,140,0.01)' }
        ])
      },
      // ↓ 峰值标注点
      markPoint: {
        data: [{
          coord: [maxIdx, maxPt.avg_goals], value: maxPt.avg_goals,
          name: '峰值', symbol: 'pin', symbolSize: 32,
          itemStyle: { color: '#FF7D34' },
          label: { color: '#F2F5FF', fontSize: 10 }
        }],
        animation: true
      }
    }]
  })
}

onMounted(render)
onUnmounted(() => chart?.dispose?.())
</script>

<style scoped>
.chart-canvas { width: 100%; height: 100%; }
</style>
