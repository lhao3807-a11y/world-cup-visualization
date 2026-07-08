import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '世界杯数据总览', icon: 'DataAnalysis' }
  },
  {
    path: '/live',
    name: 'LiveMatches',
    component: () => import('../views/LiveMatches.vue'),
    meta: { title: '2026世界杯', icon: 'VideoCameraFilled' }
  },
  {
    path: '/history',
    name: 'MatchHistory',
    component: () => import('../views/MatchHistory.vue'),
    meta: { title: '世界杯比赛库', icon: 'Timer' }
  },
  {
    path: '/history/:id',
    name: 'MatchDetail',
    component: () => import('../views/MatchDetail.vue'),
    meta: { title: '比赛详情' }
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('../views/Timeline.vue'),
    meta: { title: '世界杯时间轴', icon: 'Clock' }
  },
  {
    path: '/rankings',
    name: 'TeamRankings',
    component: () => import('../views/TeamRankings.vue'),
    meta: { title: '世界杯队伍排名', icon: 'Trophy' }
  },
  {
    path: '/compare',
    name: 'TeamComparison',
    component: () => import('../views/TeamComparison.vue'),
    meta: { title: '世界杯队伍对比', icon: 'Switch' }
  },
  {
    path: '/viz',
    name: 'DataViz',
    component: () => import('../views/DataViz.vue'),
    meta: { title: '世界杯数据大屏', icon: 'Monitor' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} | 世界杯数据可视化`
    : '世界杯足球数据可视化'
})

export default router
