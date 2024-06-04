import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      // { importStyle: "less" }
      resolvers: [AntDesignVueResolver({
        resolveIcons: true,
        cjs: true,
        importStyle: false
      })]
    })
    
  ],
  server: {
    hmr:true,     //启动热更新
    port: 8082,    //自定义启动时的端口
    open: true,   //vite项目在启动时自动打开浏览器 
    proxy:{
      '/upload': {
        target: 'http://localhost:8362',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/upload/, '/upload')
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

