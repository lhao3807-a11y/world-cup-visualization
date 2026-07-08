<template>
  <div class="live-matches">
    <div class="page-header">
      <div class="header-left">
        <h2>🔴 2026 世界杯</h2>
        <p>
          第 23 届美加墨世界杯
          <span v-if="lastUpdated" style="color:var(--text-muted);font-size:12px;margin-left:12px;">
            最后更新: {{ formatTime(lastUpdated) }}
          </span>
        </p>
      </div>
      <div class="header-right">
        <el-tag :color="statusColor" effect="dark" round>
          {{ statusText }}
        </el-tag>
        <el-button @click="refresh" :loading="refreshing" circle>
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-switch v-if="isLive" v-model="autoRefresh" active-text="自动刷新" @change="toggleAuto" style="--el-switch-on-color:#00C48C;" />
      </div>
    </div>

    <!-- 比赛卡片网格 -->
    <div v-if="matches.length" class="live-grid">
      <LiveMatchCard v-for="match in sortedMatches" :key="match.match_id || match.id" :match="match" />
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="card-block" style="text-align:center;padding:60px;cursor:default;">
      <span style="font-size:48px;opacity:0.3;">🏟️</span>
      <p style="color:var(--text-title);font-size:18px;font-weight:600;margin-top:12px;">
        2026 美加墨世界杯
      </p>
      <p style="color:var(--text-secondary);margin-top:8px;">
        第 23 届世界杯比赛数据尚未接入
      </p>
      <div style="margin-top:20px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <el-button type="primary" size="small" @click="syncFromApi" :loading="syncing">
          从 API 同步
        </el-button>
        <el-button size="small" @click="showManualDialog = true">
          手动录入比赛
        </el-button>
      </div>
      <p style="color:var(--text-muted);font-size:12px;margin-top:12px;">
        配置 FOOTBALL_API_KEY 后可自动同步 football-data.org 数据
      </p>
    </div>

    <!-- 配置说明 -->
    <div v-if="!apiConfigured" class="info-card card-block" style="cursor:default;">
      <h4 style="color:var(--text-title);margin-bottom:8px;">📡 实时数据配置</h4>
      <p style="color:var(--text-secondary);font-size:14px;margin-bottom:4px;">
        通过 football-data.org API 获取 2026 世界杯实时比赛数据。
      </p>
      <p style="color:var(--text-muted);font-size:13px;">
        1. 前往 <a href="https://www.football-data.org/" target="_blank" style="color:var(--brand-blue);">football-data.org</a> 注册获取免费 API Key<br/>
        2. 设置环境变量 <code>FOOTBALL_API_KEY=你的key</code> 和 <code>LIVE_SYNC_ENABLED=true</code><br/>
        3. 重启后端服务，点击上方"从 API 同步"按钮
      </p>
    </div>

    <!-- 手动录入弹窗 -->
    <el-dialog v-model="showManualDialog" title="手动录入 2026 世界杯比赛" width="480px">
      <el-form :model="manualForm" label-width="80px">
        <el-form-item label="日期">
          <el-date-picker v-model="manualForm.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="主队">
          <el-input v-model="manualForm.home_team" placeholder="主队名称" />
        </el-form-item>
        <el-form-item label="客队">
          <el-input v-model="manualForm.away_team" placeholder="客队名称" />
        </el-form-item>
        <el-form-item label="比分">
          <el-input-number v-model="manualForm.home_score" :min="0" size="small" /> -
          <el-input-number v-model="manualForm.away_score" :min="0" size="small" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="manualForm.status">
            <el-radio value="scheduled">未开始</el-radio>
            <el-radio value="live">进行中</el-radio>
            <el-radio value="finished">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showManualDialog = false">取消</el-button>
        <el-button type="primary" @click="submitManualMatch" :loading="submitting">确认录入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import client from '../api/client'
import LiveMatchCard from '../components/live/LiveMatchCard.vue'

const matches = ref([])
const loading = ref(true)
const refreshing = ref(false)
const syncing = ref(false)
const submitting = ref(false)
const lastUpdated = ref(null)
const isLive = ref(false)
const apiConfigured = ref(false)
const autoRefresh = ref(false)
const showManualDialog = ref(false)
let timer = null

const manualForm = ref({
  date: '2026-06-11', home_team: '', away_team: '',
  home_score: 0, away_score: 0, status: 'scheduled'
})

const sortedMatches = computed(() => {
  return [...matches.value].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1
    if (b.status === 'live' && a.status !== 'live') return 1
    return (b.date || '').localeCompare(a.date || '')
  })
})

const statusColor = computed(() => {
  if (!matches.value.length) return '#687693'
  return isLive.value ? '#00C48C' : '#2374FF'
})

const statusText = computed(() => {
  if (!matches.value.length) return '○ 暂无数据'
  if (isLive.value) {
    const live = matches.value.filter(m => m.status === 'live').length
    return `● ${live} 场进行中`
  }
  const finished = matches.value.filter(m => m.status === 'finished').length
  return `✓ ${finished} 场已完成`
})

function formatTime(t) { return new Date(t).toLocaleString('zh-CN') }

async function fetchLive() {
  try {
    const res = await client.get('/live/matches')
    matches.value = res.data.matches || []
    lastUpdated.value = res.data.last_updated
    isLive.value = res.data.is_live_season
    apiConfigured.value = res.data.api_configured
  } catch (err) { /* handled by interceptor */ }
  finally { loading.value = false }
}

async function refresh() { refreshing.value = true; await fetchLive(); refreshing.value = false }

async function syncFromApi() {
  syncing.value = true
  try {
    const res = await client.post('/live/sync')
    ElMessage.success(res.message || '同步完成')
    await fetchLive()
  } catch (err) {
    ElMessage.error('同步失败，请检查 API 配置')
  } finally { syncing.value = false }
}

async function submitManualMatch() {
  if (!manualForm.value.date || !manualForm.value.home_team || !manualForm.value.away_team) {
    ElMessage.warning('请填写日期、主队和客队')
    return
  }
  submitting.value = true
  try {
    const res = await client.post('/live/match', {
      date: manualForm.value.date,
      home_team: manualForm.value.home_team,
      away_team: manualForm.value.away_team,
      home_score: manualForm.value.home_score,
      away_score: manualForm.value.away_score,
      status: manualForm.value.status
    })
    ElMessage.success(res.message || '录入成功')
    showManualDialog.value = false
    await fetchLive()
  } catch (err) {
    ElMessage.error('录入失败')
  } finally { submitting.value = false }
}

function toggleAuto(v) { v ? timer = setInterval(fetchLive, 30000) : clearInterval(timer) }

onMounted(async () => {
  await fetchLive()
  // 获取配置
  try {
    const cfg = await client.get('/live/config')
    apiConfigured.value = cfg.data.api_configured
  } catch (e) { /**/ }
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.live-matches { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
.page-header h2 { font-size: 24px; font-weight: 700; color: var(--text-title); }
.page-header p { color: var(--text-secondary); margin-top: 4px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.live-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.info-card code { background: rgba(35,116,255,0.12); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
</style>
