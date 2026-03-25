<template>
  <div class="tag-cloud-page">
    <!-- Tag cloud -->
    <div class="tag-cloud">
      <div v-for="[tag, count] in sortedTags" :key="tag" class="tag-cloud__item">
        <a :href="`#tag-${encodeURIComponent(tag)}`">
          <TagBadge :tag="tag" :active="activeTag === tag" @click.prevent="scrollTo(tag)">
            {{ tag }}
          </TagBadge>
        </a>
        <span class="tag-cloud__count">{{ count }}</span>
      </div>
    </div>

    <!-- Sections per tag -->
    <div
      v-for="[tag] in sortedTags"
      :key="tag"
      :id="`tag-${encodeURIComponent(tag)}`"
      class="tag-section"
    >
      <div class="tag-section__heading">
        <h2>#{{ tag }}</h2>
        <span class="tag-cloud__count">{{ tagMap.get(tag)?.length }}</span>
      </div>
      <PostCard
        v-for="post in tagMap.get(tag)"
        :key="post.url"
        :post="post"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Post } from '../types.js'

const props = defineProps<{ posts: Post[] }>()

const activeTag = ref('')

// Build a map: tag -> posts[]
const tagMap = computed(() => {
  const map = new Map<string, Post[]>()
  for (const post of props.posts) {
    for (const tag of post.tags) {
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag)!.push(post)
    }
  }
  return map
})

// Sort tags by post count descending
const sortedTags = computed<[string, number][]>(() =>
  [...tagMap.value.entries()]
    .map(([tag, arr]) => [tag, arr.length] as [string, number])
    .sort((a, b) => b[1] - a[1])
)

function scrollTo(tag: string) {
  activeTag.value = tag
  const el = document.getElementById(`tag-${encodeURIComponent(tag)}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
