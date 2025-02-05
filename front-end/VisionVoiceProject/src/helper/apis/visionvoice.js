import $ajax from '../ajax'

/**
 * @desc 
 * 已将 $apis 挂载在 global，可以通过如下方式进行调用：
 * $apis.example.getApi().then().catch().finally()
 */
const baseUrl = 'https://pineapplesnowy.cn'
// const baseUrl = $server_url

export default {
  /**
   * params:
   * - data
   * - header
   */
  async login(params) {
    return $ajax.post(`${baseUrl}/login`, params)
  },
  async register(params) {
    return $ajax.post(`${baseUrl}/register`, params)
  },
  async verifyToken(params) {
    console.log("[visionvoice][verifyToken] params:", params);
    return $ajax.post(`${baseUrl}/verify-token`, params)
  }
}

