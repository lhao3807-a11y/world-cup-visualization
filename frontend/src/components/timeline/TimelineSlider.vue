<template>
  <!--
    TimelineSlider.vue — 时间轴年份选择器
    包含：
      1. 年份刻度点（每10年一个标记，世界杯年加粗）
      2. el-slider 拖拽滑块
      3. 快捷跳转按钮（关键世界杯年份）
  -->
  <div class="timeline-card card-block" style="cursor:default;">
    <!-- 年份刻度点行 -->
    <div class="timeline-years">
      <button
        v-for="y in yearMarkers" :key="y"
        class="year-dot"
        :class="{ active: modelValue === y, 'wc-year': wcYears.includes(y) }"
        @click="$emit('update:modelValue', y)"
      >{{ y }}</button>
    </div>

    <!-- 拖拽滑块 -->
    <div class="slider-wrap">
      <el-slider
        :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)"
        :min="1930" :max="2026" :step="1"
        show-input :format-tooltip="(v) => v + '年'"
      />
    </div>

    <!-- 快捷跳转按钮 -->
    <div class="quick-jumps">
      <el-button
        size="small"
        v-for="y in quickYears" :key="y"
        :type="modelValue === y ? 'primary' : 'default'"
        @click="$emit('update:modelValue', y)"
      >{{ y }}</el-button>
    </div>
  </div>
</template>

<script setup>
/**
 * TimelineSlider.vue
 * 年份选择器，双向绑定选中年份
 * v-model:modelValue 对应选中的世界杯年份
 */
import { computed } from 'vue'

defineProps({ modelValue: { type: Number, default: 2022 } })
defineEmits(['update:modelValue'])

// ↓ 每10年一个刻度标记
const yearMarkers = computed(() => {
  const m = []
  for (let y = 1930; y <= 2026; y += 10) m.push(y)
  if (!m.includes(2026)) m.push(2026)
  return m
})

// ↓ 世界杯年份列表用于加粗标识
const wcYears = computed(() => {
  const years = []
  for (let y = 1930; y <= 2026; y += 4) {
    if (y !== 1942 && y !== 1946) years.push(y)
  }
  return years
})

// ↓ 快捷跳转的关键世界杯年份
const quickYears = [1930, 1950, 1966, 1970, 1990, 1998, 2002, 2010, 2018, 2022, 2026]
</script>

<style scoped>
.timeline-card { margin-bottom: 20px; }
.timeline-years { display: flex; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 4px; }
.year-dot {
  background: var(--bg-card-alt); border: 1px solid var(--border-color);
  color: var(--text-muted); border-radius: 6px; padding: 4px 8px; font-size: 11px;
  cursor: pointer; transition: all 0.2s; font-weight: 500;
}
.year-dot:hover, .year-dot.active {
  background: var(--brand-blue); color: #fff; border-color: var(--brand-blue);
}
.year-dot.wc-year { font-weight: 700; }
.slider-wrap { padding: 0 8px; }
.quick-jumps { display: flex; gap: 6px; margin-top: 16px; flex-wrap: wrap; }
</style>
