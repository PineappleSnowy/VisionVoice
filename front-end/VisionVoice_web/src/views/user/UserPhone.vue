<template>
  <div class="container">
    <HeaderBar return-path="/agent">{{ title }}</HeaderBar>
    <i aria-label="切换摄像头" class="fa-solid fa-repeat toggleCamera" v-show="isVideoChat" @click="switchCamera"></i>


    <img class="avatar" :src="botAvatar" alt="智能体头像" aria-label="智能体头像" v-show="!isVideoChat">
    <video autoplay ref="video" aria-label="视频通话窗口" v-show="isVideoChat" muted>您的浏览器不支持视频通话</video>



    <div class="status">
      <span ref="statusSpan">{{ status }}</span>
      <canvas class="waveShape" ref="waveShape" aria-label="音频波形图"></canvas>
      <i class="fa-solid fa-circle-stop" aria-label="打断说话" @click="" v-show="isPlaying"></i>
    </div>

    <!-- 控件部分 -->
    <div class="controller">
      <i class="fa-solid fa-video" :aria-label="`${isVideoChat ? '关闭' : '打开'}摄像头`" @click="toggleCamera"></i>
      <i class="fa-solid fa-microphone" :class="{ open: isMicOn }" :aria-label="`${isMicOn ? '关闭' : '打开'}麦克风按钮`"
        @click="toggleMic"></i>
      <i class="fa-solid fa-font" aria-label="字幕按钮"></i>
      <i class="fa-solid fa-phone-slash" aria-label="挂断电话"></i>
    </div>


    <!-- 选项栏 -->
    <div class="optionBar">
      <button class="optionButton avoidObstacle" aria-label="辅助避障" @click="avoidObstacle">避障</button>
      <button class="optionButton findItem" aria-label="帮我寻物" @click="findItem">寻物</button>
      <button class="optionButton currentLocation" aria-label="当前位置" @click="getPosition">位置</button>
      <button class="optionButton environmentDescription" aria-label="环境描述" @click="describeEnv">环境</button>
    </div>

    <!-- 小窗部分 -->
    <div class="findItemModal" v-show="isModelOpen">
      <div class="title">"请选择你要寻找的物品，来自：我的-寻物画廊"</div>
      <div class="overflowArea" aria-label="请选择你要寻找的物品，来自：我的-寻物画廊">
        <div class="item" aria-label="物品" v-for="(image, index) in galleryImages" :key="index">
          <img :src="image.url" :alt="image.name" aria-label="物品图片"
            @click="startFindItem($event.target as HTMLImageElement)">
          <span aria-label="物品描述">{{ image.name }}</span>
        </div>
      </div>
      <button aria-label="关闭寻物小窗" @click="isModelOpen = false">关闭</button>

    </div>
    <!-- 覆盖层元素，实现模态窗口弹出时无法点击其他按钮 -->
    <div class="shader" v-show="isModelOpen"></div>

    <AudioPlayer></AudioPlayer>
  </div>
</template>

<script setup lang="ts" name="UserPhone">
import { nextTick, onMounted, ref, watch, computed } from 'vue'
import HeaderBar from '@/components/HeaderBar.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { io } from 'socket.io-client'
import axios from 'axios'
import { Vudio } from '@/libs/Vudio.ts'
import { initAudioAnalyser, detectDB } from '@/libs/audioUtils'
import psychologicalAgent from '@/assets/icons/psychologicalAgent.jpg'
import defaultAgent from '@/assets/icons/defaultAgent.jpg'
import type { ImageListItem } from '@/types'
import type { YoloDetector } from '@/libs/yoloDetector'
let statusSpan = ref()
let status = ref('我在听')
let isVideoChat = ref(false)
let isFaceChat = ref(false)
let isRecording = ref(true)
let isPlaying = ref(false)
let isSpeaking = ref(false)
let isMicOn = ref(true)
let isModelOpen = ref(false)
let botAvatar = ref('')
let waveShape = ref()
let video = ref()
let mode = ref<'findItem' | 'obstacleAvoid' | 'chat'>('chat')
let imageUploadReady = true
let analyser: AnalyserNode, dataArray: Float32Array
let mediaStream: MediaStream

