<template>
  <!-- 大模型对话页面 -->
  <HeaderBar :show-button="false">{{ agentName }}</HeaderBar>
  <div class="topControls">

    <button class="addChatHistory" aria-label="添加新对话" @click="addSession"><i class="fa-solid fa-plus"></i></button>

    <button class="muteControl" :aria-label="`静音开关${isMute ? '当前已静音' : '当前未静音'}`" :class="{ mute: userStore.isMuted }"
      @click="userStore.isMuted = !userStore.isMuted">
      <i v-if="userStore.isMuted" class="fa-solid fa-volume-xmark"></i>
      <i v-else class="fa-solid fa-volume-high"></i>
    </button>

  </div>

  <div class="container">



    <!-- 聊天消息显示区域 -->
    <div ref="chatContainer" class="chat-container" aria-live="polite" aria-atomic="true"
      :class="{ expand: isShowMoreFunctionBoard }">
      <ChatBubble v-for="(chatItem, index) in chatHistory" :key="index" :chat-item="chatItem"
        :agent-type="userStore.selectedAgent">
      </ChatBubble>
    </div>


    <!-- 下部功能区 -->
    <div class="chat-input-container" role="form">



      <div class="imageUploadPanel" v-show="selectedImages.length">
        <div class="content">
          <div class="imageList" aria-label="图片列表">

            <!-- 图片列表在这里 -->
            <div class="image" v-for="(image, index) in selectedImages" :key="index"
              @click="selectedImages.splice(index, 1)">
              <img :src="createURL(image)" :aria-label="`这是您上传的第${index}张照片，点击即可删除该照片`">
              <img class="remove" src="@/assets/icons/more_function_end.png" alt="删除照片" aria-hidden="true">
            </div>

          </div>
          <div class="add" aria-label="添加图片" @click="selectImage()">
            <img src="@/assets/icons/more_function_start.png" alt="添加图片" aria-hidden="true">
            <input ref="imageInput" class="photo" type="file" accept="image/*" capture="environment" v-show="false"
              @change="handleImage" />
          </div>
        </div>
      </div>


      <button class="phone-button" aria-label="语音聊天" @click="router.replace('/phone')">
        <img src="@/assets/icons/phone.png" class="phone_icon" alt="语音聊天" />
      </button>
      <button class="camera-button" aria-label="使用相机上传图片" @click="selectImage()">
        <img src="@/assets/icons/camera.png" class="camera_icon" alt="使用相机上传图片" />
      </button>

      <!-- 语音输入按钮 -->
      <button class="microphone-button" :aria-label="`${isRecording ? '结束' : '开始'}语音输入`" @click="handleRecording"
        :class="{ recording: isRecording }"></button>
      <textarea class="agent-chat-textarea" placeholder="输入消息..." aria-label="输入消息" v-model="message"
        @keyup.enter="sendMessage"></textarea>
      <button class="send-button" aria-label="发送消息" @click="sendMessage" v-show="message">发送</button>
      <button class="more_function_button" aria-label="开启更多功能" v-show="!message"
        :class="{ open: isShowMoreFunctionBoard }" @click="isShowMoreFunctionBoard = !isShowMoreFunctionBoard"></button>

    </div>


    <div class="moreFunctionBoard" role="region" aria-labelledby="more_function_label" v-show="isShowMoreFunctionBoard">
      <div class="image" aria-label="从相册添加图片" @click="selectImage()"><i class="fa-solid fa-image"></i></div>
      <div class="camera" aria-label="使用相机上传图片" @click="selectImage(true)"><i class="fa-solid fa-camera"></i></div>
    </div>
  </div>
  <AudioPlayer ref="audioPlayer"></AudioPlayer>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from '@/libs/axios'
import { io } from 'socket.io-client'

import HeaderBar from '@/components/HeaderBar.vue'
import ChatBubble from '@/components/ChatBubble.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { type ChatHistoryItem } from '@/types'


const router = useRouter()
const userStore = useUserStore()
const agentName = computed(() => {
  if (userStore.selectedAgent === 'LIFE_ASSISTANT') return '生活助手'
  else if (userStore.selectedAgent === 'PSYCHOLOGIST') return '情感陪护(小天)'
})


