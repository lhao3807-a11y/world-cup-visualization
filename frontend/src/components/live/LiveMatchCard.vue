<template>
  <div class="live-card card-block">
    <div class="live-card-header">
      <span class="match-tournament">🏆 2026 世界杯</span>
      <el-tag effect="dark" :color="statusConf.color" size="small">
        <span v-if="isLive" class="pulse-dot" style="width:6px;height:6px;margin-right:4px;"></span>
        {{ statusConf.text }}
      </el-tag>
    </div>
    <div class="live-card-body">
      <div class="team team-home">
        <div class="team-color" :style="{ background: teamColor(match.home_team || match.home_team_norm) }"></div>
        <span class="team-name">{{ match.home_team }}</span>
      </div>
      <div class="score-display">
        <span class="score-num" :class="{ live: isLive }">{{ match.home_score ?? '-' }}</span>
        <span class="score-divider">:</span>
        <span class="score-num" :class="{ live: isLive }">{{ match.away_score ?? '-' }}</span>
      </div>
      <div class="team team-away">
        <span class="team-name">{{ match.away_team }}</span>
        <div class="team-color" :style="{ background: teamColor(match.away_team || match.away_team_norm) }"></div>
      </div>
    </div>
    <div class="live-card-footer">
      <span>{{ match.date || match.start_time?.substring(0, 10) || 'TBD' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '../../stores/teamStore'

const teamStore = useTeamStore()

const props = defineProps({
  match: { type: Object, required: true }
})

const isLive = computed(() => props.match.status === 'live')
const isScheduled = computed(() => props.match.status === 'scheduled')

const statusConf = computed(() => {
  if (isLive.value) return { color: '#f56c6c', text: '● 进行中' }
  if (isScheduled.value) return { color: '#e6a23c', text: '未开始' }
  return { color: '#687693', text: '已结束' }
})

function teamColor(name) { return name ? teamStore.getTeamColor(name) : '#2374FF' }
</script>

<style scoped>
.live-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.match-tournament { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.live-card-body { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.team { display: flex; align-items: center; gap: 8px; flex: 1; }
.team-home { justify-content: flex-start; }
.team-away { justify-content: flex-end; }
.team-color { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.team-name { font-weight: 600; font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.score-display { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.score-num { font-size: 28px; font-weight: 800; color: var(--text-primary); }
.score-num.live { color: var(--brand-cyan); animation: pulse-glow 1.5s infinite; }
.score-divider { font-size: 20px; color: var(--text-muted); font-weight: 400; }
.live-card-footer { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); }

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
