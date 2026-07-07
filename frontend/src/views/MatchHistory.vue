<template>
  <div class="match-history">
    <div class="page-header">
      <h2>📋 历史赛事库</h2>
      <p>浏览1872年至今所有国际足球比赛数据</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label>年份范围</label>
          <el-slider v-model="filters.yearRange" range :min="1872" :max="2026"
            :marks="{ 1872: '1872', 1930: '1930', 1950: '1950', 1970: '1970', 1990: '1990', 2010: '2010', 2026: '2026' }" />
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label>主队</label>
          <el-select v-model="filters.homeTeam" filterable clearable placeholder="选择队伍" :loading="!teamStore.loaded">
            <el-option v-for="t in teamStore.teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>客队</label>
          <el-select v-model="filters.awayTeam" filterable clearable placeholder="选择队伍">
            <el-option v-for="t in teamStore.teams" :key="t.original_name" :label="t.current_name" :value="t.current_name" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>赛事类型</label>
          <el-select v-model="filters.tournament" filterable clearable placeholder="选择赛事">
            <el-option v-for="t in tournaments" :key="t.name" :label="t.name" :value="t.name" />
          </el-select>
        </div>
        <div class="filter-item filter-actions">
          <el-button type="primary" @click="search">🔍 搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <el-table :data="matches" stripe v-loading="loading" max-height="600" @row-click="showDetail" style="cursor:pointer; width:100%">
        <el-table-column prop="date" label="日期" width="120" sortable />
        <el-table-column prop="home_team" label="主队" />
        <el-table-column label="比分" width="100" align="center">
          <template #default="{ row }">
            <span class="score-badge">{{ row.home_score }} - {{ row.away_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="away_team" label="客队" />
        <el-table-column prop="tournament" label="赛事" />
        <el-table-column prop="country" label="举办地" width="140" />
        <el-table-column label="结果" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.home_score > row.away_score" type="success" size="small">主胜</el-tag>
            <el-tag v-else-if="row.home_score < row.away_score" type="danger" size="small">客胜</el-tag>
            <el-tag v-else type="info" size="small">平局</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="pagination.page" :page-size="pagination.limit"
          :total="pagination.total" layout="total, prev, pager, next, jumper"
          @current-change="search" background />
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="比赛详情" width="500px">
      <div v-if="selectedMatch" class="match-detail">
        <div class="detail-teams">
          <div class="detail-team">
            <div class="team-flag" :style="{ background: teamStore.getTeamColor(selectedMatch.home_team_norm) }"></div>
            <div class="team-name">{{ selectedMatch.home_team }}</div>
          </div>
          <div class="detail-score">{{ selectedMatch.home_score }} - {{ selectedMatch.away_score }}</div>
          <div class="detail-team">
            <div class="team-flag" :style="{ background: teamStore.getTeamColor(selectedMatch.away_team_norm) }"></div>
            <div class="team-name">{{ selectedMatch.away_team }}</div>
          </div>
        </div>
        <el-descriptions :column="2" border class="detail-info">
          <el-descriptions-item label="日期">{{ selectedMatch.date }}</el-descriptions-item>
          <el-descriptions-item label="赛事">{{ selectedMatch.tournament }}</el-descriptions-item>
          <el-descriptions-item label="举办地">{{ selectedMatch.country }}</el-descriptions-item>
          <el-descriptions-item label="中立场地">{{ selectedMatch.neutral ? '是' : '否' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useTeamStore } from '../stores/teamStore'
import client from '../api/client'

const teamStore = useTeamStore()
const matches = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const selectedMatch = ref(null)
const tournaments = ref([])

const filters = reactive({
  yearRange: [1872, 2026],
  homeTeam: '',
  awayTeam: '',
  tournament: ''
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
    if (filters.tournament) params.tournament = filters.tournament

    const res = await client.get('/matches', { params })
    matches.value = res.data
    pagination.total = res.meta.total
  } catch (err) {
    console.error('Search error:', err)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.yearRange = [1872, 2026]
  filters.homeTeam = ''
  filters.awayTeam = ''
  filters.tournament = ''
  pagination.page = 1
  search()
}

function showDetail(row) {
  selectedMatch.value = row
  detailVisible.value = true
}

onMounted(async () => {
  await teamStore.fetchTeams()
  const res = await client.get('/tournaments')
  tournaments.value = res.data
  search()
})
</script>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 700; }
.page-header p { color: var(--text-secondary); margin-top: 4px; }

.filters-bar {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 20px; margin-bottom: 20px;
}
.filter-row {
  display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;
  margin-bottom: 12px;
}
.filter-row:last-child { margin-bottom: 0; }
.filter-item { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 6px; }
.filter-item label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.filter-actions { flex: 0 0 auto; flex-direction: row; align-items: flex-end; gap: 8px; }

.table-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;
}
.score-badge { font-weight: 700; color: var(--accent-primary); }
.pagination-wrap { padding: 16px; display: flex; justify-content: center; }

.match-detail { text-align: center; }
.detail-teams {
  display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 24px;
}
.detail-team { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.team-flag { width: 48px; height: 48px; border-radius: 50%; }
.team-name { font-weight: 600; font-size: 16px; }
.detail-score { font-size: 36px; font-weight: 800; }
.detail-info { margin-top: 16px; }

@media (max-width: 768px) {
  .filter-item { min-width: 100%; }
}
</style>
