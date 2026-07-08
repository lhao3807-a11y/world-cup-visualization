<template>
  <!--
    H2HSummary.vue — 交锋数据摘要卡片
    后端返回: POST /api/compare/teams → head_to_head.summary
    summary 字段:
      { teamA_wins, teamB_wins, draws, teamA_goals, teamB_goals }
  -->
  <div class="h2h-summary" v-if="cards.length">
    <div class="h2h-card" v-for="c in cards" :key="c.label">
      <div class="h2h-value" :style="{ color: c.color }">{{ c.value }}</div>
      <div class="h2h-label">{{ c.label }}</div>
    </div>
  </div>
</template>

<script setup>
/**
 * H2HSummary.vue
 * 5 张横向摘要卡片：A胜/平局/B胜/A进球/B进球
 */
import { computed } from 'vue'

const props = defineProps({
  teamA: { type: String, default: '' },
  teamB: { type: String, default: '' },
  summary: { type: Object, default: null }
})

const cards = computed(() => {
  const s = props.summary
  if (!s) return []
  return [
    { label: `${props.teamA} 胜`, value: s.teamA_wins, color: 'var(--brand-cyan)' },
    { label: '平局', value: s.draws, color: 'var(--brand-purple)' },
    { label: `${props.teamB} 胜`, value: s.teamB_wins, color: 'var(--brand-blue)' },
    { label: `${props.teamA} 进球`, value: s.teamA_goals, color: 'var(--brand-orange)' },
    { label: `${props.teamB} 进球`, value: s.teamB_goals, color: 'var(--brand-orange)' }
  ]
})
</script>

<style scoped>
.h2h-summary { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.h2h-card { flex: 1; min-width: 100px; background: #111622; border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; text-align: center; }
.h2h-value { font-size: 26px; font-weight: 700; }
.h2h-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
</style>
