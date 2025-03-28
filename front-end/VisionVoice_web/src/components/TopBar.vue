<template>
  <div class="header" role="banner">{{ pageTitle }}</div>
</template>

<script setup lang="ts">
  // import { ref } from 'vue';
  defineProps(['pageTitle'])
</script>

<style scoped>
  .header {
    padding: 10px;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #e0e0e0;
}

</style>