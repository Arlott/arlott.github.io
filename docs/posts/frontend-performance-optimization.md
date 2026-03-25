---
title: "前端性能优化：从加载到渲染"
date: "2025-12-20"
category: "性能优化"
tags: ["performance", "javascript", "css", "webpack", "vite"]
description: "系统梳理前端性能优化的完整链路，从网络加载、资源优化到渲染性能，结合 Core Web Vitals 指标提供可落地的优化方案。"
---

# 前端性能优化：从加载到渲染

前端性能直接影响用户体验和业务转化率。研究表明，页面加载时间每延迟 1 秒，转化率可能下降 7%。本文将系统梳理前端性能优化的完整链路。

## Core Web Vitals：Google 的性能度量标准

Google 定义了三个核心 Web 指标，直接影响搜索排名：

| 指标 | 全称 | 衡量 | 优秀阈值 |
|------|------|------|---------|
| **LCP** | Largest Contentful Paint | 最大内容渲染时间 | ≤ 2.5s |
| **INP** | Interaction to Next Paint | 交互响应延迟 | ≤ 200ms |
| **CLS** | Cumulative Layout Shift | 累计布局偏移 | ≤ 0.1 |

```javascript
// 使用 web-vitals 库测量
import { getLCP, getINP, getCLS } from 'web-vitals'

getLCP(metric => console.log('LCP:', metric.value))
getINP(metric => console.log('INP:', metric.value))
getCLS(metric => console.log('CLS:', metric.value))
```

## 网络层优化

### 1. 资源预加载与预连接

```html
<!-- 预连接到第三方域名（CDN、API） -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- 预加载关键资源（LCP 图片、字体） -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/hero-image.webp" as="image" />

<!-- 预获取下一页可能需要的资源 -->
<link rel="prefetch" href="/next-page-data.json" />
```

### 2. HTTP/2 与资源合并策略

HTTP/2 多路复用使得每个资源单独请求的成本降低，但过多小文件仍会带来 header 开销。现代构建工具（Vite/Webpack）会自动做合理的代码分割。

### 3. 缓存策略

```nginx
# 不可变的哈希文件：永久缓存
location ~* \.(js|css|woff2)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML：不缓存（或短时间缓存）
location ~* \.html$ {
  add_header Cache-Control "no-cache";
}
```

## 代码分割与懒加载

### 路由级别懒加载

```javascript
// React Router v6
const LazyPage = lazy(() => import('./pages/HeavyPage'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/heavy" element={<LazyPage />} />
      </Routes>
    </Suspense>
  )
}
```

```javascript
// Vue Router
const routes = [
  {
    path: '/heavy',
    component: () => import('./views/HeavyView.vue'),
  }
]
```

### 组件级懒加载

```javascript
// 仅在需要时加载重量级组件（如图表库）
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))

// 懒加载 + 预获取
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: SkeletonLoader,
  delay: 200,       // 避免 loading 闪烁
  timeout: 5000,
})
```

## 图片优化

图片通常占页面体积的 60% 以上，是最重要的优化对象。

### 格式选择

| 格式 | 适用场景 | 压缩率 |
|------|----------|--------|
| WebP | 通用（照片、图形） | 比 JPEG 小 25-35% |
| AVIF | 最新浏览器，极致压缩 | 比 JPEG 小 50% |
| SVG | 图标、简单图形 | 矢量，无限缩放 |
| JPEG | 照片（兼容性要求高） | - |

```html
<!-- 使用 picture 元素提供多格式回退 -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero Image" width="1200" height="630" />
</picture>
```

### 懒加载图片

```html
<!-- 原生懒加载（现代浏览器广泛支持） -->
<img src="below-fold.webp" alt="..." loading="lazy" decoding="async" />
```

### 响应式图片

```html
<img
  src="image-800.webp"
  srcset="image-400.webp 400w, image-800.webp 800w, image-1200.webp 1200w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px"
  alt="响应式图片示例"
/>
```

## JavaScript 性能

### 减少主线程阻塞

长任务（>50ms）会阻塞主线程，导致页面卡顿。优化策略：

```javascript
// 分批处理大量数据，使用 scheduler.yield() 让出主线程
async function processLargeList(items) {
  const results = []
  for (let i = 0; i < items.length; i++) {
    results.push(processItem(items[i]))
    // 每处理 100 个让出一次主线程
    if (i % 100 === 0 && 'scheduler' in window) {
      await scheduler.yield()
    }
  }
  return results
}

// 使用 Web Worker 处理 CPU 密集型任务
const worker = new Worker(new URL('./heavy-worker.js', import.meta.url))
worker.postMessage({ data: largeDataSet })
worker.onmessage = (e) => setResult(e.data)
```

### Tree Shaking

确保你的代码和依赖支持 tree shaking：

```javascript
// ❌ 导入整个库，无法 tree shake
import _ from 'lodash'
const result = _.cloneDeep(obj)

// ✅ 按需导入
import { cloneDeep } from 'lodash-es'
const result = cloneDeep(obj)
```

## CSS 性能

### 避免 Layout Shift（改善 CLS）

```css
/* 为图片和视频预留空间，避免 CLS */
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;  /* 现代浏览器支持 */
}

/* 字体加载策略：使用 font-display: optional 避免 FOUT */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: optional;
}
```

### 关键 CSS 内联

将首屏所需 CSS 内联在 `<head>` 中，其余异步加载：

```html
<head>
  <style>/* critical CSS here */</style>
  <link rel="preload" href="non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
</head>
```

## 性能监控

```javascript
// Performance Observer：监控 LCP、CLS、资源加载
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP element:', entry.element)
      console.log('LCP time:', entry.startTime)
    }
  }
})
observer.observe({ type: 'largest-contentful-paint', buffered: true })
```

## 优化清单

- [ ] 开启 Brotli/Gzip 压缩
- [ ] 为静态资源配置强缓存（Cache-Control: immutable）
- [ ] 关键图片使用 `<link rel="preload">`
- [ ] 图片转换为 WebP/AVIF 格式
- [ ] 路由级代码分割（React.lazy / Vue defineAsyncComponent）
- [ ] 第三方脚本异步/延迟加载（`async`/`defer`）
- [ ] 内联关键 CSS
- [ ] 使用 `loading="lazy"` 懒加载屏幕外图片
- [ ] 消除 Layout Shift（为图片设置 aspect-ratio）
- [ ] 用 Lighthouse / WebPageTest 定期审计性能

性能优化没有银弹，核心是**度量 → 分析 → 优化 → 验证**的循环迭代。先用工具确定瓶颈所在，再有针对性地优化，避免过早优化浪费精力。
