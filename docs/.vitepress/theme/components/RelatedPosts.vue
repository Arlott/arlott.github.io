<template>
  <div v-if="relatedPosts.length" class="related-posts">
    <h3 class="related-posts__title">相关文章</h3>
    <ul class="related-posts__list">
      <li v-for="post in relatedPosts" :key="post.url" class="related-posts__item">
        <a :href="withBase(post.url)" class="related-posts__link">{{ post.title }}</a>
        <span v-if="post.date" class="related-posts__date">{{ formatDate(post.date) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { withBase, useData } from 'vitepress'
import { data as posts } from '../../../posts.data'

const { page } = useData()

const relatedPosts = computed(() => {
  const current = posts.find((p) => p.url === page.value.relativePath.replace(/\.md$/, '/'))
  return current?.related ?? []
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>
