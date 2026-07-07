import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const yearRange = ref([1872, 2026])
  const selectedCountries = ref([])
  const selectedTournaments = ref([])
  const isWorldCupOnly = ref(false)

  function reset() {
    yearRange.value = [1872, 2026]
    selectedCountries.value = []
    selectedTournaments.value = []
    isWorldCupOnly.value = false
  }

  function setYearRange(range) {
    yearRange.value = range
  }

  return { yearRange, selectedCountries, selectedTournaments, isWorldCupOnly, reset, setYearRange }
})
