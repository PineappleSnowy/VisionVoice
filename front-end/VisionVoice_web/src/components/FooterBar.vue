<template>
  <div id="navbar" role="navigation">
        <RouterLink :to="{path: '/agent'}" replace active-class="active" aria-label="首页">
            <span>首页</span>
        </RouterLink>
        <RouterLink :to="{path: '/chat'}" replace active-class="active" aria-label="消息">
            <span>消息</span>
        </RouterLink>
        <RouterLink :to="{path: '/album'}" replace active-class="active" aria-label="有声相册">
            <span>相册</span>
        </RouterLink>
        <RouterLink :to="{path: '/skills'}" replace active-class="active" aria-label="能力">
            <span>能力</span>
        </RouterLink>
        <RouterLink :to="{path: '/mine'}" replace active-class="active" aria-label="我的">
            <span>我的</span>
        </RouterLink>
    </div>
</template>

<script setup lang="ts">
import {RouterLink} from 'vue-router'
</script>

<style scoped lang="less">
// 定义全局变量
@primary-bg: #1e1e1e;
@text-color: #fff;
@transition-time: 0.3s;
@mobile-breakpoint: 500px;
@icon-path: '../assets/icons/';
@icon-size: 10px;

#navbar {
  background-color: @primary-bg;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 50px;
  padding: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: @text-color;
  border-top: 1px solid #333;

  

  a {
    text-decoration: none;
    color: inherit;
    margin: 0 2px;
    padding: 10px;
    border-radius: 5px;
    transition: background-color @transition-time ease;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    width: 25%;


    &:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }

    img {
      width: 35px;
      height: 35px;
      margin-right: 0;
    }
    
    &.active {
    font-weight: bold;
    }
  }

  // 媒体查询
  @media screen and (max-width: @mobile-breakpoint) {
    a {
      span {
        display: none;
      }
      background-repeat: no-repeat;
      content: '';
      width: @icon-size;
      height: @icon-size;
      background-size: contain;
      background-position: center;
        
      
      // 图标路径
      &[href="/agent"] { background-image: url('@{icon-path}home.png'); }
      &[href="/chat"] { background-image: url('@{icon-path}chat.png'); }
      &[href="/album"] { background-image: url('@{icon-path}album.png'); }
      &[href="/skills"] { background-image: url('@{icon-path}skills.png'); }
      &[href="/mine"] { background-image: url('@{icon-path}mine.png'); }
    }
  }
}
</style>