<template>
  <div class="timeline-page">
    <div class="page-header">
      <h2>⏳ 世界杯时间轴</h2>
      <p>拖动时间轴探索1930年至今的历届世界杯</p>
    </div>

    <TimelineSlider v-model="selectedYear" />
    <YearDetail :year="selectedYear" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TimelineSlider from '../components/timeline/TimelineSlider.vue'
import YearDetail from '../components/timeline/YearDetail.vue'

const selectedYear = ref(2022)
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; color: var(--text-title); }
.page-header p { color: var(--text-secondary); margin-top: 4px; font-size: 14px; }
</style>
