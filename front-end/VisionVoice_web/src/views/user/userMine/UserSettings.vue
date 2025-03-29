<template>
  <HeaderBar return-path="/mine">设置</HeaderBar>
  <div class="settings-items">
    <!-- 复杂度选择 -->
    <div class="settings-item" aria-label="通话界面 环境描述复杂度设置">
      <label for="complexity">通话界面 环境描述复杂度</label>
      <select v-model="complexity" class="select-left">
        <option value="detailed">详细</option>
        <option value="simple">简洁</option>
      </select>
    </div>

    <!-- 语速选择 -->
    <div class="settings-item" aria-label="智能对话 语速设置">
      <label for="speed">智能对话 语速</label>
      <select v-model="speed" class="select-left">
        <option value="1">慢速</option>
        <option value="4">较慢</option>
        <option value="8">正常</option>
        <option value="12">较快</option>
        <option value="15">快速</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import { ref, onMounted, watch } from 'vue'

// 定义响应式变量
const complexity = ref('detailed')
const speed = ref('8') // 默认值

// 页面加载时初始化数据
onMounted(() => {
  // 初始化复杂度
  complexity.value = localStorage.getItem('complexity') || 'detailed'

  // 初始化速度
  speed.value = localStorage.getItem('speed') || '8'
})

// 监听复杂度变化并持久化
watch(complexity, (newVal) => {
  localStorage.setItem('complexity', newVal)
})

// 监听速度选项变化并持久化
watch(speed, (newVal) => {
  localStorage.setItem('speed', newVal.toString())
})
</script>

<style scoped>
.settings-items {
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  font-size: large;
}

.settings-item {
  display: flex;
  background-color: #1e1e1e;
  padding: 13px 13px;
  text-decoration: none;
  border-bottom: 1px solid #333;
  align-items: center;
}

.select-left {
  margin-left: auto;
  font-size: large;
  width: 120px;
  height: 50px;
}
</style>
