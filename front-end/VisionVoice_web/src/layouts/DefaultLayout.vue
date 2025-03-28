<template>
  <div>
    <TopBar :pageTitle="pageTitle"></TopBar>
    <RouterView></RouterView>
    <FooterBar></FooterBar>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView ,useRoute} from "vue-router";
import TopBar from '@/components/TopBar.vue';
import FooterBar from '@/components/FooterBar.vue';
const route = useRoute()
let pageTitle = computed(() => route.meta.title || '默认标题')
</script>

<style scoped>

</style>