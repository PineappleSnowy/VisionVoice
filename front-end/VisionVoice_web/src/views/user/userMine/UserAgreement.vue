<template>
  <HeaderBar return-path="/mine">用户须知</HeaderBar>
  <div v-html="content"></div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import { onMounted, ref } from 'vue'
import axios from 'axios'
let content = ref('页面正在加载中，请稍候')

onMounted(() => {
  axios.get('/api/userAgreement').then(
    (response) => {
      content.value = response.data
      console.log('[UserAgreement]Fetching Agreement Text:', response.data)
    },
    (error) => {
      console.error('[UserAgreement]Error Fetching Agreement Text:', error.message)
      content.value = '很抱歉，用户协议获取失败：'+ error.message
    }
  )
})
</script>

<style scoped></style>
