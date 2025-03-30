<template>
  <div class="container">
    <HeaderBar return-path="/mine">寻物画廊</HeaderBar>
    <div class="gallery" id="gallery" role="region" aria-label="寻物画廊图片列表">
      <!-- 列表内容 -->
      <div class="gallery-item" v-for="(image, index) in imageList" :key="index" @click="openModal(image)">
        <button>
          <img :src="image.url" :alt="image.name" />
          <p>{{ image.name }}</p>
        </button>
      </div>

    </div>

    <div id="errorMessage" class="error-message" role="alert" aria-live="assertive" style="display: none"></div>

    <PhotoManageModel @close="closeModel" @changeName="changeName" @delete="deleteImage" v-show="isShowModel"
      :image="imageData"></PhotoManageModel>

    <ImageUploadPanel @upload-file="postFile"></ImageUploadPanel>
  </div>


</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import HeaderBar from '@/components/HeaderBar.vue'
import ImageUploadPanel from '@/components/ImageUploadPanel.vue'
import PhotoManageModel from '@/components/PhotoManageModel.vue'
import { type ImageListItem } from "@/types"
import axios from 'axios'
/* 该文件为帮我寻物物品模板管理模块的内容 */
let imageList = ref<ImageListItem[]>([])
let isShowModel = ref(false)
let imageData = ref<ImageListItem>({} as ImageListItem)
onMounted(() => {
  getFile()
})
function postFile(file: File): void {
  const formData = new FormData()
  formData.append('file', file)
  axios.post('/api/galleryImages', formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data',
    },
  })
    .then(
      response => {
        let data = response.data
        if (data.success) {
          // imageList.value = response.data
          console.log('[UserPhotoManage] Success Posting File, ResponseData: ', response.data)
          imageList.value.push({ finish_des: false, url: response.data.image_url, name: response.data.image_name })
        }
      },
      error => {
        console.error('[UserPhotoManage] Error Posting File :', error.response.data.error)
        alert('[UserPhotoManage] Error Posting File :' + error.response.data.error)
      }
    )
}
function getFile(): void {
  axios.get('/api/galleryImages', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })
    .then(
      response => {
        imageList.value = response.data
        console.log('[UserPhotoManage] Success getting File :', response.data)
      },
      error => {
        console.error('[UserPhotoManage] Error Getting File :', error)
      }
    )
}
function changeName(newVal: string, image: ImageListItem): void {
  axios.put('/api/galleryImages', JSON.stringify({ oldName: image.name, newName: newVal }), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }).then(
    response => {
      if (response.data.success) {
        imageList.value.forEach(element => {
          if (element.name === image.name) {
            element.name = newVal
            element.url = response.data.url
            console.log('[UserPhotoManage][changeName] New name: ', newVal, ', New Image Object: ', image)
          }
        })
      }
    },
    error => {
      console.error('[UserPhotoManage][changeName]Error Changing Name: ', error)
    }
  )
}
function deleteImage(image: ImageListItem): void {
  axios.delete('/api/galleryImages', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    data: JSON.stringify({ image_name: image.name })
  }).then(
    response => {
      if (response.data.success) {
        console.log('[UserPhotoManage][deleteImage] Image object: ', image);
        const index = imageList.value.findIndex(item => item.name === image.name)
        if (index !== -1) imageList.value.splice(index, 1)
        closeModel()
      }
    },
    error => {
      console.error('[UserPhotoManage][deleteImage]Error Deleting Image: ', error)
    }
  )
}

// watch(imageList, (newVal) => {
//   console.log('[UserPhotoManage] Detected Change in imageList: ', newVal)
// }, { deep: true })

function closeModel(): void {
  isShowModel.value = false
}
function openModal(image: ImageListItem): void {
  isShowModel.value = true
  imageData.value = image
}
</script>

<style scoped>
.container {
  height: 100%;
  position: relative;
}

.gallery {
  display: flex;
  flex-wrap: wrap;
  height: calc(100vh - 110px);
  width: 100vw;
  justify-content: left;
  overflow: auto;
}

.gallery-item {
  position: relative;
  width: 47vw;
  margin: calc(1vw - 1px);
  text-align: center;
  height: 30vh;
  border: 1px solid #333;
}

.gallery-item button {
  width: 100%;
  height: 100%;
  border: none;
  background: none;
  padding: 0;
  color: #e0e0e0;
}

.gallery-item img {
  max-width: 100%;
  max-height: 100%;
}

.gallery-item p {
  position: absolute;
  bottom: 0;
  width: calc(100% - 10px);
  margin: 0;
  padding: 5px;
  background-color: #121212;
  border-top: 1px solid #333;
  font-size: medium;
}


.error-message {
  position: fixed;
  bottom: 70px;
  /* 确保在footer上方 */
  left: 50%;
  transform: translateX(-50%);
  background-color: transparent;
  color: red;
  padding: 10px;
  border: none;
  z-index: 0;
  text-align: center;
}
</style>
