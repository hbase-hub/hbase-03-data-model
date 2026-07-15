import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/hbase-03-data-model/',
  server: {
    port: 54303,
  },
})
