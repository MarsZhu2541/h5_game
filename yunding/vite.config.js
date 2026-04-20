import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 源码里用 /static/（开发时 public 挂在站点根）。构建产物部署在子路径下时把 /static/ 换成 {base}static/。 */
function prefixPublicStaticOnBuild(base) {
  return {
    name: 'prefix-public-static-on-build',
    apply: 'build',
    transformIndexHtml(html) {
      if (base === '/' || base === '') return html
      const b = base.endsWith('/') ? base.slice(0, -1) : base
      return html
        .replace(/href="\/static\//g, `href="${b}/static/`)
        .replace(/src="\/static\//g, `src="${b}/static/`)
    },
  }
}

const base = '/yunding/'

export default defineConfig({
  // 与 Docker/nginx 中部署路径一致：整站根目录下的 /yunding/
  // 若云顶单独占域名根路径，改为 base: '/' 并同步改下面常量
  base,
  plugins: [vue(), prefixPublicStaticOnBuild(base)],
  server: {
    port: 5173,
  },
})
