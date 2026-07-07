import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref(localStorage.getItem('theme') || 'dark')

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', mode.value)
    document.documentElement.setAttribute('data-theme', mode.value)
  }

  function init() {
    document.documentElement.setAttribute('data-theme', mode.value)
  }

  return { mode, toggle, init }
})
