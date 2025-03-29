<template>
  <div>
    <div class="profile" aria-label="用户资料">
      <img
        src="@/assets/icons/user.jpg"
        alt="用户头像"
        class="avatar"
        id="avatar" />
      <div class="user-info">
        <div class="username" id="username" aria-label="用户名称">不知名的大侠</div>
        <div class="user-account" id="user-account" aria-label="账号">账号: 获取失败</div>
      </div>
    </div>

    <div class="options" aria-label="用户选项">
      <RouterLink :to="{path:'/photoManage'}" class="option" aria-label="前往寻物画廊">🖼️ 寻物画廊</RouterLink>
      <RouterLink :to="{path:'/mine/settings'}" class="option" aria-label="进入设置">⚙️ 设置</RouterLink>
      <RouterLink :to="{path:'/mine/agreement'}" class="option" aria-label="用户须知">ℹ️ 用户须知</RouterLink>
      <RouterLink :to="{path:'/mine/contact'}" class="option" aria-label="联系我们">📧 联系我们</RouterLink>
      <RouterLink :to="{path:'/login'}" replace class="option logout" aria-label="退出登录">⚠️ 退出登录</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped lang="less">

.profile {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: #1e1e1e;
    border-bottom: 1px solid #333;
}

.avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-right: 20px;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.username {
    font-size: 18px;
    font-weight: bold;
}

.user-account {
    font-size: 14px;
    color: #aaa;
}

.options {
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    margin-top: 30px;
    font-size: large;
}

.option:first-child {
    border-top: 1px solid #333;
}

.option {
    background-color: #1e1e1e;
    color: #e0e0e0;
    padding: 25px 13px;
    text-decoration: none;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid #333;
}

.option:hover {
    background-color: #444;
}

.logout {
    background-color: #d32f2f;
    color: white;
    margin-top: 20px;
    border-top: 1px solid #333;
}

.logout:hover {
    background-color: #b71c1c;
}
</style>
