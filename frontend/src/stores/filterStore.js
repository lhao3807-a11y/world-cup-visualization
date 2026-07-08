import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * filterStore — 全局筛选状态
 *
 * 所有页面的筛选条件统一管理，支持：
 *   1. 跨页面保持筛选状态
 *   2. 从 URL query 恢复筛选参数
 *   3. 一键重置所有筛选条件
 */

const MIN_YEAR = 1930
const MAX_YEAR = 2026

export const useFilterStore = defineStore('filter', () => {
  // ------ 状态 ------
  const yearRange = ref([MIN_YEAR, MAX_YEAR])
  const selectedCountries = ref([])
  const selectedTournaments = ref([])
  const selectedTeam = ref('')
  const isWorldCupOnly = ref(false)
  const searchKeyword = ref('')

  // ------ 计算属性 ------
  const hasActiveFilters = computed(() => {
    return (
      yearRange.value[0] !== MIN_YEAR ||
      yearRange.value[1] !== MAX_YEAR ||
      selectedCountries.value.length > 0 ||
      selectedTournaments.value.length > 0 ||
      selectedTeam.value !== '' ||
      isWorldCupOnly.value ||
      searchKeyword.value !== ''
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (yearRange.value[0] !== MIN_YEAR || yearRange.value[1] !== MAX_YEAR) count++
    if (selectedCountries.value.length > 0) count++
    if (selectedTournaments.value.length > 0) count++
    if (selectedTeam.value !== '') count++
    if (isWorldCupOnly.value) count++
    if (searchKeyword.value !== '') count++
    return count
  })

  // ------ 方法 ------
  function reset() {
    yearRange.value = [MIN_YEAR, MAX_YEAR]
    selectedCountries.value = []
    selectedTournaments.value = []
    selectedTeam.value = ''
    isWorldCupOnly.value = false
    searchKeyword.value = ''
  }

  function setYearRange(range) {
    yearRange.value = [Math.max(MIN_YEAR, range[0]), Math.min(MAX_YEAR, range[1])]
  }

  /**
   * 从路由 query 同步筛选状态 (用于页面初始化)
   */
  function syncFromQuery(query) {
    if (query.year_gte) yearRange.value[0] = parseInt(query.year_gte)
    if (query.year_lte) yearRange.value[1] = parseInt(query.year_lte)
    if (query.team) selectedTeam.value = query.team
    if (query.tournament) selectedTournaments.value = [query.tournament]
    if (query.is_world_cup) isWorldCupOnly.value = query.is_world_cup === '1'
  }

  /**
   * 导出当前筛选为 API params 对象
   */
  function toApiParams() {
    const params = {}
    if (yearRange.value[0] !== MIN_YEAR) params.year_gte = yearRange.value[0]
    if (yearRange.value[1] !== MAX_YEAR) params.year_lte = yearRange.value[1]
    if (selectedTeam.value) params.team = selectedTeam.value
    if (isWorldCupOnly.value) params.is_world_cup = 1
    return params
  }

  return {
    yearRange, selectedCountries, selectedTournaments, selectedTeam,
    isWorldCupOnly, searchKeyword,
    hasActiveFilters, activeFilterCount,
    reset, setYearRange, syncFromQuery, toApiParams
  }
})
