<template>
  <span class="tag-badge" :class="{ active }">
    <slot>{{ tag }}</slot>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  tag?: string
  active?: boolean
}>()
</script>
