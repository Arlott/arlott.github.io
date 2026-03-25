import DefaultTheme from 'vitepress/theme'
import TagBadge from './components/TagBadge.vue'
import PostCard from './components/PostCard.vue'
import PostList from './components/PostList.vue'
import BlogSearch from './components/BlogSearch.vue'
import TagCloud from './components/TagCloud.vue'
import './style.css'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TagBadge', TagBadge)
    app.component('PostCard', PostCard)
    app.component('PostList', PostList)
    app.component('BlogSearch', BlogSearch)
    app.component('TagCloud', TagCloud)
  },
} satisfies Theme
