import { defineConfig } from 'vitepress'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_CATEGORY = '其他'

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const result: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '')
    if (key) result[key] = value
  }
  return result
}

function getPostsSidebar() {
  const postsDir = resolve(__dirname, '../posts')
  const files = readdirSync(postsDir).filter(
    (f) => f.endsWith('.md') && f !== 'index.md',
  )

  const posts = files
    .map((file) => {
      const content = readFileSync(resolve(postsDir, file), 'utf-8')
      const fm = parseFrontmatter(content)
      return {
        text: fm.title || file.replace('.md', ''),
        link: `/posts/${file.replace('.md', '')}`,
        date: fm.date || '',
        category: fm.category || DEFAULT_CATEGORY,
      }
    })
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))

  const categories = new Map<string, { text: string; link: string }[]>()
  for (const { text, link, category } of posts) {
    if (!categories.has(category)) categories.set(category, [])
    categories.get(category)!.push({ text, link })
  }

  return Array.from(categories.entries()).map(([text, items]) => ({
    text,
    items,
  }))
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Arlott',
  description: '个人博客 · 记录生活、技术与思考',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '标签', link: '/tags/' },
      { text: '搜索', link: '/search/' },
    ],

    sidebar: {
      '/posts/': getPostsSidebar(),
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Arlott' },
    ],
  },
})