const chatHistory = ref<ChatHistoryItem[]>([])
const message = ref('')

const isShowMoreFunctionBoard = ref(false)
const isMute = ref(false)
const isRecording = ref(false)

const selectedImages = ref<File[]>([])


const chatContainer = ref()
const imageInput = ref()

const audioPlayer = ref()



onMounted(async () => {
  if (userStore.currentSessionId === '') {
    addSession()
  }else{
    getChatHistory()
  }
})



// #region 聊天记录回调

/** 
 * 添加会话回调
 */
async function addSession() {
  axios.post('/chat/history', { username: userStore.username, agent_type: userStore.selectedAgent })
    .then(({ data }) => {
      userStore.currentSessionId = data.session_id
      getChatHistory()
    })
    .catch((error) => {
      alert(error.message)
    })
}
/**
 * 获取当前会话id的聊天记录
 */
function getChatHistory() {
  axios.get(`/chat/history?username=${userStore.username}&session_id=${userStore.currentSessionId}`)
    .then(({ data }) => {
      chatHistory.value = data.history
      console.log('[UserAgent][getChatHistory] Success Getting Chat History: ', data)
    }, (error) => {
      console.error('[UserAgent][getChatHistory] Error Getting Chat History: ', error)
    })
}

// 创建SocketIO连接
const socket = io('http://localhost:8000')
/**
 * 发送消息回调
 */
function sendMessage() {
  try {
    let messageText = message.value.trim()
    if (messageText.length === 0 && selectedImages.value.length === 0) return

    socket.emit("completion", {
      query: message.value.trim(),
      agent_type: userStore.selectedAgent,
      session_id: userStore.currentSessionId,
      token: localStorage.getItem('token')
    })

    chatHistory.value.push({
      "role": "user",
      "content": message.value,
      timestamp: new Date().toISOString()
    })
    message.value = ''
    chatHistory.value.push({
      "role": "assistant",
      "content": '',
      timestamp: new Date().toISOString()
    })

    console.log('[UserAgent][sendMessage]Success sending message: ', message.value.trim())

    

  } catch (error) {
    console.error('[UserAgent][sendMessage]Error sending message: ', error)
  }
}

/**
 * 接收消息
 */
socket.on("text", (data: string) => {
  chatHistory.value[chatHistory.value.length - 1].content += data
})

/**
 * 接收音频
 */
socket.on("audio", (audioBuffer: ArrayBuffer) => {
  const blob = new Blob([audioBuffer], { type: "audio/wav" })
  // 播放 blob
  console.log('[UserAgent]收到audio blob:', blob)
  if (!userStore.isMuted) {
    // 将音频数据添加到队列中
    audioPlayer.value.audioQueue.push(blob)
  }
})


socket.on("error", (err) => {
  alert(err.message)
})


// #endregion



//展开更多功能面板之后聊天记录滚动到最底下，待实现
// watch(isShowMoreFunctionBoard, (newVal) => {
//   if (newVal) nextTick(() => {
//     chatContainer.value.scrollTop = chatContainer.value.scrollHeight
//   })
// })

//有新消息来了之后聊天记录滚动到最底下
watch(chatHistory, () => {
  nextTick(() => {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })
}, { deep: true })


// #region 发送图片相关回调
/**
 * 触发input元素的点击事件
 * @param capture 指定是否使用相机，默认为false
 */
function selectImage(capture = false): void {
  if (capture) imageInput.value.setAttribute('capture', 'environment')
  imageInput.value.click()
}


/**
 * 将选择的图片保存到数组
 * @param {Event} e - 事件对象
 */
function handleImage(e: Event): void {
  const file = ((e.target as HTMLInputElement).files as FileList)[0]
  if (!file) return
  selectedImages.value.push(file)
}
/**
 * 创建Blob对象的URL（模板中不能直接用window，故添加此方法）
 * @param {Blob} data - 要创建URL的Blob对象
 * @returns {string} url - URL字符串
 */
function createURL(data: Blob): string {
  return window.URL.createObjectURL(data)
}
// #endregion 发送图片相关回调


