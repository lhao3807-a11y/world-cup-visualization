<template>
  <!--
    HeatmapChart.vue — 全球赛事热力图
    后端接口: GET /api/statistics/heatmap
    返回格式: [{ name: "USA", match_count: 104, total_goals: 304 }, ...]
    前端渲染: ECharts Treemap (矩形树图模拟热力)
  -->
  <ChartCard
    title="世界杯举办国热力图"
    icon="🌍"
    hint="点击查看举办国赛事分布详情"
    :note="`覆盖 ${countryCount} 个举办国/地区`"
    detailType="heatmap"
    showDetail
    @detail="$emit('detail', 'heatmap')"
  >
    <div ref="chartRef" class="chart-canvas"></div>
  </ChartCard>
</template>

<script setup>
/**
 * HeatmapChart.vue
 * 使用 ECharts Treemap 展示各举办国赛事分布密度
 * 颜色从深蓝 → 青绿，代表赛事数量递增
 * 后端 GET /api/statistics/heatmap → 返回 [{name, match_count}]
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
  const data = res.data.slice(0, 25)
  countryCount.value = data.length
  const maxHeat = Math.max(...data.map(d => d.match_count), 1)

  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#111622',
      borderColor: 'rgba(35,116,255,0.3)',
      textStyle: { color: '#F2F5FF' },
      formatter: (p) => `<b>${p.name}</b><br/>赛事总数: ${p.value?.toLocaleString()}<br/>点击查看详情`
    },
    series: [{
      type: 'treemap', roam: false,
      data: data.map(d => ({ name: d.name, value: d.match_count })),
      label: { show: true, fontSize: 10, color: '#A0AEC7' },
      upperLabel: { show: true, height: 28, color: '#687693' },
      itemStyle: { borderColor: '#080B14', borderWidth: 2 },
      levels: [{
        colorMapping: { min: 0, max: maxHeat, color: ['#12253d', '#1a5c78', '#00C48C'] }
      }]
    }]
  })
}

onMounted(render)
onUnmounted(() => chart?.dispose?.())
</script>

<style scoped>
.chart-canvas { width: 100%; height: 100%; }
</style>
