<template>
  <!--
    ChampionsBarChart.vue — 世界杯冠军榜横向条形图
    后端接口: GET /api/statistics/champions
    返回格式: [{ team: "Brazil", titles: 5, years: [1958,1962,...] }, ...]
    颜色分层:
      >=5 冠 → 青绿 #00C48C (高亮粗条)
      3-4 冠 → 浅青绿 #36D1A2
      1-2 冠 → 主蓝 #2374FF
    条形末端标注 "X冠"，hover 弹出夺冠年份明细
  -->
  <ChartCard
    title="世界杯冠军榜 (1930-2026)"
    icon="🏆"
    :note="`共 ${totalEditions} 届，${totalChampions} 支冠军队伍`"
    detailType="champions"
    showDetail
    @detail="$emit('detail', 'champions')"
  >
    <div ref="chartRef" class="chart-canvas"></div>
  </ChartCard>
</template>

<script setup>
/**
 * ChampionsBarChart.vue
 * 世界杯冠军横向条形图
 * 后端 GET /api/statistics/champions → 按 titles 降序排列
 * 交互: hover 单条弹出夺冠年份明细 tooltip
 */
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import client from '../../api/client'
import ChartCard from '../common/ChartCard.vue'

const emit = defineEmits(['detail'])
const chartRef = ref(null)
const totalChampions = ref(0)
const totalEditions = 23
let chart = null

async function render() {
  const res = await client.get('/statistics/champions')
  const data = res.data.slice(0, 15).reverse()
  totalChampions.value = res.data.length

  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)',
      textStyle: { color: '#F2F5FF' },
      // ↓ hover 时展示夺冠年份明细
      formatter: (p) => {
        const d = res.data.find(c => c.team === p[0].name)
        return `<b>${p[0].name}</b><br/>夺冠次数: ${p[0].value}<br/>年份: ${d?.years?.join(', ') || '-'}`
      }
    },
    grid: { left: 110, right: 50, top: 6, bottom: 10 },
    xAxis: { type: 'value', axisLabel: { color: '#687693', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(40,80,180,0.08)', type: 'dashed' } } },
    yAxis: { type: 'category', data: data.map(d => d.team), axisLabel: { color: '#A0AEC7', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      // ↓ 按夺冠数分层着色
      data: data.map(d => {
        let color
        if (d.titles >= 5) color = '#00C48C'       // 5 冠 → 青绿高亮
        else if (d.titles >= 3) color = '#36D1A2'   // 3-4 冠 → 浅青绿
        else color = '#2374FF'                       // 1-2 冠 → 主蓝
        return { value: d.titles, itemStyle: { color, borderRadius: [0, 3, 3, 0] } }
      }),
      label: { show: true, position: 'right', color: '#FFFFFF', fontWeight: 'bold', fontSize: 12, formatter: '{c}冠' },
      barMaxWidth: 28
    }]
  })
}

onMounted(render)
onUnmounted(() => chart?.dispose?.())
</script>

<style scoped>
.chart-canvas { width: 100%; height: 100%; }
</style>
