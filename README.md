# Arlott 的个人博客

基于 [VitePress](https://vitepress.dev/) 构建的个人技术博客，涵盖 AI、前端工程化和框架原理等方向。

🌐 **在线地址**：[arlott.github.io](https://arlott.github.io)

## 功能特性

- 📝 按分类和标签整理的文章体系
- 🔍 全文搜索（支持关键词、标签过滤、日期范围）
- 🏷️ 标签云页面，可按标签浏览文章
- 🌙 自动跟随系统的深色/浅色模式
- 🚀 GitHub Actions 自动构建并部署到 GitHub Pages

## 本地开发

**环境要求**：Node.js 18+、[pnpm](https://pnpm.io/)

```bash
# 安装依赖
pnpm install

# 启动开发服务器（http://localhost:5173）
pnpm docs:dev

# 构建生产版本
pnpm docs:build

# 预览生产构建
pnpm docs:preview
```

## 新增文章

在 `docs/posts/` 目录下创建 Markdown 文件，添加以下 frontmatter：

```yaml
---
title: "文章标题"
date: "YYYY-MM-DD"
category: "分类名称"
tags: ["标签1", "标签2"]
description: "文章简介，显示在文章列表和搜索结果中"
---
```

文章保存后，侧边栏和文章列表会自动更新。

## 部署

推送到 `master` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

