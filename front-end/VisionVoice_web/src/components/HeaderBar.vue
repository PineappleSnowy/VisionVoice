<template>
  <div class="header" role="banner" aria-label="页眉">
    <RouterLink
      :to="{ path: returnPath }"
      replace
      class="back-button"
      aria-label="返回按钮"
      v-show="showButton ?? true"
      >&#8592;</RouterLink
    >
    <slot>默认内容</slot>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
defineProps(['returnPath', 'showButton'])
</script>

<style scoped>
.header {
  box-sizing: border-box;
  width: 100vw;
  padding: 10px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  position: relative;
  height: 50px;
  background-color: #1e1e1e;
}

.back-button {
  text-decoration: none;
  position: absolute;
  left: 10px;
  top: 5px;
  color: #e0e0e0;
  font-size: 26px;
  cursor: pointer;
}
</style>
