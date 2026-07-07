import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '首页总览', icon: 'DataAnalysis' }
  },
  {
    path: '/history',
    name: 'MatchHistory',
    component: () => import('../views/MatchHistory.vue'),
    meta: { title: '历史赛事库', icon: 'Timer' }
  },
  {
    path: '/history/:id',
    name: 'MatchDetail',
    component: () => import('../views/MatchDetail.vue'),
    meta: { title: '比赛详情' }
  },
  {
    path: '/live',
    name: 'LiveMatches',
    component: () => import('../views/LiveMatches.vue'),
    meta: { title: '实时赛事', icon: 'VideoCameraFilled' }
  },
  {
    path: '/viz',
    name: 'DataViz',
    component: () => import('../views/DataViz.vue'),
    meta: { title: '可视化大屏', icon: 'Monitor' }
  },
  {
    path: '/rankings',
    name: 'TeamRankings',
    component: () => import('../views/TeamRankings.vue'),
    meta: { title: '队伍排名', icon: 'Trophy' }
  },
  {
    path: '/compare',
    name: 'TeamComparison',
    component: () => import('../views/TeamComparison.vue'),
    meta: { title: '数据对比', icon: 'Switch' }
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('../views/Timeline.vue'),
    meta: { title: '时间轴', icon: 'Clock' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | 世界杯数据可视化` : '世界杯足球数据可视化'
})

export default router
