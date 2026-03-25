<template>
  <div class="blog-search-page">
    <div class="blog-search__controls">
      <!-- Text search -->
      <div class="blog-search__input-wrap">
        <input
          v-model="query"
          class="blog-search__input"
          type="text"
          placeholder="搜索文章标题、描述、内容…"
          aria-label="搜索"
        />
        <button v-if="query" class="blog-search__clear" @click="query = ''" aria-label="清空">✕</button>
      </div>

      <!-- Tag filter -->
      <div class="blog-search__filter-row">
        <span class="blog-search__filter-label">标签：</span>
        <TagBadge
          v-for="tag in allTags"
          :key="tag"
          :tag="tag"
          :active="selectedTags.includes(tag)"
          @click="toggleTag(tag)"
          style="cursor:pointer"
        >{{ tag }}</TagBadge>
      </div>

      <!-- Date range -->
      <div class="blog-search__date-row">
        <span class="blog-search__filter-label">日期：</span>
        <input
          v-model="dateFrom"
          class="blog-search__date-input"
          type="date"
          aria-label="开始日期"
        />
        <span class="blog-search__date-sep">—</span>
        <input
          v-model="dateTo"
          class="blog-search__date-input"
          type="date"
          aria-label="结束日期"
        />
        <button
          v-if="hasFilters"
          class="blog-search__clear-filters"
          @click="clearAll"
        >清除所有筛选</button>
      </div>
    </div>

    <!-- Results info -->
    <p class="blog-search__results-info">
      找到 <strong>{{ filtered.length }}</strong> 篇文章
      <template v-if="hasFilters">（共 {{ posts.length }} 篇）</template>
    </p>

    <!-- Results -->
    <template v-if="filtered.length">
      <PostCard v-for="post in filtered" :key="post.url" :post="post" />
    </template>
    <div v-else class="blog-search__empty">
      <div class="blog-search__empty-icon">🔍</div>
      <p>没有找到匹配的文章，请尝试修改搜索条件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Post } from '../types.js'

const props = defineProps<{ posts: Post[] }>()

const query = ref('')
const selectedTags = ref<string[]>([])
const dateFrom = ref('')
const dateTo = ref('')

// Collect all unique tags from all posts
const allTags = computed(() => {
  const set = new Set<string>()
  for (const post of props.posts) {
    for (const tag of post.tags) set.add(tag)
  }
  return [...set].sort()
})

const hasFilters = computed(
  () => query.value || selectedTags.value.length > 0 || dateFrom.value || dateTo.value
)

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx === -1) selectedTags.value.push(tag)
  else selectedTags.value.splice(idx, 1)
}

function clearAll() {
  query.value = ''
  selectedTags.value = []
  dateFrom.value = ''
  dateTo.value = ''
}

// Fuzzy search: split query into words, each word must appear somewhere in post
function matchesQuery(post: Post, terms: string[]): boolean {
  if (!terms.length) return true
  const haystack = [post.title, post.description, post.category, ...post.tags]
    .join(' ')
    .toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

const filtered = computed(() => {
  const terms = query.value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  const from = dateFrom.value ? new Date(dateFrom.value).getTime() : 0
  const to = dateTo.value ? new Date(dateTo.value).getTime() + 86400000 : Infinity

  return props.posts.filter((post) => {
    if (!matchesQuery(post, terms)) return false

    if (
      selectedTags.value.length > 0 &&
      !selectedTags.value.every((t) => post.tags.includes(t))
    )
      return false

    if (post.date) {
      const ts = new Date(post.date).getTime()
      if (ts < from || ts > to) return false
    }

    return true
  })
})
</script>
