import axios from 'axios'

// 创建一个 axios 实例
const instance = axios.create({
  timeout: 5000, // 设置超时时间为 5 秒
  baseURL: '/api'
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从本地存储中获取 JWT 令牌
    const token = localStorage.getItem('token')
    if (token) {
      // 将 JWT 令牌添加到请求头
      config.headers['Authorization'] = `Bearer ${token}`
    }
    // 在发送请求之前做些什么
    return config
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error)
  }
)

export default instance
