<template>
  <!--
    YearDetail.vue — 年份详情面板
    后端接口: GET /api/timeline/:year
    返回: { stats: { matches, goals, avg_goals }, topTeams: [...], matches: [...] }
    包含 3 个子区块:
      1. 年度 KPI 三卡片
      2. Top 10 队伍 + 月度分布 双图表
      3. 年度比赛列表
  -->
  <div class="year-detail" v-if="data">
    <!-- 2026 特殊提示 -->
    <div v-if="data.is_current" class="card-block" style="text-align:center;padding:24px;cursor:default;margin-bottom:16px;">
      <span style="font-size:36px;">🏆</span>
      <p style="color:var(--brand-cyan);font-size:16px;font-weight:600;margin-top:8px;">
        第 23 届世界杯 · 2026 美加墨
      </p>
      <p style="color:var(--text-secondary);font-size:13px;margin-top:4px;">
        比赛数据将在赛事进行期间更新
      </p>
    </div>

    <!-- ↓ KPI 卡片 -->
    <div class="kpi-row">
      <div class="mini-kpi">
        <div class="mini-value" style="color:var(--brand-blue);">{{ data.stats.matches || '—' }}</div>
        <div class="mini-label">比赛场次</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-value" style="color:var(--brand-orange);">{{ data.stats.goals || '—' }}</div>
        <div class="mini-label">总进球</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-value" style="color:var(--brand-cyan);">{{ data.stats.avg_goals || '—' }}</div>
        <div class="mini-label">场均进球</div>
      </div>
    </div>

    <!-- ↓ 2026 暂无比赛数据，其余年份展示图表和比赛列表 -->
    <template v-if="!data.is_current">
    <div class="charts-row">
      <div class="chart-card card-block" style="cursor:default;">
        <h3 class="module-title" style="margin-bottom:10px;">🏅 {{ year }} 年 Top 10 队伍</h3>
        <div ref="teamsRef" class="chart-body chart-container"></div>
      </div>
      <div class="chart-card card-block" style="cursor:default;">
        <h3 class="module-title" style="margin-bottom:10px;">📊 月度比赛分布</h3>
        <div ref="monthlyRef" class="chart-body chart-container"></div>
      </div>
    </div>

    <!-- ↓ 比赛列表 -->
    <div class="chart-card card-block" style="cursor:default;">
      <h3 class="module-title" style="margin-bottom:10px;">📋 {{ year }} 年比赛列表</h3>
      <el-table :data="data.matches.slice(0, 50)" max-height="400" style="width:100%">
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }"><span style="color:var(--text-muted);font-size:13px;">{{ row.date }}</span></template>
        </el-table-column>
        <el-table-column prop="home_team" label="主队" />
        <el-table-column label="比分" width="100" align="center">
          <template #default="{ row }">
            <ScoreCell :homeScore="row.home_score" :awayScore="row.away_score" />
          </template>
        </el-table-column>
        <el-table-column prop="away_team" label="客队" />
        <el-table-column prop="country" label="举办地" width="140">
          <template #default="{ row }"><span style="color:var(--text-muted);font-size:12px;">{{ row.country }}</span></template>
        </el-table-column>
      </el-table>
      <div v-if="data.matches.length > 50" style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px;">
        仅显示前50场比赛，共 {{ data.matches.length }} 场
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
/**
 * YearDetail.vue
 * 当选中年份变化时，watch year prop 重新加载数据
 * 后端 GET /api/timeline/:year → { stats, topTeams, matches }
 */
import { ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import client from '../../api/client'
import ScoreCell from '../common/ScoreCell.vue'

const props = defineProps({
  year: { type: Number, required: true }
})

const data = ref(null)
const teamsRef = ref(null)
const monthlyRef = ref(null)
let charts = []

watch(() => props.year, load, { immediate: true })

async function load() {
  try {
    const res = await client.get(`/timeline/${props.year}`)
    data.value = res.data
    await nextTick(); renderCharts()
  } catch (err) { console.error('YearDetail error:', err) }
}

function renderCharts() {
  charts.forEach(c => c.dispose()); charts = []

  // Top 10 队伍 Elo 横向柱状图
  if (teamsRef.value && data.value?.topTeams?.length) {
    const chart = echarts.init(teamsRef.value); charts.push(chart)
    const teams = [...data.value.topTeams].reverse()
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)', textStyle: { color: '#F2F5FF' } },
      grid: { left: 120, right: 40, top: 6, bottom: 6 },
      xAxis: { type: 'value', axisLabel: { color: '#687693', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } } },
      yAxis: { type: 'category', data: teams.map(t => t.team_name), axisLabel: { color: '#A0AEC7', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        type: 'bar', data: teams.map(t => Math.round(t.elo_rating)),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#2374FF' }, { offset: 1, color: '#00C48C' }]), borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 22
      }]
    })
  }

  // 月度分布柱状图
  if (monthlyRef.value && data.value?.matches) {
    const chart = echarts.init(monthlyRef.value); charts.push(chart)
    const monthly = Array(12).fill(0)
    for (const m of data.value.matches) monthly[m.month - 1]++
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#111622', borderColor: 'rgba(35,116,255,0.3)', textStyle: { color: '#F2F5FF' } },
      grid: { left: 40, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], axisLabel: { color: '#687693', fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { color: '#687693' }, splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } } },
      series: [{
        type: 'bar', data: monthly,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00C48C' }, { offset: 1, color: 'rgba(0,196,140,0.15)' }]), borderRadius: [3, 3, 0, 0] }
      }]
    })
  }
}
</script>

<style scoped>
.year-detail { display: flex; flex-direction: column; gap: 20px; }
.kpi-row { display: flex; gap: 16px; }
.mini-kpi { flex: 1; background: #111622; border: 1px solid var(--border-color); border-radius: 10px; padding: 18px; text-align: center; }
.mini-value { font-size: 30px; font-weight: 700; }
.mini-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-body { height: 300px; border-radius: 8px; }

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
  .mini-value { font-size: 22px; }
}
</style>
