import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// Pré-carrega a fonte do texto (Roboto Mono, subconjunto latin). O nome do arquivo tem hash, então o link
// é gerado a partir do bundle; sem isso a fonte só é pedida depois do CSS e troca a métrica do texto (CLS).
function preloadFont(): Plugin {
  return {
    name: 'preload-font',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((name) => /roboto-mono-latin-wght-normal-.*\.woff2$/.test(name))
        if (!font) return []
        return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${font}` }, injectTo: 'head' }]
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadFont(),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
