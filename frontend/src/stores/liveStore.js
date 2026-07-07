import { defineStore } from 'pinia'
import { ref } from 'vue'
import client from '../api/client'

export const useLiveStore = defineStore('live', () => {
  const matches = ref([])
  const recent = ref([])
  const lastUpdated = ref(null)
  const isPolling = ref(false)
  const isLiveSeason = ref(false)
  let timer = null

  async function fetchLive() {
    try {
      const res = await client.get('/live/matches')
      matches.value = res.data.live || []
      recent.value = res.data.recent || []
      lastUpdated.value = res.data.last_updated
      isLiveSeason.value = res.data.is_live_season
    } catch (err) {
      console.error('Live fetch error:', err)
    }
  }

  function startPolling(interval = 60000) {
    if (isPolling.value) return
    isPolling.value = true
    fetchLive()
    timer = setInterval(fetchLive, interval)
  }

  function stopPolling() {
    isPolling.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { matches, recent, lastUpdated, isPolling, isLiveSeason, fetchLive, startPolling, stopPolling }
})
