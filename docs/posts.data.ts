import { createContentLoader } from 'vitepress'
import type { Post } from './.vitepress/theme/types'

declare const data: Post[]
export { data }
export type { Post }

export default createContentLoader('posts/*.md', {
  transform(rawData) {
    return rawData
      .map((page) => ({
        title: (page.frontmatter.title as string) || '',
        url: page.url,
        date: (page.frontmatter.date as string) || '',
        category: (page.frontmatter.category as string) || '',
        tags: (page.frontmatter.tags as string[]) || [],
        description: (page.frontmatter.description as string) || '',
      }))
      .filter((post) => post.title)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
  },
})
