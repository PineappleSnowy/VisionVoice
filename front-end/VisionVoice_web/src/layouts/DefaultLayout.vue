<template>
  <div>
    <RouterView></RouterView>
    <FooterBar></FooterBar>
  </div>
</template>

<script setup lang="ts">
import { RouterView} from "vue-router";
import FooterBar from '@/components/FooterBar.vue';
</script>

<style scoped>

</style>