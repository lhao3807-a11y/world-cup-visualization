/**
 * useChartTheme.js — ECharts 共享主题配置
 *
 * 消除各组件中重复的 tooltip/grid/axis 样式代码。
 * 所有图表组件统一从这里获取样式配置。
 */

/**
 * 深色主题 tooltip 样式
 */
export function tooltipStyle() {
  return {
    trigger: 'axis',
    backgroundColor: '#111622',
    borderColor: 'rgba(35,116,255,0.3)',
    textStyle: { color: '#F2F5FF' }
  }
}

/**
 * tooltip (item 模式，用于 treemap/pie)
 */
export function tooltipItemStyle() {
  return {
    trigger: 'item',
    backgroundColor: '#111622',
    borderColor: 'rgba(35,116,255,0.3)',
    textStyle: { color: '#F2F5FF' }
  }
}

/**
 * Grid 间距快捷生成
 */
export function grid(l = 48, r = 24, t = 24, b = 36) {
  return { left: l, right: r, top: t, bottom: b }
}

/**
 * 坐标轴线样式 (X/Y 轴通用)
 */
export function axisStyle(fontSize = 10) {
  return {
    axisLabel: { color: '#687693', fontSize },
    splitLine: { lineStyle: { color: 'rgba(40,80,180,0.06)', type: 'dashed' } }
  }
}

/**
 * X 轴 — 年份刻度 (间隔 19 年避免拥挤)
 */
export function yearXAxis(data) {
  return {
    type: 'category',
    data,
    axisLabel: { color: '#687693', fontSize: 9, rotate: 45, interval: 19 },
    axisLine: { lineStyle: { color: 'rgba(40,80,180,0.15)' } }
  }
}

/**
 * Y 轴 — 横向柱状图分类 (队伍名)
 */
export function categoryYAxis(data) {
  return {
    type: 'category',
    data,
    axisLabel: { color: '#A0AEC7', fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false }
  }
}

/**
 * 蓝色→青绿渐变色 (横向柱状图)
 */
export function blueCyanGradient() {
  if (typeof echarts === 'undefined') return '#2374FF'
  const { echarts } = window
  return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { offset: 0, color: '#2374FF' },
    { offset: 1, color: '#00C48C' }
  ])
}

/**
 * 青绿面积渐变填充
 */
export function cyanAreaGradient() {
  if (typeof echarts === 'undefined') return undefined
  const { echarts } = window
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgba(0,196,140,0.25)' },
    { offset: 1, color: 'rgba(0,196,140,0.01)' }
  ])
}

/**
 * 蓝色面积渐变填充
 */
export function blueAreaGradient() {
  if (typeof echarts === 'undefined') return undefined
  const { echarts } = window
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgba(35,116,255,0.25)' },
    { offset: 1, color: 'rgba(35,116,255,0.01)' }
  ])
}

/**
 * DataZoom slider 通用配置
 */
export function dataZoomSlider() {
  return {
    type: 'slider',
    start: 0,
    end: 100,
    height: 16,
    bottom: 4,
    borderColor: 'rgba(40,80,180,0.12)',
    backgroundColor: 'rgba(17,22,34,0.8)',
    fillerColor: 'rgba(35,116,255,0.1)'
  }
}

/**
 * 标题样式 (用于 ECharts title 配置)
 */
export function chartTitle(text) {
  return {
    text,
    left: 'center',
    top: 8,
    textStyle: { fontSize: 14, color: '#F2F5FF' }
  }
}
