import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: '0.0.0.0', // Allows the server to be accessed via local DNS aliases like BFopsHR
    allowedHosts: ['bfopshr', 'BFopsHR'], // Explicitly allow the new custom host
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
