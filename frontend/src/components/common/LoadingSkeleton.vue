<!--
  LoadingSkeleton.vue — 全局加载骨架屏
  Props:
    rows  — 骨架行数
    type  — 'table' | 'card' | 'chart'
-->
<template>
  <div class="skeleton" :class="type">
    <template v-if="type === 'card'">
      <div class="sk-card" v-for="i in rows" :key="i">
        <div class="sk-line sk-line-short"></div>
        <div class="sk-line sk-line-long"></div>
      </div>
    </template>
    <template v-else-if="type === 'chart'">
      <div class="sk-chart">
        <div class="sk-line sk-line-title"></div>
        <div class="sk-chart-area"></div>
      </div>
    </template>
    <template v-else>
      <div class="sk-row" v-for="i in rows" :key="i">
        <div class="sk-cell" v-for="j in 4" :key="j"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 4 },
  type: { type: String, default: 'table' } // 'table' | 'card' | 'chart'
})
</script>

<style scoped>
.skeleton { display: flex; flex-direction: column; gap: 12px; padding: 16px; }

/* Table skeleton */
.sk-row { display: flex; gap: 16px; }
.sk-cell {
  flex: 1; height: 20px; border-radius: 4px;
  background: linear-gradient(90deg, rgba(40,80,180,0.08), rgba(40,80,180,0.15), rgba(40,80,180,0.08));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Card skeleton */
.sk-card { display: flex; flex-direction: column; gap: 8px; padding: 20px; background: var(--bg-card); border-radius: 10px; }
.sk-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, rgba(40,80,180,0.08), rgba(40,80,180,0.15), rgba(40,80,180,0.08)); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.sk-line-short { width: 40%; }
.sk-line-long { width: 80%; }
.sk-line-title { width: 30%; height: 16px; }

/* Chart skeleton */
.sk-chart { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.sk-chart-area { height: 260px; border-radius: 8px; background: linear-gradient(90deg, rgba(40,80,180,0.06), rgba(40,80,180,0.1), rgba(40,80,180,0.06)); background-size: 200% 100%; animation: shimmer 1.5s infinite; }

@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
</style>
