<template>
  <div class="table-card card-block" style="cursor:default;overflow:hidden;">
    <el-table
      :data="matches" v-loading="loading"
      max-height="620" style="width:100%;cursor:pointer;"
      @row-click="(row) => $emit('rowClick', row)"
    >
      <el-table-column prop="date" label="日期" width="120" sortable>
        <template #default="{ row }">
          <span style="color:var(--text-muted);font-size:13px;">{{ row.date }}</span>
        </template>
      </el-table-column>

      <el-table-column label="主队" min-width="140">
        <template #default="{ row }">
          <span :style="teamStyle(row.home_team_norm)">{{ row.home_team }}</span>
        </template>
      </el-table-column>

      <el-table-column label="比分" width="100" align="center">
        <template #default="{ row }">
          <ScoreCell :homeScore="row.home_score" :awayScore="row.away_score" />
        </template>
      </el-table-column>

      <el-table-column label="客队" min-width="140">
        <template #default="{ row }">
          <span :style="teamStyle(row.away_team_norm)">{{ row.away_team }}</span>
        </template>
      </el-table-column>

      <el-table-column label="举办国" width="140">
        <template #default="{ row }">
          <span style="color:var(--text-secondary);font-size:12px;">{{ row.country }}</span>
        </template>
      </el-table-column>

      <el-table-column label="年份" width="80" align="center" sortable>
        <template #default="{ row }">
          <span style="color:var(--brand-blue);font-weight:600;font-size:13px;font-variant-numeric:tabular-nums;">{{ row.year }}</span>
        </template>
      </el-table-column>

      <el-table-column label="结果" width="80" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.home_score > row.away_score" effect="dark" color="#00C48C" size="small">主胜</el-tag>
          <el-tag v-else-if="row.home_score < row.away_score" effect="dark" color="#2374FF" size="small">客胜</el-tag>
          <el-tag v-else effect="dark" color="#9966FF" size="small">平局</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        :current-page="currentPage" :page-size="pageSize" :total="total"
        layout="total, prev, pager, next, jumper"
        @current-change="(p) => $emit('pageChange', p)"
        background
      />
    </div>
  </div>
</template>

<script setup>
import ScoreCell from '../common/ScoreCell.vue'

defineProps({
  matches: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 30 },
  total: { type: Number, default: 0 }
})

defineEmits(['rowClick', 'pageChange'])

const strongTeams = new Set([
  'Brazil', 'Argentina', 'France', 'Germany', 'England',
  'Spain', 'Italy', 'Netherlands', 'Portugal', 'Uruguay'
])

function teamStyle(name) {
  return {
    color: strongTeams.has(name) ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: strongTeams.has(name) ? 600 : 400
  }
}
</script>

<style scoped>
.table-card { overflow: hidden; }
.pagination-wrap { padding: 16px; display: flex; justify-content: center; }
</style>