let mediaRecorder: MediaRecorder
let audioStream: MediaStream
let recordedChunks: Blob[] = []
let audioBlob: Blob
/**
 * 录音处理函数（点击录音按钮后的回调）
 */
async function handleRecording() {
  if (!mediaRecorder) {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    console.log('[UserAgent][handleRecording] Success Createing UserMedia Stream', audioStream)
    mediaRecorder = new MediaRecorder(audioStream)
    mediaRecorder.ondataavailable = (event: any) => {
      if (event.data.size > 0) recordedChunks.push(event.data)
    }
    mediaRecorder.onstop = () => {
      audioBlob = new Blob(recordedChunks, { type: 'audio/wav' })
      recordedChunks = []
      console.log('[UserAgent][handleRecording] Stop Recording', audioBlob)
      uploadAudio(audioBlob)
    }
  }
  try {
    if (!isRecording.value) {
      mediaRecorder.start()
      console.log('[UserAgent][handleRecording] Start Recording')
      isRecording.value = true

    } else {
      mediaRecorder.stop()
      isRecording.value = false
    }
  } catch (error) {
    console.error('[UserAgent][handleRecording] Error Recording: ', error)
  }

  async function uploadAudio(audioBlob: Blob) {
    const formData = new FormData()
    const audioContext = new AudioContext()
    console.log(audioBlob);

    formData.append("audio_data", audioBlob, "recorded_audio.wav")
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const sampleRate = audioBuffer.sampleRate
    formData.append("sample_rate", String(sampleRate))

    axios.post('/api/agent/upload_audio', formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then((response) => {
      console.log('[UserAgent][handleRecording][uploadAudio] Success Uploading: ', response)
    }).catch((error) => {
      console.error('[UserAgent][handleRecording][uploadAudio] Error Uploading: ', error)
    })
  }
}
/**
 * 语音识别结束后，将识别结果发送给后端，并开始语音对话
 */
// socket.on('agent_speech_recognition_finished', async function (data) {
//   const user = localStorage.getItem('user')
//   console.log('curr_user', user)
//   if (data.user !== user) return;
//   const rec_result = data['rec_result'];

//   if (!rec_result) {
//     console.log('[agent.js][socket.on][agent_speech_recognition_finished] 音频识别结果为空.');
//     return;
//   }
//   console.log('[agent.js][socket.on][agent_speech_recognition_finished] 音频识别结果:', rec_result);

//   message.value += rec_result;
//   sendMessage()
// })

//环境噪音分析待添加

</script>

<style scoped lang="less">
.topControls {
  button {
    border: none;
    background-color: transparent;
    cursor: pointer;
    width: 50px;
    height: 50px;
    padding: 0;
    position: absolute;
    top: 0;

    i {
      color: #ffffff;
      display: block;
      font-size: 30px;
    }
  }

  .addChatHistory {
    left: 0;
  }

  .muteControl {
    right: 0;
  }
}


.container {
  position: relative;
  height: calc(100vh - 100px);
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;

  .chat-container {
    display: flex;
    width: 100vw;
    padding: 0 15px;
    flex-direction: column;
    overflow: auto;
    scrollbar-width: none;
    transition: bottom 0.1s ease;
    box-sizing: border-box;
    position: absolute;
    top: 0;
    bottom: 50px;
    height: auto;

    &.expand {
      bottom: 130px;
    }
  }

  .chat-input-container {
    width: 100vw;
    height: 48px;
    display: flex;
    align-items: center;
    background-color: #2c2c2c;
    border-top: 1px solid #555;
    border-bottom: 1px solid #333;
    position: relative;

    .imageUploadPanel {
      display: flex;
      width: 100vw;
      height: 100px;
      position: absolute;
      bottom: 50px;
      align-items: center;
      justify-content: center;

      .content {
        overflow-x: auto;
        display: flex;
        align-items: center;
        padding: 5px;

        .imageList {
          overflow-x: auto;
          display: flex;
          align-items: center;

          .image {
            width: 80px;
            height: 80px;
            border-radius: 10px;
            overflow: hidden;
            margin-right: 5px;
            position: relative;

            .musk {
              width: 80px;
              height: 80px;
              border-radius: 10px;
              position: absolute;
              background-color: rgba(255, 0, 0, 0.5);
              z-index: 2;
              left: 0;
              top: 0;
            }

            img {
              width: 100%;
              height: 100%;
            }

            .remove {
              width: 20px;
              height: 20px;
              display: block;
              position: absolute;
              right: 1px;
              top: 1px;
            }
          }
        }

        .add {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          background-color: #3eb575;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          img {
            width: 30px;
            height: 30px;
          }

          input {
            display: none;
          }
        }
      }

    }

    .phone-button {
      position: absolute;
      bottom: 52px;
      left: 0px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      width: 6rem;
      height: 4rem;
      justify-content: left;
      align-items: flex-end;
      padding: 4px 4px;

      .phone_icon {
        width: 3rem;
        height: 3rem;
      }
    }

    .camera-button {
      position: absolute;
      bottom: 52px;
      right: 3px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      width: 6rem;
      height: 4rem;
      justify-content: right;
      align-items: center;
      padding: 4px 4px;

      .camera_icon {
        width: 3rem;
        height: 3rem;
      }
    }

    .microphone-button {
      position: absolute;
      left: 0.3rem;
      width: 2.4rem;
      height: 2.4rem;
      background-image: url('@/assets/icons/microphone.png');
      background-size: 2rem;
      background-repeat: no-repeat;
      background-position: center;
      border-radius: 50%;
      border: none;
      background-color: #3eb575;
      cursor: pointer;
      z-index: 1;

      &.recording {
        background-color: red;
      }
    }

    .agent-chat-textarea {
      display: flex;
      height: 45px;
      overflow-y: auto;
      resize: none;
      width: auto;
      position: absolute;
      left: 2.9rem;
      right: 5.5rem;
      background-color: rgba(0, 0, 0, 0.8);
      color: #ffffff;
      border-radius: 10px;
      padding: 10px 0.5rem 10px 0.5rem;
      font-size: 15px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.1s ease;
      box-sizing: border-box;
      align-items: center;

      &:placeholder-shown {
        right: 2.9rem;
      }

      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
      }

    }

    .send-button {
      position: absolute;
      right: 0.3rem;
      width: 5rem;
      height: 2.4rem;
      border-radius: 5px;
      border: none;
      font-size: large;
      background-color: #3eb575;
      color: white;
      cursor: pointer;
      text-align: center;
      z-index: 1;
    }

    .more_function_button {
      position: absolute;
      right: 0.3rem;
      width: 2.4rem;
      height: 2.4rem;
      background-image: url('@/assets/icons/more_function_start.png');
      background-size: 2rem;
      background-repeat: no-repeat;
      background-position: center;
      border-radius: 50%;
      border: none;
      background-color: #3eb575;
      cursor: pointer;
      z-index: 1;

      &.open {
        background-image: url('@/assets/icons/more_function_end.png');
      }

    }
  }

  .moreFunctionBoard {
    width: auto;
    height: 80px;
    background-color: #2c2c2c;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;


    .image {
      display: flex;
      position: absolute;
      top: 0.5rem;
      left: 0rem;
      color: white;
      font-size: 2.5rem;
      width: 6rem;
      height: 4rem;
      justify-content: center;
      align-items: center;

      &:hover {
        background-color: #726c6c;
      }
    }

    .camera {
      display: flex;
      position: absolute;
      top: 0.5rem;
      left: 6.0rem;
      color: white;
      font-size: 2.5rem;
      width: 6rem;
      height: 4rem;
      justify-content: center;
      align-items: center;

      &:hover {
        background-color: #726c6c;
      }
    }




    .function_1 {
      display: flex;
      position: relative;
      top: 50px;
      width: 50px;
      height: 50px;
      left: 4%;
      background-color: #b0aec4;
      border: 0;
      padding: 0;
      border-radius: 10px;

      &:hover {
        background-color: #726c6c;
      }
    }
  }
}


.star {
  height: 30px;
  width: 30px;
}




.photo {
  visibility: hidden;
}



.image-preview {
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
}
</style>