<template>
  <div>
    <HeaderBar :show-button="false">能力</HeaderBar>
    <div class="button-container">
      <button class="func_button" @click="router.replace('/agent')">🤖 智能体交互</button>
      <button class="func_button" @click="handler('/phone?avoidObstacle=true')">🚧 辅助避障</button>
      <button class="func_button" @click="handler('/phone?findItem=true')">🔍 帮我寻物</button>
      <button class="func_button" @click="handler('/phone?envDescription=true')">🌳 环境描述</button>
      <button class="func_button" @click="handler('/phone?currentLocation=true')">📍 获取位置</button>
      <button class="func_button" @click="router.replace('/album')">🖼️ 有声相册</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import { useRouter } from 'vue-router'
const router = useRouter()
function handler(location: string): void {
  localStorage.setItem('selectedAgent', 'defaultAgent')
  router.replace(location)
}
</script>

<style scoped>
.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.func_button:first-child {
  border-top: 1px solid #333;
}

.func_button {
  width: 100vw;
  padding: 30px;
  margin: 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1e1e1e;
  color: #e0e0e0;
  font-size: 1.2em;
  border: none;
  border-bottom: 1px solid #333;
  cursor: pointer;
}

.func_button:hover {
  background-color: #333;
}
</style>