// 根据mode计算页面标题
let title = computed(() => {
  switch (mode.value) {
    case 'findItem':
      return '寻物模式'
    case 'obstacleAvoid':
      return '避障模式'
    case 'chat':
      return '聊天模式'
    default:
      return '未知模式'
  }
})

watch(status, () => {
  nextTick(() => statusSpan.value.scrollLeft = statusSpan.value.scrollWidth)
})


watch(isSpeaking, (newVal) => {
  if (newVal) {
    console.log('[UserPhone] User Begin Speaking')
    if (isMicOn.value) handleRecording(true)

  } else {
    console.log('[UserPhone] User End Speaking')
    handleRecording(false)
  }
})

const token = localStorage.getItem('token')
const agentType = localStorage.getItem('agentType') || 'defaultAgent'
const socket = io('http://localhost', {
  timeout: 60000,  // 设置较大的 pingTimeout
  // pingInterval: 30000,  // 设置较大的 pingInterval
  query: {
    token: token
  }
})

// #region 回调函数

/**
 * 避障回调函数
 */

async function avoidObstacle() {
  if (!isVideoChat.value) await toggleCamera()
  if (!yoloDetectorInstance) await loadModel()
  yoloDetectRealize('','obstacleAvoid')

}

/**
 * 寻物回调函数
 */
let galleryImages = ref<ImageListItem[]>([])
async function findItem() {
  if (!isVideoChat.value) await toggleCamera()
  if (!yoloDetectorInstance) await loadModel()
  isModelOpen.value = true
  axios.get('/api/galleryImages', {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  }).then((response) => {
    galleryImages.value = response.data
    console.log('[UserPhone][findItem]Success Getting Images', response.data)
  }).catch((error) => {
    console.error('[UserPhone][findItem]Error Getting Images', error)
  })
}


/**
 * 点击某一图片开始寻物的回调函数
 * @param image img的DOM元素
 */
let yoloDetectorInstance: YoloDetector
async function startFindItem(image: HTMLImageElement) {
  if (!isVideoChat.value) await toggleCamera()
  if (!yoloDetectorInstance) await loadModel()
  const templateState = await yoloDetectorInstance.getTemplate(image)
  if (templateState == -1) {
    status.value = '物品模板加载失败,寻物模式已退出,建议使用更清晰的物品模板，并不以人为主体'
    return Promise.reject()
  }
  status.value = `物品模板加载完毕, 开始寻找${image.alt}`
  yoloDetectRealize(image.alt, 'findItem')
}


/**
 * 获取位置回调函数
 */
let geocode_key: string
function getPosition() {
  if (!navigator.geolocation) {
    alert('您的浏览器不支持获取位置！')
    return
  }
  axios.get('/gaode_api')
    .then((response) => {
      geocode_key = response.data.geocode
    }).catch((error) => {
      console.error('[UserPhone][getPosition] Error Getting Key', error)
    })

  navigator.geolocation.getCurrentPosition(({ coords: { latitude, longitude } }) => {
    console.log('[UserPhone][getPosition] Success Getting Location longitude,latitude', latitude, longitude)
    axios.get(`https://restapi.amap.com/v3/geocode/regeo?key=${geocode_key}&location=${longitude},${latitude}&poitype=&radius=&extensions=all&roadlevel=0`)
      .then((response) => {
        const formattedAddress = response.data.regeocode.formatted_address
        console.log('[UserPhone][getPosition] Success Getting Position', formattedAddress)
        const prompt = `我当前的位置是：${formattedAddress}请结合环境信息简洁回答。我的提问是：`
        const locationInfo = `你位于${formattedAddress}`
        status.value = locationInfo
        return { prompt, locationInfo }

      }).catch((error) => {
        console.error('[UserPhone][getPosition] Error Getting Position', error)
        const prompt = `地理编码逆解析失败，仅可知我当前经纬坐标为(${longitude},${latitude})。请结合环境信息简洁回答。我的提问是：`;
        const locationInfo = `地理编码逆解析失败，你当前经纬坐标为：${longitude},${latitude}。`
        status.value = locationInfo
        return { prompt, locationInfo }
      })
  }, (error) => {
    console.error('[UserPhone][getPosition] Error Getting Location', error)
  }, {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  })
}

