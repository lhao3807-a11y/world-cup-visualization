<template>
  <DetailPopup
    :visible="visible"
    :title="title"
    :icon="icon"
    :iconColor="iconColor"
    :loading="loading"
    :isEmpty="isEmpty"
    :summary="summary"
    @close="$emit('close')"
  >
    <div v-if="!loading && !isEmpty" ref="chartEl" class="detail-chart"></div>
    <div v-else-if="isEmpty" class="empty-state">
      <span class="empty-icon">⚽</span>
      <p>暂无细分详情数据</p>
    </div>
  </DetailPopup>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import client from '../../api/client'
import DetailPopup from '../common/DetailPopup.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  kpiKey: { type: String, default: '' }
})
const emit = defineEmits(['close'])

const chartEl = ref(null)
const loading = ref(false)
const isEmpty = ref(false)
const title = ref('')
const icon = ref('📊')
const iconColor = ref('var(--brand-blue)')
const summary = ref(null)
let chart = null

const metaMap = {
  matches:  { title: '世界杯总场次', icon: '🏟️', color: 'var(--brand-blue)' },
  goals:    { title: '世界杯总进球', icon: '⚽',  color: 'var(--brand-orange)' },
  teams:    { title: '参赛国家/地区', icon: '🌍',  color: 'var(--brand-cyan)' },
  editions: { title: '历届世界杯',   icon: '🏆',  color: 'var(--brand-purple)' }
}

watch([() => props.visible, () => props.kpiKey], async ([vis, key]) => {
  if (!vis || !key) return
  loading.value = true; isEmpty.value = false
  const meta = metaMap[key] || metaMap.matches
  title.value = meta.title + ' 详情拆解'; icon.value = meta.icon; iconColor.value = meta.color

  try {
    if (key === 'matches') await loadMatches()
    else if (key === 'goals') await loadGoals()
    else if (key === 'teams') await loadTeams()
    else if (key === 'editions') await loadEditions()
  } catch (err) {
    console.error('KPI detail error:', err)
    isEmpty.value = true
  } finally {
    loading.value = false
    await nextTick()
    renderChart(key)
  }
})

let cachedData = null
function saveData(d) { cachedData = d }

async function loadMatches() {
  const res = await client.get('/statistics/yearly')
  const data = res.data
  const avg = Math.round(data.reduce((s, d) => s + d.total_matches, 0) / data.length)
  summary.value = [
    { label: '总场次', value: data.reduce((s,d) => s + d.total_matches, 0).toLocaleString(), color: 'var(--brand-blue)' },
    { label: '届均比赛', value: avg.toLocaleString() + ' 场', color: 'var(--text-primary)' },
    { label: '最多场次', value: Math.max(...data.map(d => d.total_matches)) + ' 场', color: 'var(--brand-cyan)' }
  ]
  saveData(data)
}

async function loadGoals() {
  const res = await client.get('/statistics/goals-trend')
  const data = res.data
  summary.value = [
    { label: '总进球', value: data.reduce((s,d) => s + d.total_goals, 0).toLocaleString(), color: 'var(--brand-orange)' },
    { label: '场均进球', value: (data.reduce((s,d) => s + d.avg_goals, 0) / data.length).toFixed(2), color: 'var(--text-primary)' },
    { label: '单届最高', value: Math.max(...data.map(d => d.avg_goals)).toFixed(2), color: 'var(--brand-cyan)' }
  ]
  saveData(data)
}

async function loadTeams() {
  const res = await client.get('/statistics/heatmap')
  const data = res.data.sort((a, b) => b.match_count - a.match_count)
  summary.value = [
    { label: '参赛队伍', value: '84', color: 'var(--brand-cyan)' },
    { label: '最多参赛', value: data[0]?.name || '-', color: 'var(--text-primary)' },
    { label: '覆盖国家', value: data.length + ' 个', color: 'var(--brand-blue)' }
  ]
  saveData(data)
}

async function loadEditions() {
  const res = await client.get('/statistics/heatmap')
  const data = res.data.sort((a, b) => b.match_count - a.match_count)
  summary.value = [
    { label: '举办国数', value: data.length, color: 'var(--brand-purple)' },
    { label: '最多主办', value: data[0]?.name || '-', color: 'var(--text-primary)' },
    { label: '最多场次', value: (data[0]?.match_count || 0).toLocaleString() + ' 场', color: 'var(--brand-cyan)' }
  ]
  saveData(data)
}

function renderChart(key) {
  if (chartEl.value) { if (chart) chart.dispose(); chart = echarts.init(chartEl.value) }
  if (!chart || !cachedData) return

  const baseGrid = { left: 50, right: 20, top: 10, bottom: 30 }
  const baseYAxis = { type: 'value', axisLabel: { fontSize: 10 } }

  if (key === 'matches') {
    chart.setOption({
      tooltip: { trigger: 'axis' }, grid: baseGrid,
      xAxis: { type: 'category', data: cachedData.map(d => d.year), axisLabel: { fontSize: 10, rotate: 45 } },
      yAxis: baseYAxis,
      dataZoom: [{ type: 'slider', height: 18, bottom: 2 }],
      series: [{
        type: 'bar', data: cachedData.map(d => d.total_matches),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#2374FF'},{offset:1,color:'rgba(35,116,255,0.15)'}]), borderRadius: [3,3,0,0] }
      }]
    })
  } else if (key === 'goals') {
    chart.setOption({
      tooltip: { trigger: 'axis' }, grid: baseGrid,
      xAxis: { type: 'category', data: cachedData.map(d => d.year), axisLabel: { fontSize: 10, rotate: 45, interval: 19 } },
      yAxis: baseYAxis,
      dataZoom: [{ type: 'slider', height: 18, bottom: 2 }],
      series: [{
        type: 'line', data: cachedData.map(d => d.avg_goals), smooth: true, showSymbol: false,
        lineStyle: { color: '#FF7D34', width: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(255,125,52,0.3)'},{offset:1,color:'rgba(255,125,52,0.02)'}]) }
      }]
    })
  } else if (key === 'teams') {
    const top = cachedData.slice(0, 20)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'treemap', data: top.map(d => ({ name: d.name, value: d.match_count })),
        label: { fontSize: 10 },
        levels: [{ colorMapping: { min: 0, max: Math.max(...top.map(d => d.match_count), 1), color: ['#1a3050','#00C48C'] } }]
      }]
    })
  } else if (key === 'editions') {
    const top = cachedData.slice(0, 15).reverse()
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 110, right: 50, top: 6, bottom: 6 },
      xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      yAxis: { type: 'category', data: top.map(d => d.name), axisLabel: { fontSize: 10 } },
      series: [{
        type: 'bar', data: top.map(d => d.match_count),
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#9966FF'},{offset:1,color:'#2374FF'}]), borderRadius: [0,3,3,0] }
      }]
    })
  }
}
</script>

<style scoped>
.detail-chart { width: 100%; min-height: 280px; border-radius: 8px; background: var(--chart-bg); }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: var(--text-muted); gap: 10px; }
.empty-icon { font-size: 40px; opacity: 0.4; }
</style>
