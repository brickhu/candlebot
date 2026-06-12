import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidPlugin(),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // 保持 content.js 名称固定，方便 manifest 引用
          return chunkInfo.name === 'content' ? 'content.js' : 'assets/[name].js';
        },
      },
    },
  },
});