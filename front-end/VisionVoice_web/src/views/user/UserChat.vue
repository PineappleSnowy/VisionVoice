<template>
  <div class="container">
    <div class="agent-view" v-show="view === 'agent'">
      <HeaderBar :show-button="false" aria-label="智能体列表">智能体列表</HeaderBar>
      <div class="agent-list" role="list">

        <div class="agent-item" @click="chatHistoryHandler('lifeAssistant')" role="listitem" aria-label="生活助手">
          <img src="@/assets/icons/defaultAgent.jpg" alt="生活助手头像" class="avatar" />
          <div class="content">
            <div class="name" aria-label="生活助手">生活助手</div>
            <div class="description" aria-label="环境识别、帮我寻物、辅助避障">
              环境识别、帮我寻物、辅助避障
            </div>
          </div>
          <div class="controls">
            <button @click.stop="agentHandler('defaultAgent', false)" aria-label="电话联系生活助手">
              <i class="fa-solid fa-phone"></i>
            </button>
            <button @click.stop="agentHandler('defaultAgent', true)" aria-label="视频联系生活助手">
              <i class="fa-solid fa-video"></i>
            </button>
          </div>
        </div>

        <div class="agent-item" @click="chatHistoryHandler('psychologist')" role="listitem" aria-label="心灵树洞">
          <img src="@/assets/icons/psychologicalAgent.jpg" alt="心灵树洞头像" class="avatar" />
          <div class="content">
            <div class="name" aria-label="心灵树洞">心灵树洞</div>
            <div class="description" aria-label="今天心情怎么样啊？">
              今天心情怎么样啊？
            </div>
          </div>
          <div class="controls">
            <button @click.stop="agentHandler('psychologicalAgent', false)" aria-label="电话联系心灵树洞">
              <i class="fa-solid fa-phone"></i>
            </button>
            <button @click.stop="agentHandler('psychologicalAgent', true)" aria-label="视频联系心灵树洞">
              <i class="fa-solid fa-video"></i>
            </button>
          </div>
        </div>
        <!-- 可以继续添加更多智能体 -->

      </div>
    </div>

    <div class="chat-history-view" v-show="view === 'chatHistory'">
      <HeaderBar :show-button="false">聊天记录列表</HeaderBar>
      <button class="nav"><i class="fa-solid fa-arrow-left" @click="view = 'agent'"></i></button>

      <div class="chat-history-list" role="list">

        <div class="chat-history-item" role="listitem" aria-label="聊天记录列表项" v-for="item in chatHistoryList" :key="item.session_id">
          <div class="content">
            <!-- <div class="detail" aria-label="聊天记录内容">{{item.content[-1].content.slice(0,20)}}</div> -->
            <div class="detail" aria-label="聊天记录内容">{{item.content[item.content.length-1].content.slice(0,18)+'...'}}</div>
            <div class="time" aria-label="时间">{{ dateFormatter(new Date(item.content[item.content.length-1].timestamp)) }}</div>
          </div>
          <div class="controls">
            <button aria-label="选择该会话" @click="router.replace('/agent')"><i class="fa-solid fa-arrow-right-to-bracket"></i></button>
            <button aria-label="删除该对话" @click="deleteChatHistory(item.session_id)"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <!-- 可以继续添加更多消息 -->

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/libs/axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const view = ref<'agent' | 'chatHistory'>('agent')
const username = localStorage.getItem('username')

const chatHistoryList:any = ref([])



let selectedAgent :string

onMounted(() => {
  selectedAgent = localStorage.getItem('selectedAgent') || 'defaultAgent'; // 从本地存储中获取选择的智能体
})


function agentHandler(agentName: string, isCameraOn?: boolean): void {
  selectedAgent = agentName
  localStorage.setItem('selectedAgent', selectedAgent); // 将选择的智能体存储到本地存储
  isCameraOn ? router.replace('/phone') : router.replace('/phone?camera=on')
}


async function chatHistoryHandler(agentType:string) {
  view.value = 'chatHistory'
  chatHistoryList.value = []
  const history = await getChatHistory()
  history.forEach((item:any) => {
    console.log('AAAAA',item)
    if(item.agent_type === agentType) {
      chatHistoryList.value.push(item)
    }
  })
}

function dateFormatter(date:Date){
  return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}



// #region 聊天记录CRUD

async function getChatHistory(): Promise<any> {
  try {
    const response = await axios.get(`/chat/history/${username}`);
    userStore.chatHistory = response.data.history;
    return response.data.history;
  } catch (error) {
    alert(error);
    throw error;
  }
}

function deleteChatHistory(sessionId:string) {
  // axios.delete(`chatHistory?agent=${agentType.value}`, {
  //   headers: {
  //     "Authorization": `Bearer ${localStorage.getItem('token')}`
  //   }
  // }).then((response) => {
  //   if (response.data.message === 'seccess') chatHistory.value = []
  //   console.log('[UserAgent][deleteChatHistory] Success Deleteing Chat History: ', response)
  // }, (error) => {
  //   console.error('[UserAgent][deleteChatHistory] Error Deleteing Chat History: ', error)
  // })
}

// #endregion 

</script>

<style scoped lang="less">
button.nav {
  border: none;
  background-color: transparent;
  width: 50px;
  height: 50px;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;

  i {
    color: #ffffff;
    display: block;
    font-size: 25px;
  }
}

.agent-list,
.chat-history-list {
  width: 100%;
  background-color: #1e1e1e;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  .agent-item,
  .chat-history-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #333;
    cursor: pointer;
    /* 添加鼠标指针样式 */
    transition: background-color 0.3s ease;
    /* 添加过渡效果 */

    &:first-child {
      border-top: 1px solid #333;
    }

    &:hover {
      background-color: #333;
    }

    &:active {
      background-color: #555;
    }

    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 10px;
    }
  }

}


.content {
  flex: 1;

  // 这里是智能体列表的文本描述
  .name {
    font-size: 16px;
    font-weight: bold;
  }

  .description {
    font-size: 12px;
    color: #b0b0b0;
  }

  //这里是聊天记录列表的文本表述
  .detail {
    font-size: 16px;
    font-weight: bold;
  }

  .time {
    font-size: 12px;
    color: #b0b0b0;
  }

}





.controls {
  display: flex;
  gap: 5px;

  button {
    width: 60px;
    height: 60px;
    border: 2px solid #ffffff;
    border-radius: 10px;
    background-color: #2c2c2c;

    i {
      color: #ffffff;
      font-size: 30px;
      line-height: 56px;
    }

    &:hover {
      background-color: #1a1a1a;
    }
  }
}
</style>
