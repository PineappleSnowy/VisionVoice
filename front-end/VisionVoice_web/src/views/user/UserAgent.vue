<template>
  <HeaderBar :show-button="false">生活助手</HeaderBar>
  <button class="delete-chat-history" aria-label="删除对话记录" @click="deleteChatHistory"></button>
  <button class="audio-control" aria-label="静音开关" :class="{ mute: isMute }" @click="isMute = !isMute"></button>

  <div class="container">



    <!-- 聊天消息显示区域 -->
    <div ref="chatContainer" class="chat-container" aria-live="polite" aria-atomic="true"
      :class="{ expand: isShowMoreFunctionBoard }">
      <ChatBubble v-for="(chatItem, index) in chatHistory" :key="index" :chat-item="chatItem" :agent-type="agentType">
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
  <AudioPlayer></AudioPlayer>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { io } from 'socket.io-client'
import HeaderBar from '@/components/HeaderBar.vue'
import ChatBubble from '@/components/ChatBubble.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import type { ChatHistoryItem } from '@/types'

const socket = io('http://localhost', {
  query: {
    token: localStorage.getItem('token')
  }
})
const router = useRouter()
const agentType = ref('defaultAgent')
const chatHistory = ref<ChatHistoryItem[]>([])
const message = ref('')
const isShowMoreFunctionBoard = ref(false)
const isMute = ref(false)
const isRecording = ref(false)
const selectedImages = ref<File[]>([])
const chatContainer = ref()
const imageInput = ref()
let talkSpeed = localStorage.getItem('speed') || 8
const username = localStorage.getItem('username')

function getChatHistory(): void {
  axios.get(`/chat/history/${username}`)
    .then((response) => {
      chatHistory.value = response.data
      console.log('[UserAgent][getChatHistory] Success Getting Chat History: ', response)
    }, (error) => {
      console.error('[UserAgent][getChatHistory] Error Getting Chat History: ', error)
    })
}

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
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value))
}, { deep: true })



function changeChatHistory() {
  axios.get(`/api/chatHistory?agent=${agentType.value}`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  }).then((response) => {
    chatHistory.value = response.data
  }, (error) => {
    console.error('[UserAgent][loadChatHistory] Error Loading Chat History: ', error)
  })
}

function deleteChatHistory() {
  axios.delete(`chatHistory?agent=${agentType.value}`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  }).then((response) => {
    if (response.data.message === 'seccess') chatHistory.value = []
    console.log('[UserAgent][deleteChatHistory] Success Deleteing Chat History: ', response)
  }, (error) => {
    console.error('[UserAgent][deleteChatHistory] Error Deleteing Chat History: ', error)
  })
}

function sendMessage() {
  let messageText = message.value.trim()
  if (messageText.length === 0 && selectedImages.value.length === 0) return

  chatHistory.value.push({
    "role": "user",
    "content": messageText,
  })
  message.value = ''

  const uploadStatus = selectedImages.value.map((image, index) => {
    return new Promise((resolve, reject) => {
      selectedImages.value.forEach((item, index) => {
        let imageURL = ''
        const reader = new FileReader()
        reader.readAsDataURL(item)
        reader.onload = function (e) {
          imageURL = e.target?.result as string

          axios.post('/api/agent/upload_image', { image: imageURL, multi_image_index: index }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then((response) => {
            console.log('[UserAgent][sendMessage] Success Sending Image, Response: ', response)
            resolve(response.data)
          }).catch((error) => {
            console.error('[UserAgent][sendMessage] Error Sending Image', error)
            reject(error)
          })
        }
      })
    })
  })

  Promise.all(uploadStatus).then(() => {
    //浏览器端axios基于XMLHttpRequest，不支持流式，故使用fetch
    fetch(`/api/agent/chat_stream?query=${messageText}&agent=${agentType.value}&multi_image_talk=${Boolean(selectedImages.value.length)}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => {
        let reader = (response.body as ReadableStream).getReader()

        selectedImages.value = []
        chatHistory.value.push({
          "role": "assistant",
          "content": '',
        })

        reader.read().then(function processText({ done, value }): Promise<void> {
          if (done) return Promise.resolve()
          let jsonString = new TextDecoder().decode(value)
          if (!(jsonString.includes("<END>"))) chatHistory.value[chatHistory.value.length - 1].content += jsonString
          if (!isMute.value) {
            socket.emit("agent_stream_audio", jsonString, talkSpeed, chatHistory.value.length)
          }
          return reader.read().then(processText)
        }).catch((error) => {
          console.error('[UserAgent][sendMessage] Error Reading Message', error)
        })

      })
      .catch((error) => {
        console.error('[UserAgent][sendMessage] Error Sending Message', error)
      })
  })






}
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
socket.on('agent_speech_recognition_finished', async function (data) {
  const user = localStorage.getItem('user')
  console.log('curr_user', user)
  if (data.user !== user) return;
  const rec_result = data['rec_result'];

  if (!rec_result) {
    console.log('[agent.js][socket.on][agent_speech_recognition_finished] 音频识别结果为空.');
    return;
  }
  console.log('[agent.js][socket.on][agent_speech_recognition_finished] 音频识别结果:', rec_result);

  message.value += rec_result;
  sendMessage()
})

//环境噪音分析待添加

</script>

<style scoped lang="less">
.delete-chat-history {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 80px;
  height: 50px;
  background-image: url('@/assets/icons/delete.png');
  background-size: 40%;
  background-repeat: no-repeat;
  background-position: 10px center;
  border: none;
  background-color: transparent;
  cursor: pointer;
}

.audio-control {
  position: absolute;
  top: 0px;
  right: 0px;
  width: 80px;
  height: 50px;
  background-image: url('@/assets/icons/audio.png');
  background-size: 40%;
  background-repeat: no-repeat;
  background-position: calc(100% - 10px) center;
  border: none;
  background-color: transparent;
  cursor: pointer;

  &.mute {
    background-image: url('@/assets/icons/audio_mute.png');
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
      font-size: 16px;
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