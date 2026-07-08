<template>
  <!--
    TeamSelectors.vue — 双队伍选择器
    后端数据: GET /api/teams (获取所有队伍列表)
    选择两支队伍后触发 compare 事件
  -->
  <div class="compare-selectors card-block" style="cursor:default;">
    <div class="selector-item">
      <label>队伍 A</label>
      <el-select v-model="teamA" filterable placeholder="选择队伍" @change="checkCompare" :loading="!loaded" size="default">
        <el-option v-for="t in teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
      </el-select>
    </div>
    <div class="vs-divider"><span>VS</span></div>
    <div class="selector-item">
      <label>队伍 B</label>
      <el-select v-model="teamB" filterable placeholder="选择队伍" @change="checkCompare" :loading="!loaded" size="default">
        <el-option v-for="t in teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
      </el-select>
    </div>
  </div>
</template>

<script setup>
/**
 * TeamSelectors.vue
 * 双向选择器，两方都选择后触发 compare 事件
 * 后端 GET /api/teams → 填充下拉选项
 */
import { ref } from 'vue'

defineProps({
  teams: { type: Array, default: () => [] },
  loaded: { type: Boolean, default: false }
})
const emit = defineEmits(['compare'])
const teamA = ref('')
const teamB = ref('')

function checkCompare() {
  if (teamA.value && teamB.value) {
    emit('compare', teamA.value, teamB.value)
  }
}
</script>

<style scoped>
.compare-selectors { display: flex; align-items: flex-end; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
.selector-item { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px; }
.selector-item label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.vs-divider { font-size: 22px; font-weight: 800; color: var(--brand-blue); padding-bottom: 8px; }
@media (max-width: 768px) {
  .compare-selectors { flex-direction: column; align-items: stretch; }
  .vs-divider { text-align: center; }
}
</style>
