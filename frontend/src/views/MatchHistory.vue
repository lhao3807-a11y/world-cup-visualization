<template>
  <div class="match-history">
    <div class="page-header">
      <h2>📋 世界杯比赛库</h2>
      <p>浏览1930年至今所有世界杯正赛数据</p>
    </div>

    <MatchFilters
      :filters="filters"
      :teams="teamStore.teams"
      :teamsLoaded="teamStore.loaded"
      @search="search"
      @reset="resetFilters"
    />

    <MatchTable
      :matches="matches"
      :loading="loading"
      :currentPage="pagination.page"
      :pageSize="pagination.limit"
      :total="pagination.total"
      @rowClick="showDetail"
      @pageChange="(p) => { pagination.page = p; search() }"
    />

    <!-- 比赛详情弹窗 -->
    <el-dialog v-model="detailVisible" title="世界杯比赛详情" width="520px">
      <div v-if="selectedMatch" class="match-detail">
        <div class="detail-teams">
          <div class="detail-team">
            <div class="team-color" :style="{ background: teamStore.getTeamColor(selectedMatch.home_team_norm) }"></div>
            <div class="team-name">{{ selectedMatch.home_team }}</div>
          </div>
          <div class="detail-score">{{ selectedMatch.home_score }} - {{ selectedMatch.away_score }}</div>
          <div class="detail-team">
            <div class="team-color" :style="{ background: teamStore.getTeamColor(selectedMatch.away_team_norm) }"></div>
            <div class="team-name">{{ selectedMatch.away_team }}</div>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日期">{{ selectedMatch.date }}</el-descriptions-item>
          <el-descriptions-item label="举办国">{{ selectedMatch.country }}</el-descriptions-item>
          <el-descriptions-item label="中立场地">{{ selectedMatch.neutral ? '是' : '否' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useTeamStore } from '../stores/teamStore'
import client from '../api/client'
import MatchFilters from '../components/history/MatchFilters.vue'
import MatchTable from '../components/history/MatchTable.vue'

const teamStore = useTeamStore()
const matches = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const selectedMatch = ref(null)

const filters = reactive({
  yearRange: [1930, 2026], homeTeam: '', awayTeam: ''
})
const pagination = reactive({ page: 1, limit: 30, total: 0 })

async function search() {
  loading.value = true
  try {
    const params = {
      page: pagination.page, limit: pagination.limit,
      year_gte: filters.yearRange[0], year_lte: filters.yearRange[1]
    }
    if (filters.homeTeam) params.home_team = filters.homeTeam
    if (filters.awayTeam) params.away_team = filters.awayTeam

    const res = await client.get('/matches', { params })
    matches.value = res.data
    pagination.total = res.meta.total
  } finally { loading.value = false }
}

function resetFilters() {
  filters.yearRange = [1930, 2026]
  filters.homeTeam = ''; filters.awayTeam = ''
  pagination.page = 1; search()
}

function showDetail(row) {
  selectedMatch.value = row; detailVisible.value = true
}

onMounted(async () => {
  await teamStore.fetchTeams()
  search()
})
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; color: var(--text-title); }
.page-header p { color: var(--text-secondary); margin-top: 4px; font-size: 14px; }

.match-detail { text-align: center; }
.detail-teams { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 24px; }
.detail-team { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.team-color { width: 48px; height: 48px; border-radius: 50%; }
.team-name { font-weight: 600; font-size: 16px; color: var(--text-primary); }
.detail-score { font-size: 36px; font-weight: 800; color: var(--text-primary); }
</style>
