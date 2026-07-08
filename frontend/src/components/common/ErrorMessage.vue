<!--
  ErrorMessage.vue — 全局错误状态展示组件
  Props:
    message    — 错误描述文案
    showRetry  — 是否显示"重试"按钮
    size       — 'large' | 'small'
  Events:
    @retry     — 点击重试时触发
-->
<template>
  <div class="error-state" :class="size">
    <span class="error-icon">⚠️</span>
    <p class="error-text">{{ message }}</p>
    <el-button v-if="showRetry" size="small" @click="$emit('retry')" type="primary" plain>
      重试
    </el-button>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '数据加载失败，请稍后再试' },
  showRetry: { type: Boolean, default: false },
  size: { type: String, default: 'large' }
})

defineEmits(['retry'])
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  text-align: center;
}
.error-state.large { padding: 60px 20px; }
.error-state.small { padding: 20px 12px; }
.error-icon { font-size: 36px; opacity: 0.6; }
.error-text { color: var(--text-muted); font-size: 14px; max-width: 320px; }
</style>
