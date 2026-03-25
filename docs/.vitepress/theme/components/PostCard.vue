<template>
  <div class="post-card">
    <div class="post-card__header">
      <a :href="withBase(post.url)" class="post-card__title">{{ post.title }}</a>
    </div>
    <div class="post-card__meta">
      <span v-if="post.date">📅 {{ formatDate(post.date) }}</span>
      <span v-if="post.category" class="post-card__category">{{ post.category }}</span>
    </div>
    <p v-if="post.description" class="post-card__description">{{ post.description }}</p>
    <div v-if="post.tags && post.tags.length" class="post-card__tags">
      <TagBadge v-for="t in post.tags" :key="t" :tag="t">{{ t }}</TagBadge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import type { Post } from '../types.js'

defineProps<{ post: Post }>()

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
