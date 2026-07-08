/**
 * useChartResize.js — ECharts 实例自适应
 *
 * 统一管理 window resize 事件，自动调用所有图表的 resize()。
 * 避免每个组件各自手动绑定/解绑。
 */

import { onUnmounted } from 'vue'

export function useChartResize() {
  const charts = []

  function register(chart) {
    if (chart) charts.push(chart)
  }

  function disposeAll() {
    charts.forEach(c => c?.dispose?.())
    charts.length = 0
  }

  function resizeAll() {
    charts.forEach(c => c?.resize?.())
  }

  window.addEventListener('resize', resizeAll)

  onUnmounted(() => {
    window.removeEventListener('resize', resizeAll)
    disposeAll()
  })

  return { register, disposeAll, resizeAll }
}
