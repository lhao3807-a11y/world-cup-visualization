<template>
  <!--
    ChartCard.vue — 通用图表卡片容器
    用途：包裹所有 ECharts 图表，提供统一的标题栏、悬浮效果、点击详情入口
    后端对应：无直接后端接口，通过 props 控制标题和详情类型
  -->
  <div class="chart-card card-block" @click="$emit('detail', detailType)">
    <!-- 右上角详情提示图标，hover 时显现 -->
    <span class="detail-hint" v-if="showDetail">ⓘ 详情</span>

    <!-- 标题栏：左侧图标+标题，右侧提示文字 -->
    <div class="chart-header" v-if="title">
      <h3 class="module-title">
        <span class="title-icon" v-if="icon">{{ icon }}</span>
        {{ title }}
      </h3>
      <span class="title-hint" v-if="hint">{{ hint }}</span>
    </div>

    <!-- 图表画布插槽，由父组件注入 ECharts 的 ref 容器 -->
    <div class="chart-body chart-container">
      <slot />
    </div>

    <!-- 底部小字备注（可选） -->
    <div class="chart-note" v-if="note">{{ note }}</div>
  </div>
</template>

<script setup>
/**
 * ChartCard.vue
 * 所有图表卡片的统一容器，提供：
 * - 渐变描边 + 悬浮上浮效果（继承 card-block）
 * - 统一的标题栏（module-title 样式）
 * - 可选的详情点击回调
 *
 * @prop title    - 卡片标题文字
 * @prop icon     - 标题前的 emoji 图标
 * @prop hint     - 标题右侧的辅助提示
 * @prop note     - 图表底部的备注文字
 * @prop detailType - 点击详情时传递的类型标识
 * @prop showDetail - 是否显示右上角详情入口
 */
defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  hint: { type: String, default: '' },
  note: { type: String, default: '' },
  detailType: { type: String, default: '' },
  showDetail: { type: Boolean, default: false }
})

defineEmits(['detail'])
</script>

<style scoped>
.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 18px;
  position: relative;
  transition: all 0.25s ease;
  cursor: pointer;
}
/* 渐变边框效果 */
.chart-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(90deg, rgba(35,116,255,0.18), rgba(0,196,140,0.18));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.4;
  transition: opacity 0.25s;
}
.chart-card:hover { transform: translateY(-2px); box-shadow: var(--glow-hover); }
.chart-card:hover::before { opacity: 1; }
.chart-card:active { transform: scale(0.988); }
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.chart-body { height: 310px; border-radius: 8px; }
.chart-note { text-align: right; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
</style>
