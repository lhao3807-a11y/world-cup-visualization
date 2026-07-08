<template>
  <div class="table-card card-block" @click="$emit('detail', 'recent')">
    <span class="detail-hint">ⓘ 详情</span>
    <div class="chart-header">
      <h3 class="module-title">
        <span class="title-icon">📅</span>近期世界杯比赛
      </h3>
      <span class="title-hint">最近 {{ limit }} 场</span>
    </div>

    <el-table
      :data="matches" max-height="460" style="width:100%"
      @row-click="(row) => $emit('rowClick', row)"
    >
      <el-table-column prop="date" label="日期" width="120" sortable>
        <template #default="{ row }">
          <span class="cell-date">{{ row.date }}</span>
        </template>
      </el-table-column>

      <el-table-column label="主队" min-width="140">
        <template #default="{ row }">
          <span class="cell-team" :class="{ 'team-strong': isStrongTeam(row.home_team_norm) }">{{ row.home_team }}</span>
        </template>
      </el-table-column>

      <el-table-column label="比分" width="100" align="center">
        <template #default="{ row }">
          <ScoreCell :homeScore="row.home_score" :awayScore="row.away_score" />
        </template>
      </el-table-column>

      <el-table-column label="客队" min-width="140">
        <template #default="{ row }">
          <span class="cell-team" :class="{ 'team-strong': isStrongTeam(row.away_team_norm) }">{{ row.away_team }}</span>
        </template>
      </el-table-column>

      <el-table-column label="举办国" width="130">
        <template #default="{ row }">
          <span class="cell-country">{{ row.country }}</span>
        </template>
      </el-table-column>

      <el-table-column label="年份" width="80" align="center">
        <template #default="{ row }">
          <span class="cell-year">{{ row.year }}</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-footer">
      <el-button text type="primary" size="small" @click.stop="$router.push('/history')">
        查看全部比赛 → 共 {{ totalMatches }} 场
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import client from '../../api/client'
import ScoreCell from '../common/ScoreCell.vue'

const props = defineProps({ limit: { type: Number, default: 20 } })
defineEmits(['detail', 'rowClick'])
const router = useRouter()

const matches = ref([])
const totalMatches = ref(0)

const strongTeams = new Set([
  'Brazil', 'Argentina', 'France', 'Germany', 'England',
  'Spain', 'Italy', 'Netherlands', 'Portugal', 'Uruguay'
])
function isStrongTeam(name) { return strongTeams.has(name) }

onMounted(async () => {
  const res = await client.get('/matches', {
    params: { limit: props.limit, sort: 'date', order: 'desc' }
  })
  matches.value = res.data
  totalMatches.value = res.meta.total
})
</script>

<style scoped>
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px; padding: 18px;
  position: relative; transition: all 0.25s ease; cursor: pointer;
}
.table-card::before {
  content: ''; position: absolute; inset: 0; border-radius: 12px; padding: 1px;
  background: linear-gradient(90deg, rgba(35,116,255,0.18), rgba(0,196,140,0.18));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none; opacity: 0.4; transition: opacity 0.25s;
}
.table-card:hover { transform: translateY(-2px); box-shadow: var(--glow-hover); }
.table-card:hover::before { opacity: 1; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.cell-date { color: var(--text-muted); font-size: 13px; }
.cell-team { font-size: 14px; color: var(--text-secondary); }
.cell-team.team-strong { color: var(--text-primary); font-weight: 600; }
.cell-country { color: var(--text-secondary); font-size: 13px; }
.cell-year { color: var(--brand-blue); font-weight: 600; font-size: 13px; font-variant-numeric: tabular-nums; }
.table-footer { text-align: center; padding: 10px 0 2px; }
</style>
