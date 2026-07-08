<template>
  <div class="match-detail-page">
    <div v-if="loading" style="padding:40px;">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="match" class="detail-content">
      <el-button @click="$router.back()" circle style="margin-bottom:20px;">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>

      <!-- 比分英雄区 -->
      <div class="match-hero card-block" style="cursor:default;">
        <div class="hero-team">
          <div class="hero-color" :style="{ background: teamStore.getTeamColor(match.home_team_norm) }"></div>
          <h2>{{ match.home_team }}</h2>
        </div>
        <div class="hero-score">
          <span class="hs" :style="{ color: match.home_score > match.away_score ? 'var(--brand-cyan)' : 'var(--text-primary)' }">
            {{ match.home_score }}
          </span>
          <span class="divider">-</span>
          <span class="hs" :style="{ color: match.away_score > match.home_score ? 'var(--brand-cyan)' : 'var(--text-primary)' }">
            {{ match.away_score }}
          </span>
        </div>
        <div class="hero-team">
          <div class="hero-color" :style="{ background: teamStore.getTeamColor(match.away_team_norm) }"></div>
          <h2>{{ match.away_team }}</h2>
        </div>
      </div>

      <!-- 比赛信息 -->
      <div class="card-block" style="margin-top:20px;cursor:default;">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日期">{{ match.date }}</el-descriptions-item>
          <el-descriptions-item label="届次">{{ match.year }} 世界杯</el-descriptions-item>
          <el-descriptions-item label="举办国">{{ match.country }}</el-descriptions-item>
          <el-descriptions-item label="中立场地">{{ match.neutral ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="比赛结果">
            <el-tag v-if="match.home_score > match.away_score" effect="dark" color="#00C48C">{{ match.home_team }} 获胜</el-tag>
            <el-tag v-else-if="match.home_score < match.away_score" effect="dark" color="#2374FF">{{ match.away_team }} 获胜</el-tag>
            <el-tag v-else effect="dark" color="#9966FF">平局</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总进球">{{ match.home_score + match.away_score }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <div v-else class="card-block" style="text-align:center;padding:60px;cursor:default;">
      <span style="font-size:48px;opacity:0.3;">⚽</span>
      <p style="color:var(--text-muted);margin-top:12px;">比赛未找到</p>
    </div>
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
  } finally { loading.value = false }
})
</script>

<style scoped>
.match-detail-page { max-width: 800px; margin: 0 auto; }
.match-hero { display: flex; align-items: center; justify-content: center; gap: 36px; padding: 40px 20px; }
.hero-team { text-align: center; }
.hero-color { width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; }
.hero-team h2 { font-size: 20px; font-weight: 700; color: var(--text-title); }
.hero-score { display: flex; align-items: center; gap: 14px; }
.hs { font-size: 56px; font-weight: 800; }
.divider { font-size: 36px; color: var(--text-muted); font-weight: 400; }

@media (max-width: 640px) {
  .match-hero { gap: 18px; padding: 24px 12px; }
  .hs { font-size: 36px; }
  .hero-team h2 { font-size: 16px; }
  .hero-color { width: 40px; height: 40px; }
}
</style>
