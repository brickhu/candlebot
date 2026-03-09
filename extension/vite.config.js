import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' assert { type: 'json' }
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    solid(),
    crx({ manifest }),
    tailwindcss(),
  ],
  build: {
    target: 'esnext',
    minify: false,
    outDir: 'dist',
  }
})
