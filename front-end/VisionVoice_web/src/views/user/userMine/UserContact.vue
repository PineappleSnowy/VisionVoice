<template>
  <HeaderBar return-path="/mine">联系我们</HeaderBar>
  <div
    id="contact-content"
    role="main"
    aria-label="联系我们内容"
    style="text-align: center; margin-top: 50px; font-size: 20px">
    <p>欢迎加入我们的用户微信群👏</p>
    <br />
    <img
      src="@/assets/pictures/qrcode.jpg"
      alt="用户群二维码"
      style="width: 300px; height: auto" /><br /><br />
    <p>邮箱：hdgong2766@qq.com</p>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
</script>

<style scoped></style>
