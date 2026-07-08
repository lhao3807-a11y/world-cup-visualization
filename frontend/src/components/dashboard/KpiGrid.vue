<!--
  KpiGrid.vue — 首页 4 个世界杯核心指标卡片
  matches    — 世界杯比赛总场次
  goals      — 世界杯总进球数
  teams      — 参赛国家/地区数
  editions   — 历届世界杯届数
-->
<template>
  <div class="kpi-grid">
    <KpiCard
      v-for="kpi in kpis"
      :key="kpi.key"
      v-bind="kpi"
      :animatedValue="animatedValues[kpi.key] || '...'"
      @detail="$emit('detail', kpi.key)"
    />
  </div>
</template>

<script setup>
import KpiCard from '../common/KpiCard.vue'

defineProps({
  animatedValues: { type: Object, default: () => ({}) }
})
defineEmits(['detail'])

const kpis = [
  { key: 'matches',  label: '历史总场次',   icon: 'TrophyBase',  iconColor: '#2374FF', iconBg: 'rgba(35,116,255,0.15)' },
  { key: 'goals',    label: '历史总进球',   icon: 'Football',    iconColor: '#FF7D34', iconBg: 'rgba(255,125,52,0.15)' },
  { key: 'teams',    label: '参赛国家/地区', icon: 'MapLocation', iconColor: '#00C48C', iconBg: 'rgba(0,196,140,0.15)' },
  { key: 'editions', label: '历届世界杯',    icon: 'Trophy',      iconColor: '#9966FF', iconBg: 'rgba(153,102,255,0.15)' }
]
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
</style>
