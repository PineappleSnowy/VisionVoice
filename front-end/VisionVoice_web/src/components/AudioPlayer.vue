<template>
  <audio :src="audioURL" autoplay v-show="false" @ended="playNextAudio"></audio>
</template>

<script setup lang="ts" name="AudioPlayer">
import { onBeforeUnmount, ref } from 'vue';
import { io } from 'socket.io-client'
import { type AudioChunk } from '@/types';
let currentTalkIndex = ref(0)
let audioURL = ref('')
let audioQueue:ArrayBuffer[] = []
let isPlaying = false
let isMute = localStorage.getItem('isMuted') === 'true'

const socket = io({
  // pingTimeout: 60000,  // 设置较大的 pingTimeout
  // pingInterval: 30000,  // 设置较大的 pingInterval
  query: {
    token: localStorage.getItem('token')
  }
})

socket.on('agentAudioChunk', function (data:AudioChunk) {
    console.log('[AudioPlayer][socket.io] Success Receiving Audio Chunk', data)
    const user = localStorage.getItem('user')
    // 如果用户不匹配或者对话序号不匹配，则停止处理
    if (data.user !== user || data.taskId !== currentTalkIndex.value){
      console.error('[AudioPlayer][socket.io] Audio Chunk not Match!', data)
      return
    }
    if (!isMute) {
        // 将音频数据添加到队列中
        audioQueue[data.index] = data.audioChunk

        // 如果当前没有音频正在播放，开始播放
        if (!isPlaying) playNextAudio()
    }
})

function playNextAudio() {
    // 如果音频队列中没有音频数据（即后端还没有发送音频数据），则停止播放
    if (audioQueue.length === 0) {
        isPlaying = false
        return
    }
    console.log('[audioPlayer][playNextAudio] audioQueue:', audioQueue)
    // 从队列中取出下一个音频
    const nextAudioData = audioQueue.shift()

    // 如果音频数据不为空，则播放音频
    if (nextAudioData) {

        // 标识音频正在播放
        isPlaying = true

        // 将音频数据转换为 Blob 对象，并对其创建资源 URL，从而设置音频播放器的播放源（播放源只能是 URL）
        const audioBlob = new Blob([nextAudioData], { type: 'audio/mp3' })
        audioURL.value = URL.createObjectURL(audioBlob)

        // 播放音频
        // audioPlayer.play().then(() => {
        //     console.log('音频片段播放中...')
        // }).catch(error => {
        //     console.log('音频片段播放失败.', error)
        // });
    } else {
        // 如果当前音频为空，继续播放下一个
        playNextAudio()
    }
}

</script>

<style scoped></style>