<template>
  <div class="container">
    <HeaderBar return-path="/album">图片问答</HeaderBar>
    <button class="delete" aria-label="删除该图片"></button>

    <div class="content">
      <img src="" alt="">
      <div class="chatContainer">
        <!-- <ChatBubble></ChatBubble> -->
        1111111111111
      </div>
    </div>
    <div class="inputContainer" role="form">
      <textarea placeholder="输入消息..." aria-label="输入消息"></textarea>
      <button aria-label="发送消息">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserPhotoChat">

import ChatBubble from '@/components/ChatBubble.vue'
import HeaderBar from '@/components/HeaderBar.vue'
</script>

<style scoped lang="less">
.container {

  display: flex;
  flex-direction: column;
  position: relative;
  height: calc(100vh - 50px);
  width: 100vw;
  position: relative;

  .delete {
    display: flex;
    position: fixed;
    right: 5px;
    top: 5px;
    border: none;
    height: 40px;
    width: 40px;
    background-image: url('@/assets/icons/delete.png');
    background-size: 100%;
    background-repeat: no-repeat;
    background-position: center;
    background-color: transparent;
  }


  .content {

    width: 100vw;
    height: calc(100vh - 150px);
    overflow: auto;
    scrollbar-width: none;

    img {
      display: block;
      margin: 10px auto;
      width: 360px;
    }
  }


  .inputContainer {
    position: absolute;
    bottom: 0;
    width: 100vw;
    height: 46px;
    display: flex;
    align-items: center;
    border: 0;
    padding: 1px 0px;
    background-color: #2c2c2c;
    border-top: 1px solid #555;
    border-bottom: 1px solid #333;

    textarea {
      display: flex;
      align-items: center;
      overflow-y: auto;
      resize: none;
      width: auto;
      height: 40px;
      position: absolute;
      right: 5.6rem;
      left: 0.3rem;
      background-color: rgba(0, 0, 0, 0.8);
      color: #ffffff;
      border-radius: 10px;
      padding: 5px 0.5rem 5px 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.1s ease;
      box-sizing: border-box;
      font-size: 16px;
      line-height: 28px;

      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
      }
    }

    button {
      position: absolute;
      right: 0.3rem;
      width: 5rem;
      height: 40px;
      border-radius: 10px;
      border: none;
      font-size: large;
      background-color: #3eb575;
      color: white;
      cursor: pointer;
      text-align: center;
      display: block;
    }


  }
}
</style>