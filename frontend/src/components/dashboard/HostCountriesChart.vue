<template>
  <!--
    HostCountriesChart.vue — 世界杯举办国柱状图
    后端接口: GET /api/statistics/heatmap
    返回格式: [{ name:"USA", match_count:104 }, ...] 按 match_count 降序排列
    颜色: 紫色→蓝色渐变 (#9966FF → #2374FF)
    条形末端显示举办场次数字
  -->
  <ChartCard
    title="世界杯举办国 Top 20"
    icon="🏟️"
    :note="`覆盖 ${countryCount} 个举办国`"
    detailType="hosts"
    showDetail
    @detail="$emit('detail', 'hosts')"
  >
    <div ref="chartRef" class="chart-canvas"></div>
  </ChartCard>
</template>

<script setup>
/**
 * HostCountriesChart.vue
 * 世界杯举办国横向柱状图
 * 后端 GET /api/statistics/heatmap → 按 match_count 排序取前 20
 */
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import client from '../../api/client'
import ChartCard from '../common/ChartCard.vue'

const emit = defineEmits(['detail'])
const chartRef = ref(null)
const countryCount = ref(0)
let chart = null

async function render() {
  const res = await client.get('/statistics/heatmap')
  const data = res.data
    .sort((a, b) => b.match_count - a.match_count)
    .slice(0, 20)
    .reverse()

  countryCount.value = res.data.length // ECharts 从下往上绘制

  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)',
      textStyle: { color: '#F2F5FF' }
    },
    grid: { left: 110, right: 50, top: 6, bottom: 10 },
    xAxis: { type: 'value', axisLabel: { color: '#687693', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } } },
    yAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: '#A0AEC7', fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      // ↓ 紫色→蓝色渐变
      data: data.map(d => ({
        value: d.match_count,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#9966FF' },
            { offset: 1, color: '#2374FF' }
          ]),
          borderRadius: [0, 3, 3, 0]
        }
      })),
      label: { show: true, position: 'right', color: '#FFFFFF', fontSize: 10 },
      barMaxWidth: 20
    }]
  })
}

onMounted(render)
onUnmounted(() => chart?.dispose?.())
</script>

<style scoped>
.chart-canvas { width: 100%; height: 100%; }
</style>
