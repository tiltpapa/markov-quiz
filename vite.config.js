import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    svelte(),
    nodePolyfills()
  ],
  base: '/markov-quiz/',
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
  },
  server: {
    port: 3000
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'ES2020'
      }
    }
  }
})