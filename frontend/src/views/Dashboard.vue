<template>
  <div class="dashboard">
    <!-- KPI 指标卡片 -->
    <KpiGrid :animatedValues="animatedValues" @detail="openKpiDetail" />

    <!-- 热力图 + 冠军榜 -->
    <div class="charts-row">
      <HeatmapChart @detail="openChartDetail" />
      <ChampionsBarChart @detail="openChartDetail" />
    </div>

    <!-- 进球趋势 + 举办国分布 -->
    <div class="charts-row">
      <GoalsTrendChart @detail="openChartDetail" />
      <HostCountriesChart @detail="openChartDetail" />
    </div>

    <!-- 近期比赛表格 -->
    <RecentMatchesTable :limit="20" @detail="openChartDetail" @row-click="goToMatch" />

    <!-- KPI 详情弹窗 -->
    <KpiDetailPopup
      :visible="kpiPopup.visible"
      :kpiKey="kpiPopup.key"
      @close="kpiPopup.visible = false"
    />

    <div class="watermark">FIFA World Cup</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import client from '../api/client'
import KpiGrid from '../components/dashboard/KpiGrid.vue'
import HeatmapChart from '../components/dashboard/HeatmapChart.vue'
import ChampionsBarChart from '../components/dashboard/ChampionsBarChart.vue'
import GoalsTrendChart from '../components/dashboard/GoalsTrendChart.vue'
import HostCountriesChart from '../components/dashboard/HostCountriesChart.vue'
import RecentMatchesTable from '../components/dashboard/RecentMatchesTable.vue'
import KpiDetailPopup from '../components/dashboard/KpiDetailPopup.vue'

const router = useRouter()

const animatedValues = reactive({
  matches: '0', goals: '0', teams: '0', editions: '0'
})

const kpiPopup = reactive({ visible: false, key: 'matches' })

function openKpiDetail(key) { kpiPopup.key = key; kpiPopup.visible = true }
function openChartDetail(type) { /* 预留扩展 */ }
function goToMatch(row) { router.push(`/history/${row.id}`) }

// KPI 数字滚动动画
function animateValue(key, endVal, duration = 1200) {
  const start = performance.now()
  function step(now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = Math.round(eased * endVal)
    animatedValues[key] = current.toLocaleString()
    if (progress < 1) requestAnimationFrame(step)
    else animatedValues[key] = endVal.toLocaleString()
  }
  requestAnimationFrame(step)
}

onMounted(async () => {
  try {
    const ov = (await client.get('/statistics/overview')).data.overview
    setTimeout(() => animateValue('matches',  ov.total_matches    || 0), 100)
    setTimeout(() => animateValue('goals',    ov.total_goals      || 0), 250)
    setTimeout(() => animateValue('teams',    ov.total_teams      || 0), 400)
    setTimeout(() => animateValue('editions', ov.total_editions   || 0), 550)
  } catch (err) { console.error('Dashboard load error:', err) }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.watermark {
  position: fixed;
  bottom: 16px; left: 16px;
  font-size: 48px; font-weight: 900;
  color: rgba(255, 255, 255, 0.015);
  pointer-events: none; z-index: 0;
  user-select: none;
}

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
}
</style>
