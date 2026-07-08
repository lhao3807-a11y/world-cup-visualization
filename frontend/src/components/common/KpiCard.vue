<template>
  <!--
    KpiCard.vue — 核心指标卡片
    用途：展示单个 KPI 指标（总比赛场次/总进球/参赛国家/举办国家）
    后端数据来源：GET /api/statistics/overview
    字段映射：
      matches    → overview.total_matches
      goals      → overview.total_goals
      countries  → overview.total_countries
      tournaments→ overview.total_countries (举办地数量)
  -->
  <div
    class="kpi-card"
    :class="colorClass"
    @click="$emit('detail', key)"
  >
    <span class="detail-hint">ⓘ 详情</span>

    <!-- 图标区域 — 专属渐变底色圆 -->
    <div class="kpi-icon-wrap" :style="{ background: iconBg }">
      <el-icon :size="22" :color="iconColor">
        <component :is="icon" />
      </el-icon>
    </div>

    <!-- 数字 + 标签区域 -->
    <div class="kpi-info">
      <div class="kpi-value count-num">{{ animatedValue }}</div>
      <div class="kpi-label">{{ label }}</div>
    </div>

    <!-- 底部主题色装饰短线 -->
    <div class="kpi-accent" :style="{ background: iconColor }"></div>
  </div>
</template>

<script setup>
/**
 * KpiCard.vue
 * 单个核心指标展示卡片，包含：
 * - 主题色图标圆块（蓝/橙/青绿/紫 四色对应四个指标）
 * - 大号数字（支持从 0 滚动动画到目标值）
 * - 底部装饰线 + hover 上浮
 *
 * @prop key          - 指标唯一标识 (matches/goals/countries/tournaments)
 * @prop label        - 指标中文名称
 * @prop animatedValue - 已格式化的显示数值（含千分位逗号）
 * @prop icon         - Element Plus 图标组件名
 * @prop iconColor    - 图标颜色 (hex)
 * @prop iconBg       - 图标背景色 (rgba)
 * @prop colorClass   - CSS 类名 (kpi-blue/kpi-orange/kpi-cyan/kpi-purple)
 */
defineProps({
  key: { type: String, required: true },
  label: { type: String, required: true },
  animatedValue: { type: String, default: '...' },
  icon: { type: [String, Object], required: true },
  iconColor: { type: String, default: '#2374FF' },
  iconBg: { type: String, default: 'rgba(35,116,255,0.15)' },
  colorClass: { type: String, default: 'kpi-blue' }
})

defineEmits(['detail'])
</script>

<style scoped>
.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-hover);
  border-color: var(--border-active);
}
.kpi-card:active { transform: scale(0.985); }
.kpi-accent {
  position: absolute;
  bottom: 0; left: 20px; right: 20px;
  height: 2px;
  border-radius: 1px;
  opacity: 0.5;
  transition: opacity 0.25s;
}
.kpi-card:hover .kpi-accent { opacity: 1; }
.kpi-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: filter 0.25s;
}
.kpi-card:hover .kpi-icon-wrap { filter: brightness(1.3); }
.kpi-info { flex: 1; min-width: 0; }
.kpi-value {
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.5px;
}
.kpi-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

@media (max-width: 768px) {
  .kpi-value { font-size: 24px; }
  .kpi-icon-wrap { width: 40px; height: 40px; }
}
@media (max-width: 480px) {
  .kpi-card { padding: 14px 12px; gap: 10px; }
  .kpi-value { font-size: 20px; }
}
</style>
