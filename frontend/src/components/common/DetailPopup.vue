<template>
  <teleport to="body">
    <transition name="popup-fade">
      <div v-if="visible" class="popup-overlay" @click.self="close">
        <transition name="popup-scale">
          <div v-if="visible" class="popup-panel" :style="{ maxWidth: maxWidth }">
            <!-- Header -->
            <div class="popup-header">
              <div class="popup-title">
                <span class="popup-icon" :style="{ color: iconColor }">{{ icon }}</span>
                <span>{{ title }}</span>
              </div>
              <div class="popup-actions">
                <el-button text circle size="small" @click="close" class="close-btn">
                  <el-icon :size="18"><Close /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="popup-loading">
              <el-icon class="is-loading" :size="32" :color="iconColor"><Loading /></el-icon>
              <p>加载中...</p>
            </div>

            <!-- Content -->
            <div v-else-if="!isEmpty" class="popup-body">
              <!-- Summary -->
              <div v-if="summary" class="popup-summary">
                <div v-for="s in summary" :key="s.label" class="summary-item">
                  <div class="summary-value" :style="{ color: s.color || 'var(--text-primary)' }">{{ s.value }}</div>
                  <div class="summary-label">{{ s.label }}</div>
                </div>
              </div>
              <!-- Slot content -->
              <slot />
            </div>

            <!-- Empty -->
            <div v-else class="popup-empty">
              <span class="empty-icon">⚽</span>
              <p>{{ emptyText }}</p>
            </div>

            <!-- Footer actions -->
            <div v-if="!loading && showFooter" class="popup-footer">
              <slot name="footer" />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { Close, Loading } from '@element-plus/icons-vue'
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '详情' },
  icon: { type: String, default: '📊' },
  iconColor: { type: String, default: 'var(--brand-blue)' },
  maxWidth: { type: String, default: '720px' },
  loading: { type: Boolean, default: false },
  isEmpty: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无细分详情数据' },
  summary: { type: Array, default: null },
  showFooter: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.visible) close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.popup-panel {
  background: var(--bg-card);
  border-radius: 14px;
  border: 1px solid transparent;
  position: relative;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.popup-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 1px;
  background: var(--border-popup-gradient);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.popup-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-title);
}
.popup-icon { font-size: 20px; }
.close-btn {
  color: var(--text-muted);
  transition: color 0.2s;
}
.close-btn:hover { color: var(--accent-danger); }

.popup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
  gap: 12px;
}

.popup-body {
  overflow-y: auto;
  padding: 20px;
  flex: 1;
}

.popup-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.summary-item {
  flex: 1;
  min-width: 100px;
  text-align: center;
  background: var(--bg-card-alt);
  border-radius: 10px;
  padding: 14px 12px;
}
.summary-value { font-size: 24px; font-weight: 700; }
.summary-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.popup-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--text-muted);
  gap: 12px;
}
.empty-icon { font-size: 48px; opacity: 0.4; }

.popup-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* Transitions */
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.25s ease;
}
.popup-fade-enter-from,
.popup-fade-leave-to { opacity: 0; }

.popup-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.popup-scale-leave-active {
  transition: all 0.2s ease;
}
.popup-scale-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(16px);
}
.popup-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
