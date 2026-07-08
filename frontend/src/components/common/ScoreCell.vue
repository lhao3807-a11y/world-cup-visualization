<template>
  <!--
    ScoreCell.vue — 比分展示单元格
    用途：在表格中展示比赛比分，根据胜负关系自动着色
    后端数据：matches 表中 home_score / away_score 字段
  -->
  <span class="score-cell">
    <span :class="homeClass">{{ homeScore }}</span>
    <span class="score-sep">-</span>
    <span :class="awayClass">{{ awayScore }}</span>
  </span>
</template>

<script setup>
/**
 * ScoreCell.vue
 * 比分展示组件，自动根据主客队得分判断胜负并应用颜色：
 * - 主胜 → 主队青绿 #00C48C + 客队浅灰
 * - 客胜 → 客队青绿 + 主队浅灰
 * - 平局 → 双方紫色 #9966FF
 * 后端字段: matches.home_score / matches.away_score
 */
import { computed } from 'vue'

const props = defineProps({
  homeScore: { type: Number, required: true },
  awayScore: { type: Number, required: true }
})

const homeClass = computed(() => ({
  'score-win': props.homeScore > props.awayScore,
  'score-draw': props.homeScore === props.awayScore,
  'score-lose': props.homeScore < props.awayScore
}))
const awayClass = computed(() => ({
  'score-win': props.awayScore > props.homeScore,
  'score-draw': props.awayScore === props.homeScore,
  'score-lose': props.awayScore < props.homeScore
}))
</script>

<style scoped>
.score-cell { font-size: 16px; font-weight: 700; display: flex; gap: 6px; justify-content: center; align-items: center; }
.score-win { color: var(--brand-cyan); font-size: 18px; }
.score-lose { color: var(--text-muted); }
.score-draw { color: var(--brand-purple); }
.score-sep { color: var(--text-muted); font-weight: 400; }
</style>
