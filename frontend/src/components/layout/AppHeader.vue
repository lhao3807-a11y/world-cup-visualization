<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">⚽</span>
        <span class="logo-text">World Cup Viz</span>
        <span class="logo-badge">1872-至今</span>
      </router-link>

      <nav class="nav-links hide-mobile">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item">
          <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="header-right">
        <el-badge :is-dot="liveStore.isLiveSeason" class="live-dot">
          <router-link to="/live" class="live-btn">
            <el-icon><VideoCameraFilled /></el-icon>
            <span class="hide-mobile">实时</span>
          </router-link>
        </el-badge>

        <el-switch
          v-model="isDark"
          :active-icon="Moon"
          :inactive-icon="Sunny"
          inline-prompt
          @change="themeStore.toggle()"
          class="theme-switch"
        />

        <el-button class="show-mobile menu-btn" @click="drawer = true" circle>
          <el-icon><Menu /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <el-drawer v-model="drawer" direction="ltr" size="75%" :with-header="false">
      <nav class="mobile-nav">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path"
          class="mobile-nav-item" @click="drawer = false">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </el-drawer>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useThemeStore } from '../../stores/themeStore'
import { useLiveStore } from '../../stores/liveStore'
import { Moon, Sunny } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const liveStore = useLiveStore()
const drawer = ref(false)

const isDark = computed({
  get: () => themeStore.mode === 'dark',
  set: () => themeStore.toggle()
})

const navItems = [
  { path: '/', label: '首页总览', icon: 'DataAnalysis' },
  { path: '/history', label: '历史赛事', icon: 'Timer' },
  { path: '/timeline', label: '时间轴', icon: 'Clock' },
  { path: '/rankings', label: '排名', icon: 'Trophy' },
  { path: '/compare', label: '对比', icon: 'Switch' },
  { path: '/viz', label: '大屏', icon: 'Monitor' },
  { path: '/live', label: '实时', icon: 'VideoCameraFilled' },
]
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(16px);
  height: 60px;
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

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 18px;
}
.logo-icon { font-size: 24px; }
.logo-badge {
  font-size: 11px;
  background: var(--accent-primary);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.nav-links {
  display: flex;
  gap: 4px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.2s;
}
.nav-item:hover, .nav-item.router-link-active {
  color: var(--accent-primary);
  background: rgba(64, 158, 255, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.live-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-secondary);
  font-size: 14px;
}
.theme-switch {
  --el-switch-on-color: #409EFF;
  --el-switch-off-color: #e6a23c;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
}
.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 16px;
}
.mobile-nav-item:hover, .mobile-nav-item.router-link-active {
  background: rgba(64, 158, 255, 0.1);
  color: var(--accent-primary);
}

@media (max-width: 768px) {
  .header-inner { padding: 0 16px; }
  .logo-text { display: none; }
}
</style>
