import { defineConfig, type HeadConfig } from 'vitepress'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_CATEGORY = '其他'
const SITE_URL = 'https://arlott.github.io'
const SITE_TITLE = 'Arlott'
const SITE_DESCRIPTION = '个人博客 · 记录生活、技术与思考'

interface PostMeta {
  title: string
  link: string
  date: string
  description: string
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const result: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    const value = line
      .slice(colonIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (key) result[key] = value
  }
  return result
}

function getAllPostsMeta(): PostMeta[] {
  const postsDir = resolve(__dirname, '../posts')
  const files = readdirSync(postsDir).filter((f) => f.endsWith('.md') && f !== 'index.md')
  return files
    .map((file) => {
      const content = readFileSync(resolve(postsDir, file), 'utf-8')
      const fm = parseFrontmatter(content)
      return {
        title: fm.title || file.replace('.md', ''),
        link: `${SITE_URL}/posts/${file.replace('.md', '')}`,
        date: fm.date || '',
        description: fm.description || '',
      }
    })
    .filter((p) => p.title)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function getPostsSidebar() {
  const postsDir = resolve(__dirname, '../posts')
  const files = readdirSync(postsDir).filter((f) => f.endsWith('.md') && f !== 'index.md')

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

function buildRssFeed(outDir: string) {
  const posts = getAllPostsMeta()
  const items = posts
    .map((p) => {
      const pubDate = p.date ? new Date(p.date).toUTCString() : ''
      return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${p.link}</link>
      <guid>${p.link}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      ${p.description ? `<description><![CDATA[${p.description}]]></description>` : ''}
    </item>`
    })
    .join('\n')

  const lastBuildDate = new Date().toUTCString()
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  writeFileSync(resolve(outDir, 'feed.xml'), feed, 'utf-8')
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,

  sitemap: {
    hostname: SITE_URL,
  },

  buildEnd({ outDir }) {
    buildRssFeed(outDir)
  },

  transformHead({ pageData }) {
    const head: HeadConfig[] = []
    const fm = pageData.frontmatter
    const title = fm.title ? `${fm.title} | ${SITE_TITLE}` : SITE_TITLE
    const description = fm.description || SITE_DESCRIPTION
    const url = `${SITE_URL}/${pageData.relativePath.replace(/\.md$/, '')}`

    head.push(['link', { rel: 'alternate', type: 'application/rss+xml', title: SITE_TITLE, href: `${SITE_URL}/feed.xml` }])
    head.push(['meta', { property: 'og:type', content: fm.title ? 'article' : 'website' }])
    head.push(['meta', { property: 'og:site_name', content: SITE_TITLE }])
    head.push(['meta', { property: 'og:title', content: title }])
    head.push(['meta', { property: 'og:description', content: description }])
    head.push(['meta', { property: 'og:url', content: url }])
    head.push(['meta', { name: 'twitter:card', content: 'summary' }])
    head.push(['meta', { name: 'twitter:title', content: title }])
    head.push(['meta', { name: 'twitter:description', content: description }])

    if (fm.date) {
      head.push(['meta', { property: 'article:published_time', content: fm.date }])
    }

    return head
  },

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '标签', link: '/tags/' },
      { text: '搜索', link: '/search/' },
      { text: 'RSS', link: '/feed.xml' },
    ],

    sidebar: {
      '/posts/': getPostsSidebar(),
    },

    search: {
      provider: 'local',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/Arlott' }],
  },
})
