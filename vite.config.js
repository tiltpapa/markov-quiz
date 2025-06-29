import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import fs from 'fs'
import path from 'path'

// カスタムプラグイン: src/dataから静的ファイルにコピー
const copyDataPlugin = () => ({
  name: 'copy-data',
  generateBundle() {
    const srcDataDir = path.join(process.cwd(), 'src', 'data')
    const staticDataDir = path.join(process.cwd(), 'static', 'data')
    
    // static/dataディレクトリを作成
    if (!fs.existsSync(staticDataDir)) {
      fs.mkdirSync(staticDataDir, { recursive: true })
    }
    
    // src/dataからstatic/dataにファイルをコピー
    if (fs.existsSync(srcDataDir)) {
      const files = fs.readdirSync(srcDataDir)
      files.forEach(file => {
        const srcFile = path.join(srcDataDir, file)
        const destFile = path.join(staticDataDir, file)
        fs.copyFileSync(srcFile, destFile)
      })
    }
  }
})

export default defineConfig({
  plugins: [
    svelte(),
    nodePolyfills(),
    copyDataPlugin()
  ],
  base: process.env.NODE_ENV === 'production' ? '/markov-quiz/' : '/',
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
  },
  publicDir: 'static'
})