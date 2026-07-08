<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-accent-bar"></span>
        <span class="logo-icon">🏆</span>
        <span class="logo-text">世界杯数据可视化</span>
        <span class="logo-badge">1930-至今</span>
      </router-link>

      <nav class="nav-links hide-mobile">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item">
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="header-right">
        <el-switch
          v-model="isDark"
          :active-icon="Moon"
          :inactive-icon="Sunny"
          inline-prompt
          @change="themeStore.toggle()"
          class="theme-switch"
          :style="{ '--el-switch-on-color': '#00C48C', '--el-switch-off-color': '#FF7D34' }"
        />

        <el-button class="show-mobile menu-btn" @click="drawer = true" text>
          <el-icon :size="22"><Menu /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <el-drawer v-model="drawer" direction="ltr" size="75%" :with-header="false">
      <div class="drawer-logo">
        <span class="logo-icon">🏆</span>
        <span class="logo-text">世界杯数据可视化</span>
      </div>
      <nav class="mobile-nav">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path"
          class="mobile-nav-item" @click="drawer = false">
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </el-drawer>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useThemeStore } from '../../stores/themeStore'
import { Moon, Sunny } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const drawer = ref(false)

const isDark = computed({
  get: () => themeStore.mode === 'dark',
  set: () => themeStore.toggle()
})

const navItems = [
  { path: '/', label: '总览', icon: 'DataAnalysis' },
  { path: '/live', label: '2026', icon: 'VideoCameraFilled' },
  { path: '/history', label: '比赛库', icon: 'Timer' },
  { path: '/timeline', label: '时间轴', icon: 'Clock' },
  { path: '/rankings', label: '排名', icon: 'Trophy' },
  { path: '/compare', label: '对比', icon: 'Switch' },
  { path: '/viz', label: '大屏', icon: 'Monitor' }
]
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  height: 60px;
  border-bottom: 1px solid transparent;
  border-image: linear-gradient(90deg, rgba(35,116,255,0.08), rgba(0,196,140,0.08)) 1;
}

.header-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;
}
.logo-accent-bar {
  width: 3px; height: 22px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--brand-cyan), var(--brand-blue));
  margin-right: 4px;
}
.logo-icon { font-size: 20px; }
.logo-text { letter-spacing: -0.3px; }
.logo-badge {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 400;
}

/* Nav */
.nav-links { display: flex; gap: 2px; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-icon { font-size: 14px; }
.nav-item:hover { color: var(--text-title); background: rgba(35, 116, 255, 0.1); }
.nav-item.router-link-active { color: #fff; background: var(--brand-blue); font-weight: 600; }

/* Right side */
.header-right { display: flex; align-items: center; gap: 14px; }
.theme-switch { margin-right: 2px; }
.menu-btn { color: var(--text-secondary); }

/* Drawer */
.drawer-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}
.mobile-nav { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; }
.mobile-nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; border-radius: 10px;
  color: var(--text-secondary); font-size: 15px; font-weight: 500;
  text-decoration: none; transition: all 0.15s;
}
.mobile-nav-item:hover,
.mobile-nav-item.router-link-active { background: rgba(35, 116, 255, 0.12); color: var(--brand-blue); }

@media (max-width: 768px) {
  .header-inner { padding: 0 14px; }
  .logo-text { font-size: 14px; }
  .logo-badge { display: none; }
}
</style>
