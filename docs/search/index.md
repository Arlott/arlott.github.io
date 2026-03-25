---
title: 搜索
---

<script setup>
import { data as posts } from '../posts.data'
</script>

# 搜索文章

支持按关键词（标题、描述）模糊搜索、按标签筛选、按日期范围过滤。

<BlogSearch :posts="posts" />
