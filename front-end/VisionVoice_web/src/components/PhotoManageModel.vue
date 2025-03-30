<template>
  <div id="myModal" class="modal" role="dialog" aria-labelledby="modalTitle" aria-modal="true">
    <div class="modal-content">
      <div class="image-container">
        <img id="modalImage" :src="image.url" :alt="image.name" aria-labelledby="modalImageDescription" />
      </div>
      <input ref="name" type="text" id="imageName" :value="image.name" aria-label="物品名称，请注意修改" />
      <button id="renameButton" aria-label="保存更改" @click="emit('changeName',name.value,image);emit('close')">修改</button>
      <button id="deleteButton" aria-label="删除图片" @click="emit('delete',image)">删除</button>
      <button id="backButton" aria-label="返回" @click="emit('close')">返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const name = ref()

const emit = defineEmits(['close','changeName','delete'])
defineProps(['image'])


</script>

<style scoped>
.modal {
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.8);
  color: #e0e0e0;
  padding-top: 48px;
}

.modal-content {
  background-color: #333;
  margin: 10% auto;
  padding: 5%;
  border: 1px solid #888;
  width: 80%;
  height: 80%;
}

.modal input {
  width: calc(100% - 100px);
  margin-right: 5px;
  margin-bottom: 10px;
  margin-top: 10px;
  padding-left: 8px;
}

.modal button {
  width: 80px;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 65%;
  width: 100%;
  border: 1px solid #888;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
}

.modal-content input,
.modal-content button {
  background-color: #444;
  color: #e0e0e0;
  border: none;
  height: 9%;
  border-radius: 3px;
  font-size: large;
}

.modal-content button:hover {
  background-color: #555;
}

.modal-content button#deleteButton {
  width: 100%;
  background-color: red;
  color: #ffffff;
}

.modal-content button#deleteButton:hover {
  background-color: #a71c1c;
}

.modal-content button#backButton {
  width: 100%;
}

#statusMessage {
  position: fixed;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  background-color: transparent;
  color: red;
  padding: 5px 25px;
  border: none;
  z-index: 4;
  text-align: center;
  font-size: larger;
}

#backButton {
  display: block;
  margin-top: 10px
}
</style>