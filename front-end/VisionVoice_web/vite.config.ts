import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VueSetupExtend(),
  ],
  resolve: {
    alias: {
      // '@': fileURLToPath(new URL('./src', import.meta.url))
      '@': path.resolve(__dirname, 'src')
    },
  },
  server: {
    proxy: {
      '/api': {  // 拦截所有以/api开头的请求
        target: 'http://localhost:8000', // 后端真实地址（如 http://localhost:3000）
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''), // 去除路径中的/api前缀
      },
    },
  },
})
