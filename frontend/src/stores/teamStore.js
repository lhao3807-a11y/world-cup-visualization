import { defineStore } from 'pinia'
import { ref } from 'vue'
import client from '../api/client'

export const useTeamStore = defineStore('team', () => {
  const teams = ref([])
  const loaded = ref(false)

  async function fetchTeams() {
    if (loaded.value) return
    try {
      const res = await client.get('/teams')
      teams.value = res.data
      loaded.value = true
    } catch (err) {
      console.error('Failed to load teams:', err)
    }
  }

  function getTeamColor(name) {
    const t = teams.value.find(t => t.current_name === name || t.original_name === name)
    return t?.color_code || '#409EFF'
  }

  return { teams, loaded, fetchTeams, getTeamColor }
})
