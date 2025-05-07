import { defineStore } from 'pinia';


export const useUserStore = defineStore('user', {
  state: () => ({
    // username:'',
    chatHistory:[]
  }),
  getters: {
    // doubleCount: (state) => state.count * 2,
  },
})
