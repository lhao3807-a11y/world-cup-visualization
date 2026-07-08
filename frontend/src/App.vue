<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/themeStore'
import { useTeamStore } from './stores/teamStore'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'

const themeStore = useThemeStore()
const teamStore = useTeamStore()

onMounted(() => {
  themeStore.init()
  teamStore.fetchTeams()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding-top: 80px;
}

@media (max-width: 768px) {
  .main-content { padding: 16px; padding-top: 70px; }
}
</style>
