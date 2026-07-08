<template>
  <div class="filters-bar card-block" style="cursor:default;">
    <!-- 年份范围滑块 -->
    <div class="filter-row">
      <div class="filter-item filter-full">
        <label>世界杯年份</label>
        <el-slider
          v-model="filters.yearRange" range
          :min="1930" :max="2026"
          :step="4"
          :marks="yearMarks"
        />
      </div>
    </div>

    <!-- 队伍筛选行 -->
    <div class="filter-row">
      <div class="filter-item">
        <label>主队</label>
        <el-select v-model="filters.homeTeam" filterable clearable placeholder="选择队伍" :loading="!teamsLoaded" size="default">
          <el-option v-for="t in teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
        </el-select>
      </div>

      <div class="filter-item">
        <label>客队</label>
        <el-select v-model="filters.awayTeam" filterable clearable placeholder="选择队伍" size="default">
          <el-option v-for="t in teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
        </el-select>
      </div>

      <div class="filter-item filter-actions">
        <el-button type="primary" @click="$emit('search')">🔍 搜索</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filters: { type: Object, required: true },
  teams: { type: Array, default: () => [] },
  teamsLoaded: { type: Boolean, default: false }
})

defineEmits(['search', 'reset'])

const yearMarks = {
  1930: '1930', 1950: '1950', 1966: '1966',
  1978: '1978', 1990: '1990', 2002: '2002',
  2014: '2014', 2026: '2026'
}
</script>

<style scoped>
.filters-bar { margin-bottom: 20px; }
.filter-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 12px; }
.filter-row:last-child { margin-bottom: 0; }
.filter-item { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 6px; }
.filter-full { flex: 3; min-width: 200px; }
.filter-item label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.filter-actions { flex: 0 0 auto; flex-direction: row; align-items: flex-end; gap: 8px; }
@media (max-width: 768px) { .filter-item { min-width: 100%; } }
</style>
