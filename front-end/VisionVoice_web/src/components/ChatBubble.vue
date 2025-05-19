<template>
  <div class="chat-messages-user" v-if="chatItem.role === 'user'">
    <div class="chat-bubble-user">{{ chatItem.content }}</div>
    <div class="chat-image-user" aria-label="用户头像"></div>
  </div>
  <div class="chat-messages-bot" v-else-if="chatItem.role === 'assistant'">
    <div class="chat-image-bot psychological" v-if="agentType === 'PSYCHOLOGIST'" aria-label="智能体头像"></div>
    <div class="chat-image-bot default" v-if="agentType === 'LIFE_ASSISTANT'" aria-label="智能体头像"></div>
    <div class="chat-bubble-bot">{{ chatItem.content }}</div>
  </div>
</template>

<script setup lang="ts" name="ChatBubble">
defineProps(['chatItem', 'agentType'])


</script>

<style scoped lang="less">
.chat-messages-user {
  display: flex;
  flex-direction: row;
  position: relative;
  top: 5px;
  width: 100%;
  height: fit-content;
  justify-content: right;
}

.chat-messages-bot {
  display: flex;
  flex-direction: row;
  position: relative;
  top: 5px;
  width: 100%;
  height: fit-content;
  justify-content: left;
}

.chat-bubble-user {
  padding: 10px;
  margin: 10px 8px;
  margin-top: 0px;
  border-radius: 4px;
  max-width: calc(100% - 112px);
  word-wrap: break-word;
  font-size: 1.1rem;
  background-color: #3eb575;
  color: #fff;
  align-self: flex-end;
}

.chat-bubble-bot {
  padding: 10px;
  margin: 10px 8px;
  margin-top: 0px;
  border-radius: 4px;
  max-width: calc(100% - 112px);
  word-wrap: break-word;
  font-size: 1.1rem;
  background-color: #2c2c2c;
  color: #fff;
  align-self: flex-end;
}

.chat-image-user {
  background-image: url('@/assets/icons/user.jpg');
  width: 38px;
  height: 38px;
  background-size: cover;
  border-radius: 5px;
}

.chat-image-bot {
  background-image: url('@/assets/icons/bot.jpg');
  width: 38px;
  height: 38px;
  background-size: cover;
  border-radius: 5px;

  &.default {
    background-image: url('@/assets/icons/defaultAgent.jpg');
  }
  &.psychological {
    background-image: url('@/assets/icons/psychologicalAgent.jpg');
  }
}
</style>