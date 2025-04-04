export interface ImageListItem {
  finish_des: boolean
  name: string
  url: string
}
export interface AudioChunk {
  user: string
  index: number
  audioChunk: ArrayBuffer
  taskId: number
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface DetectResultItem {
  class: string
  distance: number
  left: number
  top: number
}
