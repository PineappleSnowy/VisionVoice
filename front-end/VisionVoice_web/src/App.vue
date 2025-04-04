<template>
  <RouterView></RouterView>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<style lang="less">
@bg-color: #121212;
@font-color: #e0e0e0;

body {
  margin: 0;
  padding: 0;
  background-color: @bg-color;
  font-family: Arial, sans-serif;
  color: @font-color;
}
#app {
  height: 100vh;
  width: 100vw;
}
</style>