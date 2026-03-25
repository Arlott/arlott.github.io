import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Arlott',
  description: '前端技术博客 · React · Vue · TypeScript · 性能优化',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '标签', link: '/tags/' },
      { text: '搜索', link: '/search/' },
    ],

    sidebar: {
      '/posts/': [
        {
          text: '框架原理',
          items: [
            { text: 'React Hooks 深度解析', link: '/posts/react-hooks-deep-dive' },
            { text: 'Vue 3 Composition API 实践', link: '/posts/vue3-composition-api' },
          ],
        },
        {
          text: '工程化',
          items: [
            { text: 'TypeScript 前端最佳实践', link: '/posts/typescript-best-practices' },
            { text: 'Webpack vs Vite 构建工具对比', link: '/posts/webpack-vs-vite' },
          ],
        },
        {
          text: '性能优化',
          items: [
            { text: '前端性能优化：从加载到渲染', link: '/posts/frontend-performance-optimization' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Arlott' },
    ],
  },
})
