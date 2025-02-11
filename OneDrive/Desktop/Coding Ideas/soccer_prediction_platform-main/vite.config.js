import { defineConfig } from 'vite'

export default defineConfig({
  // Base configuration
  base: './',
  
  // Server options
  server: {
    port: 3000,
    open: true
  },
  
  // Build options
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}) 