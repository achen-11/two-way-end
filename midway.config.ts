import vue from '@vitejs/plugin-vue';
import { defineConfig } from '@midwayjs/hooks-kit';
import path from 'path';

export default defineConfig({
  vite: {
    plugins: [vue()],
    resolve: {
      // 设置别名
      alias: {
        views: path.resolve(__dirname, 'src/views'),
        styles: path.resolve(__dirname, 'src/styles'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    envDir: './env',
  },
  source: './src/api',
  routes: [{
    baseDir: 'service',
    basePath: '/api'
  }]
});
