<template>
  <div class="post-list-page">
    <p class="post-list__count">共 {{ posts.length }} 篇文章</p>
    <PostCard v-for="post in posts" :key="post.url" :post="post" />
  </div>
</template>

<script setup lang="ts">
import type { Post } from '../types.js'

defineProps<{ posts: Post[] }>()
</script>
