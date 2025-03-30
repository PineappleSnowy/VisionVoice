<template>
  <div id="panel" class="panel" role="contentinfo" aria-label="图片上传面板">
    <transition name="slide-down">
      <div class="top" v-show="isExpand">
        <button id="cameraButton" aria-label="从摄像头获取图片" @click="openFileInput('camera')">从摄像头获取</button>
        <button id="albumButton" aria-label="从相册获取图片" @click="openFileInput('album')">从相册获取</button>
      </div>
    </transition>

    <div class="bottom">
      <button id="addButton" v-show="!isExpand" aria-label="添加物品图片" @click="isExpand = !isExpand;">&#10010;</button>
      <button id="cancelButton" v-show="isExpand" aria-label="取消" @click="isExpand = !isExpand">取消</button>
    </div>

    <input type="file" id="fileInput" accept="image/*" capture="environment" aria-label="选择图片文件"
      style="display: none" ref="fileInput" @change="handleFileChange"/>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['uploadFile'])

let isExpand = ref(false)

// 获取文件输入框的引用
const fileInput = ref<HTMLInputElement | null>(null);

// 打开文件选择对话框
function openFileInput(type: 'camera' | 'album'): void {
  if (fileInput.value) {
    // 设置 capture 属性
    if (type === 'camera') {
      fileInput.value.setAttribute('capture', 'environment'); // 使用后置摄像头
    } else {
      fileInput.value.removeAttribute('capture'); // 从相册选择
    }
    // 触发文件选择对话框
    fileInput.value.click();
  }
}

function handleFileChange(e:Event){
  const target = e.target as HTMLInputElement
  if(target.files && target.files.length > 0){
    console.log("[ImageUploadPanel] File Selected:", target.files[0])
    emit('uploadFile',target.files[0])
    isExpand.value = false
  }else{
    console.error("[ImageUploadPanel] File Selection Error")
  }
}

</script>

<style scoped lang="less">
.panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100vw;
  text-align: center;
  color: #e0e0e0;

  .top {
    display: flex;
    justify-content: space-evenly;
    background-color: #1e1e1e;
    overflow: hidden;
  }

  .bottom {
    background-color: #1e1e1e;
    overflow: hidden;
  }

  button {
    margin: 5px auto;
    width: calc(50% - 20px);
    display: block;
    height: 50px;
    background-color: #333;
    color: #e0e0e0;
    border: none;
    border-radius: 5px;

    &:hover {
      background-color: #444;
    }
  }
}

/* 定义过渡效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>