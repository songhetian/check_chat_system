import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // 确保 Electron 能正确加载相对路径下的资源
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome114', // 匹配 Electron 的 Chromium 版本
    minify: 'terser', // 使用 terser 进行极致压缩，降低运行内存占用
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console，提升性能
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
