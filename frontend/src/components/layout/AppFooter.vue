<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span>收录 <strong>{{ stats.total_matches?.toLocaleString() || '...' }}</strong> 场世界杯正赛</span>
        <span class="dot">·</span>
        <span>覆盖 <strong>23</strong> 届世界杯</span>
        <span class="dot">·</span>
        <span><strong>{{ stats.host_countries || '...' }}</strong> 个参赛国家/地区</span>
      </div>
      <div class="footer-right">
        <span>世界杯数据可视化 © 2026</span>
        <span class="dot">·</span>
        <span>数据来源：1930年至今 FIFA 世界杯正赛记录</span>
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
      total_editions: res.data.overview?.total_editions,
      host_countries: res.data.overview?.host_countries
    }
  } catch (e) { /* 静默失败 */ }
})
</script>

<style scoped>
.app-footer {
  border-top: 1px solid transparent;
  border-image: linear-gradient(90deg, rgba(35,116,255,0.08), rgba(0,196,140,0.08)) 1;
  padding: 18px 24px;
  margin-top: 40px;
  opacity: 0.85;
}
.footer-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-muted);
  font-size: 12px;
  flex-wrap: wrap;
  gap: 10px;
}
.footer-left, .footer-right { display: flex; gap: 8px; align-items: center; }
.footer-left strong { color: var(--text-secondary); font-weight: 600; }
.dot { color: var(--brand-blue); opacity: 0.5; }

@media (max-width: 768px) {
  .footer-inner { flex-direction: column; text-align: center; gap: 6px; }
  .footer-left, .footer-right { justify-content: center; }
}
</style>