/**
 * 描述环境回调函数
 */
async function describeEnv() {
  if (!isVideoChat.value) await toggleCamera()
  if (isFaceChat.value) await switchCamera()
  isMicOn.value = false
  let complexity = localStorage.getItem('complexity') || 'detailed'
  let prompt
  if (complexity == "detailed") {
    prompt = "你是一名热心的助手，请你充分捕捉图片信息，客观详细地描述这张图片。"
  }
  else if (complexity == "simple") {
    prompt = "你是一名热心的助手，请你简洁地描述这张图片。"
  }
  //延迟一会避免加载不成功
  setTimeout(sendVideoFrame, 200)
}


/**
 * 切换摄像头打开和关闭
 */
 async function toggleCamera() {
  if (isVideoChat.value) {
    mediaStream.getTracks().forEach(track => track.stop())
    video.value.srcObject = null
  } else {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: isFaceChat.value ? 'user' : 'environment' }, audio: true })
      video.value.srcObject = mediaStream
    } catch (err: Error) {
      if (err.name === 'NotAllowedError') {
        alert('请允许访问您的摄像头！')
      } else if (err.name === 'NotFoundError') {
        alert('未找到可用的摄像头！')
      } else {
        alert('发生错误: ' + err.message)
      }
    }
  }
  isVideoChat.value = !isVideoChat.value
}

/**
 * 切换前后摄像头
 */
async function switchCamera() {
  mediaStream.getTracks().forEach(track => track.stop())
  video.value.srcObject = null
  isFaceChat.value = !isFaceChat.value
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: isFaceChat.value ? 'user' : 'environment' }, audio: true })
    video.value.srcObject = mediaStream
  } catch (err: Error) {
    if (err.name === 'NotAllowedError') {
      alert('请允许访问您的摄像头！')
    } else if (err.name === 'NotFoundError') {
      alert('未找到可用的摄像头！')
    } else {
      alert('发生错误: ' + err.message)
    }
  }
}

function toggleMic() {
  isMicOn.value = !isMicOn.value
}



// #endregion 回调函数



onMounted(async () => {
  // 根据当前智能体选择设置智能体头像
  if (agentType === 'psychologicalAgent') {
    botAvatar.value = psychologicalAgent
  } else {
    botAvatar.value = defaultAgent
  }
  // 检查 URL 中的查询参数
  const camera = new URLSearchParams(window.location.search).get('camera')
  if (camera === 'on') toggleCamera()

  mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  console.log("[UserPhone][onMounted] Success Creating mediaStream")

  // 初始化音频分析器
  const { analyser, dataArray } = await initAudioAnalyser(mediaStream)

  // 创建音频波形
  const vudio = new Vudio(mediaStream, waveShape.value, {
    effect: 'waveform',
    accuracy: 16,
    width: window.innerWidth * 100 / 412 * 1.5,
    height: window.innerWidth * 100 / 412 * 1,
    waveform: {
      maxHeight: 80,
      minHeight: 0,
      spacing: 5,
      color: '#fff',
      shadowBlur: 0,
      shadowColor: '#f00',
      fadeSide: true,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      radius: 20,
      prettify: true
    }
  })
  vudio.dance()

  //检测环境噪音阈值，组件实现
  // 获取静音阈值
  let SILENCE_THRESHOLD = localStorage.getItem('SILENCE_THRESHOLD') || '-40'
  console.log('[phone.js][window.onload] 获取静音阈值:', SILENCE_THRESHOLD)

  /**
   * 检测用户是否已经停止讲话
   * @returns {Boolean} 用户是否已经停止讲话
   */
  function detectSilence(analyser: AnalyserNode, dataArray: Float32Array): boolean {
    const db = detectDB(analyser, dataArray)

    // 更新分贝值
    // currentDB.textContent = "当前分贝值: " + db
    // console.log("当前分贝值: " + db);

    return db < +SILENCE_THRESHOLD
  }

  setInterval(() => {
    if (detectSilence(analyser, dataArray)) {
      isSpeaking.value = false
    }
  }, 2500)
  setInterval(() => {
    if (!detectSilence(analyser, dataArray)) {
      isSpeaking.value = true
    }
  }, 200)
})









