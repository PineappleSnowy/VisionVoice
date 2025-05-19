import { defineStore } from 'pinia';
import { type ChatHistoryItem } from '@/types'
import { AgentType } from '@/types'
export const useUserStore = defineStore('user', {
  state: () => ({
    username:'' as string,
    nickname:'' as string,
    phone:'' as string,
    chatHistory:[] as ChatHistoryItem[],
    selectedAgent:'LIFE_ASSISTANT' as AgentType,
    talkSpeed:8 as number,
    currentSessionId:'' as string,
    isMuted:false as boolean,
  }),
  getters: {
  },
})
