<template>
  <!--
    TournamentTag.vue — 赛事标签
    用途：将赛事名称渲染为彩色圆角标签，不同类型自动匹配颜色
    后端数据：matches.tournament 字段
  -->
  <span class="tournament-tag" :class="tagClass">{{ name }}</span>
</template>

<script setup>
/**
 * TournamentTag.vue
 * 根据赛事名称自动分配标签颜色：
 * - World Cup 正赛   → 青绿 #00C48C
 * - World Cup 预选赛  → 蓝色 #2374FF
 * - Friendly 友谊赛   → 紫色 #9966FF
 * - Continental/Euro/Copa 洲际 → 橙色 #FF7D34
 * - 其他              → 浅灰
 * 后端字段: matches.tournament
 */
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true }
})

const tagClass = computed(() => {
  const t = (props.name || '').toLowerCase()
  if (t.includes('world cup') && !t.includes('qualif')) return 'tag-wc'
  if (t.includes('world cup')) return 'tag-wcq'
  if (t.includes('friendly')) return 'tag-friendly'
  if (t.includes('continental') || t.includes('euro') || t.includes('copa')) return 'tag-continental'
  return 'tag-other'
})
</script>

<style scoped>
.tournament-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.tag-wc { background: rgba(0,196,140,0.15); color: #00C48C; }
.tag-wcq { background: rgba(35,116,255,0.15); color: #2374FF; }
.tag-friendly { background: rgba(153,102,255,0.12); color: #9966FF; }
.tag-continental { background: rgba(255,125,52,0.12); color: #FF7D34; }
.tag-other { background: rgba(160,174,199,0.1); color: #A0AEC7; }
</style>
