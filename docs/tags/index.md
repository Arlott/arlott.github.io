---
title: 标签
---

<script setup>
import { data as posts } from '../posts.data'
</script>

# 标签

浏览所有文章标签，点击标签跳转到对应分类。

<TagCloud :posts="posts" />