let mediaRecorder: MediaRecorder
let recordedChunks: Blob[] = []
let audioBlob: Blob
/**
 * 处理并发送录制的音频
 * @param action true - 开始录制/false - 停止录制
 */
async function handleRecording(action: boolean) {
  if (!mediaRecorder) {
    mediaRecorder = new MediaRecorder(mediaStream)
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
    if (action) {
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
      console.error('[UserAgent][handleRecording][uploadAudio] Error Uploading: ', error.response.data)
    })
  }
}



// #region 工具函数

/**
 * 加载模型
 */
 async function loadModel() {
  status.value = '请稍等，正在加载模型'
  const { YoloDetector } = await import('@/libs/yoloDetector')
  yoloDetectorInstance = new YoloDetector()
  await yoloDetectorInstance.init()
  status.value = '模型初始化完成'
  return Promise.resolve()
}

/**
 * Yolo的具体实现
 * @param itemName 物体名称
 * @param mode 模式（避障或者寻物）
 */
 async function yoloDetectRealize(itemName: string, mode: 'findItem' | 'obstacleAvoid') {
  // 模式不同，退出条件不同
  while (mode == 'findItem' || mode == 'obstacleAvoid') {
    // 创建 canvas 元素，用于绘制视频帧
    const canvas = document.createElement('canvas')
    canvas.width = video.value.videoWidth
    canvas.height = video.value.videoHeight
    const context = canvas.getContext('2d') as CanvasRenderingContext2D

    // 将视频帧绘制到 canvas 上
    context.drawImage(video.value, 0, 0, canvas.width, canvas.height)
    let detectResult: any = []
    if (mode == 'findItem') {
      detectResult = await yoloDetectorInstance.detect(canvas)
    } else {
      detectResult = await yoloDetectorInstance.detect_obs(canvas)
    }
    canvas.remove()//移除 canvas 元素

    let itemLocInfo = ''
    if (detectResult.length > 0) {
      const leftLoc = detectResult[0]["left"]
      const topLoc = detectResult[0]["top"]
      if (mode == 'findItem') {
        itemLocInfo = `${itemName}在画面${calcLocation(topLoc, leftLoc)}。`
      } else {
        const obs_dis = detectResult[0]["distance"];
        const detected_item = detectResult[0]["class"];
        itemLocInfo = `画面${calcLocation(topLoc, leftLoc)} ${detected_item}距离${obs_dis.toFixed(2)}米。`;
      }
      status.value = itemLocInfo;
      //socket.emit("agent_stream_audio", itemLocInfo, talk_speed, curr_task_id)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await new Promise(resolve => setTimeout(resolve, 10));  // 防止处理超速
  }

  /**
   * 计算描述位置的字符串
   * @param top 
   * @param left 
   * @returns str
   */
  function calcLocation(top: number, left: number) {
    let xDescribe = ''
    let yDescribe = ''
    let finalDescrible = ''

    if (left <= 0.33)
      xDescribe = '左'
    else if (left <= 0.67)
      xDescribe = '中'
    else if (left <= 1)
      xDescribe = '右'

    if (top <= 0.33)
      yDescribe = '上'
    else if (top <= 0.67)
      yDescribe = '中'
    else if (top <= 1)
      yDescribe = '下'

    if (xDescribe != '中' || yDescribe != '中')
      finalDescrible = xDescribe + yDescribe
    else
      finalDescrible = "中央"

    return finalDescrible
  }

}

/**
 * 将视频帧发往后端
 */
 function sendVideoFrame() {
  if (!isVideoChat.value) return
  //创建canvas用于绘制视频帧
  const canvas = document.createElement('canvas')
  canvas.width = video.value.videoWidth
  canvas.height = video.value.videoHeight

  const context = canvas.getContext('2d') as CanvasRenderingContext2D
  context.drawImage(video.value, 0, 0, canvas.width, canvas.height)
  const imageData = canvas.toDataURL('image/jpeg')
  // 销毁 canvas 元素，避免持续内存占用
  canvas.remove()

  console.log(imageData)

  axios.post('/api/agent/upload_image', JSON.stringify({ "image": imageData, "state": state }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // 添加 token 到请求头
    }
  }).then(response => {
    if (response.data["message"] != "Success") {
      console.log('Error:', response.data)
      sendVideoFrame()
    } else {
      console.log('[UserPhone][sendVideoFrame] Frame uploaded successfully:', response.data)
      // if (state.value == 0) {
      //   imageUploadReady = true;
      //   // formChat(curr_task_id)
      // }
    }
  }).catch(error => {
    console.error('[UserPhone][sendVideoFrame] Error uploading frame:', error);
  })
}


