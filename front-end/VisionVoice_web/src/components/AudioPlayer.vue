<template>
  <!-- 
   音频播放器组件
   使用方法：在父组件中引入该组件，使用ref获取组件实例，将音频blob push到audioQueue[]即可
  -->
  <audio :src="audioURL" autoplay v-show="false" @ended="playAudio" ref="audioElem"></audio>
</template>

<script setup lang="ts" name="AudioPlayer">
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
let audioURL = ref('')
let isPlaying = false
const audioElem = ref<HTMLAudioElement>()
const audioQueue = ref<Blob[]>([])

defineExpose({ audioQueue })

watch(audioQueue,() => {
  if(isPlaying === false && userStore.isMuted === false) playAudio()
},{deep:true})

function playAudio() {
  // 如果音频队列中没有音频数据（即后端还没有发送音频数据），则停止播放
  if (audioQueue.value.length === 0) {
    isPlaying = false
    return
  }
  isPlaying = true
  console.log('[AudioPlayer][playAudio] audioQueue:', audioQueue.value)
  // 从队列中取出下一个音频
  const nextAudioBlob = audioQueue.value.shift()
  // 如果音频数据不为空，则播放音频
  if (nextAudioBlob) {
    // 将音频数据转换为 Blob 对象，并对其创建资源 URL，从而设置音频播放器的播放源（播放源只能是 URL）
    audioURL.value = URL.createObjectURL(nextAudioBlob);
  }
}
// 函数执行完了之后会被audio标签的onend再次调用

</script>

<style scoped></style>