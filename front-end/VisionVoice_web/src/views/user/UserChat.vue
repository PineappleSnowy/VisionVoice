<template>
  <HeaderBar :show-button="false">消息</HeaderBar>
  <div class="message-list" role="list">
    <div
      class="message-item"
      data-agent="defaultAgent"
      @click="handler('defaultAgent')"
      role="listitem"
      aria-label="生活助手"
    >
      <img
        src="@/assets/icons/defaultAgent.jpg"
        alt="生活助手头像"
        class="avatar"
      />
      <div class="content">
        <div class="name" aria-label="生活助手">生活助手</div>
        <div class="description" aria-label="环境识别、帮我寻物、辅助避障">
          环境识别、帮我寻物、辅助避障
        </div>
      </div>
      <div class="buttons">
        <button
          class="button phone"
          @click.stop="handler('defaultAgent',false)"
          aria-label="电话联系生活助手"
        ></button>
        <button
          class="button video"
          @click.stop="handler('defaultAgent',true)"
          aria-label="视频联系生活助手"
        ></button>
      </div>
    </div>
    <div
      class="message-item"
      data-agent="psychologicalAgent"
      @click="handler('psychologicalAgent')"
      role="listitem"
      aria-label="心灵树洞"
    >
      <img
        src="@/assets/icons/psychologicalAgent.jpg"
        alt="心灵树洞头像"
        class="avatar"
      />
      <div class="content">
        <div class="name" aria-label="心灵树洞">心灵树洞</div>
        <div class="description" aria-label="今天心情怎么样啊？">
          今天心情怎么样啊？
        </div>
      </div>
      <div class="buttons">
        <button
          class="button phone"
          @click.stop="handler('psychologicalAgent',false)"
          aria-label="电话联系心灵树洞"
        ></button>
        <button
          class="button video"
          @click.stop="handler('psychologicalAgent',true)"
          aria-label="视频联系心灵树洞"
        ></button>
      </div>
    </div>
    <!-- 可以继续添加更多消息项 -->
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter()
let selectedAgent
onMounted(() => {
  selectedAgent = localStorage.getItem('selectedAgent') || 'defaultAgent'; // 从本地存储中获取选择的智能体
})
function handler(agentName:string,isCameraOn?:boolean):void{
  selectedAgent = agentName
  localStorage.setItem('selectedAgent', selectedAgent); // 将选择的智能体存储到本地存储
  isCameraOn?router.replace('/phone'):router.replace('/phone?camera=on')
}
</script>

<style scoped>
.message-list {
  width: 100%;
  background-color: #1e1e1e;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.message-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  /* 添加鼠标指针样式 */
  transition: background-color 0.3s ease;
  /* 添加过渡效果 */
}

.message-item:first-child {
  border-top: 1px solid #333;
}

.message-item:hover {
  background-color: #333;
  /* 鼠标悬停时的背景颜色 */
}

.message-item:active {
  background-color: #555;
  /* 被点击时的背景颜色 */
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 10px;
}

.content {
  flex: 1;
}

.name {
  font-size: 16px;
  font-weight: bold;
}

.description {
  font-size: 12px;
  color: #b0b0b0;
}

.buttons {
  display: flex;
  gap: 5px;
}

.button {
  width: 60px;
  height: 60px;
  border: 2px solid #ffffff;
  border-radius: 10px;
  background-color: #2c2c2c;
  background-size: 30px 30px;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
}

.button.phone {
  background-image: url('@/assets/icons/phone.png');
}

.button.video {
  background-image: url('@/assets/icons/video.png');
}

.button:hover {
  background-color: #1a1a1a;
}

</style>