// #endregion 工具函数






</script>

<style scoped lang="less">
.container {
  position: relative;
  height: 100vh;
  width: 100vw;

  .toggleCamera {
    display: block;
    position: absolute;
    right: 13px;
    top: 15px;
    font-size: 24px;
  }

  .avatar {
    position: absolute;
    top: 200px;
    left: calc(50vw - 75px);
    width: 150px;
    height: 150px;
    border-radius: 20px;
    box-shadow: 0px 0px 5px;
  }

  video {
    display: flex;
    height: calc(100vh - 300px);
    width: 100vw;
  }

  .status {
    position: absolute;
    bottom: 130px;
    width: 100vw;
    height: 120px;

    span {
      display: block;
      position: absolute;
      top: 10px;
      width: calc(100% - 20px);
      margin: 0 10px;
      text-align: center;
      font-size: 20px;
      overflow: auto;
      scrollbar-width: none;
      white-space: nowrap;
    }

    canvas {
      position: absolute;
      bottom: 0;
      height: 80px;
      width: 160px;
      left: calc(50vw - 80px);
    }

    i {
      position: absolute;
      bottom: 10px;
      font-size: 60px;
      left: calc(50vw - 30px);
    }
  }

  .controller {
    position: absolute;
    bottom: 50px;
    width: 100vw;
    height: 80px;
    display: flex;
    justify-content: space-around;
    align-items: center;

    i {
      font-size: 40px;

      &.open {
        color: seagreen;
      }
    }
  }

  .optionBar {
    position: absolute;
    bottom: 0;
    height: 50px;
    width: 100vw;
    display: flex;
    justify-content: space-around;

    .optionButton {
      width: 25vw;
      height: 100%;
      border: 1px solid #444;
      background-color: #1e1e1e;
      color: #ffffff;
      font-size: 20px;
      box-sizing: border-box;
    }
  }

  .findItemModal {
    position: fixed;
    top: 10vh;
    left: 10vw;
    height: 80vh;
    width: 80vw;
    z-index: 3;
    border: 1px solid #444;

    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 15px;
      width: 100%;
      height: 5%;
    }

    .overflowArea {
      display: flex;
      width: 100%;
      height: 85%;
      overflow: auto;
      scrollbar-width: none;
      position: relative;
      padding: 5px;
      flex-wrap: wrap;
      justify-content: center;
      box-sizing: border-box;

      .item {
        display: flex;
        width: 46%;
        height: 50%;
        flex-direction: column;
        justify-content: center;
        border: 1px solid #444;
        margin: 5px;

        img {
          width: 100%;
          height: 80%;
        }

        span {
          display: flex;
          width: 100%;
          height: 20%;
          font-size: 30px;
          align-items: center;
          justify-content: center;
        }
      }
    }

    button {
      border: none;
      height: 10%;
      width: 100%;
      background-color: #444;
      color: #ffffff;
      padding: 0;
      font-size: 20px;
    }



  }

  .shader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 2;
  }
}
</style>