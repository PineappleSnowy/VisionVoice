<template>
  <HeaderBar :show-button="false">有声相册</HeaderBar>
  <div class="container">

    <div class="imageList" aria-label="图片列表" role="region">

      <div class="image" aria-label="图片" tabindex="-1" @click="router.replace('/album/photoChat')" @focus="playDescriptionAudio">
        <img src="" alt="20250331141220_0_81705" aria-label="第1次上传的第1张照片，点击朗读">
        <div>正在解析</div>
      </div>



    </div>
    
    <ImageUploadPanel></ImageUploadPanel>
  </div>


</template>

<script setup lang="ts">
import {ref} from 'vue';
import { useRouter } from 'vue-router';
import HeaderBar from '@/components/HeaderBar.vue'
import ImageUploadPanel from '@/components/ImageUploadPanel.vue'
const router = useRouter()


function playDescriptionAudio(){

}

</script>
<style scoped lang="less">
.container {
  display: flex;
  height: calc(100vh - 100px);
  width: 100vw;
  position: relative;

  .imageList {
    display: flex;
    width: 100vw;
    height: calc(100vh - 160px);
    overflow: auto;
    scrollbar-width: none;
    flex-wrap: wrap;
    align-content: flex-start;

    .image {
      width: 48vw;
      margin: calc(1vw - 1px);
      text-align: center;
      height: 30vh;
      border: 1px solid #333;

      img {
        width: 100%;
      }

    }
  }


}
</style>