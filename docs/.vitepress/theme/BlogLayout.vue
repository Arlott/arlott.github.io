<template>
  <Layout>
    <template #doc-after>
      <RelatedPosts />
      <Giscus />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import RelatedPosts from './components/RelatedPosts.vue'
import Giscus from './components/Giscus.vue'

const { Layout } = DefaultTheme
</script>
