export interface ImageListItem {
  finish_des: boolean
  name: string
  url: string
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp:string
}

export interface DetectResultItem {
  class: string
  distance: number
  left: number
  top: number
}

export enum AgentType {
  LIFE_ASSISTANT = 'LIFE_ASSISTANT',
  PSYCHOLOGIST = 'PSYCHOLOGIST'
}