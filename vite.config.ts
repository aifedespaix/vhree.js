import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Vhree',
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vue', 'three'],
      output: { globals: { vue: 'Vue', three: 'THREE' } }
    },
    sourcemap: true
  }
})
