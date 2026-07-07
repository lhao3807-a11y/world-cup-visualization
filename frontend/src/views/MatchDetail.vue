<template>
  <div class="match-detail-page">
    <div v-if="loading" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="match" class="detail-content">
      <el-button @click="$router.back()" circle class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>

      <div class="match-hero">
        <div class="hero-team">
          <div class="hero-color" :style="{ background: teamStore.getTeamColor(match.home_team_norm) }"></div>
          <h2>{{ match.home_team }}</h2>
        </div>
        <div class="hero-score">
          <span class="hs">{{ match.home_score }}</span>
          <span class="divider">-</span>
          <span class="hs">{{ match.away_score }}</span>
        </div>
        <div class="hero-team">
          <div class="hero-color" :style="{ background: teamStore.getTeamColor(match.away_team_norm) }"></div>
          <h2>{{ match.away_team }}</h2>
        </div>
      </div>

      <el-descriptions :column="2" border class="detail-desc">
        <el-descriptions-item label="日期">{{ match.date }}</el-descriptions-item>
        <el-descriptions-item label="赛事">{{ match.tournament }}</el-descriptions-item>
        <el-descriptions-item label="举办国家/地区">{{ match.country }}</el-descriptions-item>
        <el-descriptions-item label="中立场地">{{ match.neutral ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="比赛结果">
          <el-tag v-if="match.home_score > match.away_score" type="success">{{ match.home_team }} 获胜</el-tag>
          <el-tag v-else-if="match.home_score < match.away_score" type="danger">{{ match.away_team }} 获胜</el-tag>
          <el-tag v-else type="info">平局</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总进球">{{ match.home_score + match.away_score }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <el-empty v-else description="比赛未找到" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamStore } from '../stores/teamStore'
import client from '../api/client'

const route = useRoute()
const teamStore = useTeamStore()
const match = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await client.get(`/matches/${route.params.id}`)
    match.value = res.data
  } catch (err) {
    console.error('Match detail error:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.match-detail-page { max-width: 800px; margin: 0 auto; }
.loading-wrap { padding: 40px; }
.back-btn { margin-bottom: 20px; }

.match-hero {
  display: flex; align-items: center; justify-content: center; gap: 32px;
  padding: 40px 20px; margin-bottom: 24px;
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px;
}
.hero-team { text-align: center; }
.hero-color { width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; }
.hero-team h2 { font-size: 20px; font-weight: 700; }
.hero-score { display: flex; align-items: center; gap: 12px; }
.hs { font-size: 56px; font-weight: 800; }
.divider { font-size: 36px; color: var(--text-muted); }

.detail-desc { margin-top: 16px; }

@media (max-width: 640px) {
  .match-hero { gap: 16px; padding: 24px 12px; }
  .hs { font-size: 36px; }
  .hero-team h2 { font-size: 16px; }
  .hero-color { width: 40px; height: 40px; }
}
</style>
