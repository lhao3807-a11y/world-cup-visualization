import { ref, onMounted } from 'vue'

export function useCountUp(targetRef, endValue, options = {}) {
  const { duration = 1200, delay = 0, formatter = (v) => Math.round(v).toLocaleString() } = options
  const displayValue = ref('0')
  let raf = null

  function animate() {
    const start = performance.now()
    const startVal = 0
    const endVal = typeof endValue === 'function' ? endValue() : (endValue || 0)

    function step(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (endVal - startVal) * eased
      displayValue.value = formatter(current)

      if (progress < 1) {
        raf = requestAnimationFrame(step)
      } else {
        displayValue.value = formatter(endVal)
      }
    }

    raf = requestAnimationFrame(step)
  }

  onMounted(() => {
    setTimeout(animate, delay)
  })

  return { displayValue }
}
