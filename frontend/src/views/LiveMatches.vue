<template>
  <div class="live-matches">
    <div class="page-header">
      <div class="header-left">
        <h2>🔴 实时赛事</h2>
        <p>实时比分与赛事动态 <span v-if="liveStore.lastUpdated" class="update-time">最后更新: {{ formatTime(liveStore.lastUpdated) }}</span></p>
      </div>
      <div class="header-right">
        <el-tag :type="liveStore.isLiveSeason ? 'danger' : 'info'" effect="dark" round>
          {{ liveStore.isLiveSeason ? '● 赛事进行中' : '○ 暂无实时比赛' }}
        </el-tag>
        <el-button @click="refresh" :loading="refreshing" circle>
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-switch v-model="autoRefresh" active-text="自动刷新" @change="toggleAuto" />
      </div>
    </div>

    <!-- Simulated live section -->
    <div v-if="liveStore.recent.length" class="live-grid">
      <div v-for="match in liveStore.recent.slice(0, 8)" :key="match.id" class="live-card">
        <div class="live-card-header">
          <span class="match-tournament">{{ match.tournament }}</span>
          <el-tag size="small" type="success">已结束</el-tag>
        </div>
        <div class="live-card-body">
          <div class="team team-home">
            <div class="team-color" :style="{ background: teamStore.getTeamColor(match.home_team_norm) }"></div>
            <span class="team-name">{{ match.home_team }}</span>
          </div>
          <div class="score-display">
            <span class="score-num">{{ match.home_score }}</span>
            <span class="score-divider">:</span>
            <span class="score-num">{{ match.away_score }}</span>
          </div>
          <div class="team team-away">
            <span class="team-name">{{ match.away_team }}</span>
            <div class="team-color" :style="{ background: teamStore.getTeamColor(match.away_team_norm) }"></div>
          </div>
        </div>
        <div class="live-card-footer">
          <span>{{ match.date }}</span>
          <span>{{ match.country }}</span>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无比赛数据" />

    <!-- Info card -->
    <div class="info-card">
      <h4>📡 实时数据说明</h4>
      <p>实时赛事数据需要对接足球数据API（如 api.football-data.org）。当前环境展示的是历史数据库中最新完成的比赛。</p>
      <p>配置环境变量 <code>FOOTBALL_API_KEY</code> 和 <code>LIVE_SYNC_ENABLED=true</code> 即可启用实时赛事同步。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useLiveStore } from '../stores/liveStore'
import { useTeamStore } from '../stores/teamStore'

const liveStore = useLiveStore()
const teamStore = useTeamStore()
const autoRefresh = ref(false)
const refreshing = ref(false)

function formatTime(t) {
  return new Date(t).toLocaleTimeString('zh-CN')
}
async function refresh() {
  refreshing.value = true
  await liveStore.fetchLive()
  refreshing.value = false
}
function toggleAuto(v) {
  if (v) liveStore.startPolling(30000)
  else liveStore.stopPolling()
}

onMounted(() => {
  liveStore.fetchLive()
})

onUnmounted(() => {
  liveStore.stopPolling()
})
</script>

<style scoped>
.live-matches { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
.page-header h2 { font-size: 24px; font-weight: 700; }
.page-header p { color: var(--text-secondary); }
.header-right { display: flex; align-items: center; gap: 12px; }
.update-time { color: var(--text-muted); font-size: 12px; margin-left: 12px; }

.live-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.live-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
  padding: 16px; transition: all 0.3s;
}
.live-card:hover { border-color: var(--border-active); box-shadow: var(--glow-accent); }
.live-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.match-tournament { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.live-card-body {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px;
}
.team { display: flex; align-items: center; gap: 8px; flex: 1; }
.team-home { justify-content: flex-start; }
.team-away { justify-content: flex-end; }
.team-color { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.team-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
.score-display { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.score-num { font-size: 28px; font-weight: 800; }
.score-divider { font-size: 20px; color: var(--text-muted); }
.live-card-footer { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); }

.info-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
  padding: 20px; margin-top: 8px;
}
.info-card h4 { margin-bottom: 8px; }
.info-card p { color: var(--text-secondary); font-size: 14px; margin-bottom: 4px; }
.info-card code { background: var(--bg-input); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
</style>
