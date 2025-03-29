<template>
  <div class="header" role="banner" aria-label="页眉">
    <RouterLink :to="{path:returnPath}" class="back-button" aria-label="返回我的页面"
      >&#8592;</RouterLink
    >
    <slot>默认内容</slot>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
defineProps(['returnPath'])
</script>

<style scoped>
.header {
  width: 100vw;
  padding: 10px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  position: relative;
}

.back-button {
  text-decoration: none;
  position:absolute;
  left: 10px;
  top: 5px;
  color: #e0e0e0;
  font-size: 26px;
  cursor: pointer;
}
</style>
