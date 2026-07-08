import js from '@eslint/js'
import vuePlugin from 'eslint-plugin-vue'

export default [
  // 基础 JS 推荐规则
  js.configs.recommended,

  // Vue 3 推荐规则
  ...vuePlugin.configs['flat/recommended'],

  // 项目自定义规则
  {
    files: ['**/*.{js,vue}'],
    rules: {
      // 关闭过于严格的规则
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error'
    }
  }
]
