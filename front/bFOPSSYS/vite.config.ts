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
    allowedHosts: ['bfopshr', 'BFopsHR', '192.214.54.89', '192.214.54.88'], // Explicitly allow the new custom host and IP
    proxy: {
      '/api': 'http://192.214.54.88:8000', // Redirect API calls to the PC hosting the Django server
    },
  },
})
