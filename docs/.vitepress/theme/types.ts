export interface Post {
  title: string
  url: string
  date: string
  category: string
  tags: string[]
  description: string
  readingTime: number
  related: RelatedPost[]
}

export interface RelatedPost {
  title: string
  url: string
  date: string
}
