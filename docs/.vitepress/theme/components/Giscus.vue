<template>
  <div v-if="isPost" ref="giscusContainer" class="giscus-wrapper" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { isDark, page } = useData()
const route = useRoute()
const giscusContainer = ref<HTMLElement | null>(null)

const isPost = computed(() => page.value.relativePath.startsWith('posts/'))

function loadGiscus() {
  if (!giscusContainer.value) return
  giscusContainer.value.innerHTML = ''
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'Arlott/arlott.github.io')
  script.setAttribute('data-repo-id', '')
  script.setAttribute('data-category', 'Announcements')
  script.setAttribute('data-category-id', '')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('crossorigin', 'anonymous')
  script.async = true
  giscusContainer.value.appendChild(script)
}

function updateTheme() {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (!iframe) return
  iframe.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: isDark.value ? 'dark' : 'light' } } },
    'https://giscus.app',
  )
}

onMounted(loadGiscus)
watch(() => route.path, loadGiscus)
watch(isDark, updateTheme)
</script>

<style scoped>
.giscus-wrapper {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
