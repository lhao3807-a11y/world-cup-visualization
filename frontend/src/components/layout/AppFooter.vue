<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-stats">
        <span>收录 {{ stats.total_matches?.toLocaleString() || '...' }} 场比赛</span>
        <span class="dot">·</span>
        <span>覆盖 {{ stats.total_years || '...' }} 年数据</span>
        <span class="dot">·</span>
        <span>{{ stats.total_countries || '...' }} 个国家/地区</span>
      </div>
      <div class="footer-text">
        <span>世界杯全量数据可视化平台 © 2026</span>
        <span class="dot">·</span>
        <span>数据来源: 1872年至今国际足球赛事记录</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const stats = ref({})

onMounted(async () => {
  try {
    const res = await client.get('/statistics/overview')
    stats.value = {
      total_matches: res.data.overview?.total_matches,
      total_years: new Date().getFullYear() - 1872,
      total_countries: res.data.overview?.total_countries
    }
  } catch (e) { /* silent */ }
})
</script>

<style scoped>
.app-footer {
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  padding: 20px 24px;
  margin-top: 40px;
}
.footer-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-muted);
  font-size: 13px;
  flex-wrap: wrap;
  gap: 8px;
}
.footer-stats { display: flex; gap: 8px; align-items: center; }
.footer-text { display: flex; gap: 8px; align-items: center; }
.dot { color: var(--border-active); }

@media (max-width: 768px) {
  .footer-inner { flex-direction: column; text-align: center; }
}
</style>
