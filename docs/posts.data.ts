import { createContentLoader } from 'vitepress'
import type { Post, RelatedPost } from './.vitepress/theme/types'

declare const data: Post[]
export { data }
export type { Post }

const WORDS_PER_MINUTE = 300

function estimateReadingTime(content: string): number {
  const text = content.replace(/^---[\s\S]*?---/, '').replace(/[#`*_\[\]()>!]/g, '')
  const charCount = text.replace(/\s/g, '').length
  return Math.max(1, Math.round(charCount / WORDS_PER_MINUTE))
}

function getRelated(
  current: { url: string; tags: string[]; category: string },
  all: { title: string; url: string; date: string; tags: string[]; category: string }[],
  limit = 3,
): RelatedPost[] {
  return all
    .filter((p) => p.url !== current.url)
    .map((p) => {
      const sharedTags = p.tags.filter((t) => current.tags.includes(t)).length
      const sameCategory = p.category === current.category ? 1 : 0
      return { ...p, score: sharedTags * 2 + sameCategory }
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map(({ title, url, date }) => ({ title, url, date }))
}

export default createContentLoader('posts/*.md', {
  includeSrc: true,
  transform(rawData) {
    const base = rawData
      .map((page) => ({
        title: (page.frontmatter.title as string) || '',
        url: page.url,
        date: (page.frontmatter.date as string) || '',
        category: (page.frontmatter.category as string) || '',
        tags: (page.frontmatter.tags as string[]) || [],
        description: (page.frontmatter.description as string) || '',
        readingTime: estimateReadingTime(page.src ?? ''),
      }))
      .filter((post) => post.title)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return base.map((post) => ({
      ...post,
      related: getRelated(post, base),
    }))
  },
})
