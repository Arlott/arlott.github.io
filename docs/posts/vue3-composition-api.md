---
title: "Vue 3 Composition API 实践指南"
date: "2025-11-25"
category: "框架原理"
tags: ["vue3", "composition-api", "typescript"]
description: "全面讲解 Vue 3 Composition API 的核心概念与实战技巧，包括 ref/reactive 的选择、composables 的设计模式，以及与 TypeScript 的深度集成。"
---

# Vue 3 Composition API 实践指南

Vue 3 的 Composition API 是 Vue 生态最重要的进化之一。它不仅解决了 Options API 在大型组件中代码组织混乱的问题，还为 TypeScript 的类型推断提供了天然的支持。

## 为什么从 Options API 迁移？

Options API 的本质是按**选项类型**（data、methods、computed、watch）组织代码，当组件逻辑复杂时，同一功能的代码会分散在多个选项块中：

```javascript
// Options API：用户搜索功能散落在各处
export default {
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      isLoading: false,
    }
  },
  methods: {
    async search() { /* ... */ }
  },
  watch: {
    searchQuery: 'search'
  }
}
```

Composition API 将同一功能的代码**集中在一起**，并且可以提取为独立的 composable 函数：

```typescript
// Composition API：搜索逻辑自成一体
function useSearch() {
  const searchQuery = ref('')
  const searchResults = ref([])
  const isLoading = ref(false)

  async function search() { /* ... */ }
  watch(searchQuery, search)

  return { searchQuery, searchResults, isLoading }
}
```

## `<script setup>` 语法糖

`<script setup>` 是 Composition API 的编译时语法糖，是目前推荐的单文件组件写法：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 顶层声明自动暴露给模板
const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">{{ count }} (doubled: {{ doubled }})</button>
</template>
```

相比 `setup()` 函数，`<script setup>` 无需手动 `return`，编译后性能更好，且类型推断更完整。

## ref vs reactive：如何选择？

这是 Composition API 中最常见的疑问。

### ref

- 适合**原始值**（string、number、boolean）
- 也可以包裹**对象**（当你需要替换整个对象时）
- 在 `<template>` 中自动解包（不需要 `.value`）

```typescript
const count = ref(0)
const user = ref<User | null>(null)

// JS 中需要 .value，模板中不需要
count.value++
user.value = { name: 'Alice', age: 28 }
```

### reactive

- 适合有**多个相关字段**的对象状态
- 直接返回响应式代理，无需 `.value`
- **不能替换整个对象**（会丢失响应性）

```typescript
const state = reactive({
  name: '',
  age: 0,
  email: '',
})

// ✅ 修改属性
state.name = 'Alice'

// ❌ 替换整个对象会丢失响应性！
// state = { name: 'Bob', age: 30, email: '...' }

// ✅ 应使用 Object.assign
Object.assign(state, { name: 'Bob', age: 30 })
```

::: tip 实践建议
简单场景用 `ref`，多字段表单或复杂嵌套对象用 `reactive`。统一使用 `ref` 也是一种常见风格，避免在 `ref` 和 `reactive` 之间切换。
:::

## computed 与 watch

### computed

```typescript
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// 可写的 computed
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (val) => {
    [firstName.value, lastName.value] = val.split(' ')
  },
})
```

### watch vs watchEffect

| 特性 | `watch` | `watchEffect` |
|------|---------|---------------|
| 惰性执行 | 默认惰性 | 立即执行一次 |
| 明确依赖 | 手动指定监听源 | 自动追踪依赖 |
| 旧值访问 | 可获取新旧值 | 不可获取旧值 |
| 适用场景 | 需要对比变化 | 副作用跟随响应式状态 |

```typescript
// watch：精确监听，可获取旧值
watch(userId, async (newId, oldId) => {
  console.log(`从 ${oldId} 切换到 ${newId}`)
  userData.value = await fetchUser(newId)
})

// watchEffect：自动追踪，类似 React useEffect
watchEffect(async () => {
  // 自动追踪 userId.value 和 searchQuery.value
  results.value = await fetchResults(userId.value, searchQuery.value)
})
```

## Composables：逻辑复用的核心

Composable 是 Composition API 的杀手级特性，相当于 React 的自定义 Hook。

### 设计原则

1. **命名以 `use` 开头**：`useMousePosition`、`useFetch`
2. **返回响应式引用**，而非原始值
3. **可选地接受参数**（ref 或普通值均可，用 `toRef` / `toValue` 处理）
4. **在 `<script setup>` 或 `setup()` 中调用**，不在普通函数中调用

```typescript
// composables/useMousePosition.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMousePosition() {
  const x = ref(0)
  const y = ref(0)

  function update(e: MouseEvent) {
    x.value = e.pageX
    y.value = e.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

### 与 TypeScript 的集成

Vue 3 对 TypeScript 的支持已达到一流水准，`defineProps` 和 `defineEmits` 支持纯类型声明：

```typescript
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = defineProps<Props>()

// 带默认值：使用 withDefaults
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  items: () => [],
})

const emit = defineEmits<{
  change: [value: string]
  submit: [data: { name: string; email: string }]
}>()
</script>
```

## provide / inject：跨层级依赖注入

避免 prop 逐层传递（prop drilling）的利器：

```typescript
// 父组件 / 祖先组件
import { provide, ref } from 'vue'

const theme = ref('light')
provide('theme', { theme, toggleTheme })

// 子孙组件
import { inject } from 'vue'
import type { Ref } from 'vue'

const { theme } = inject<{ theme: Ref<string>; toggleTheme: () => void }>('theme')!
```

::: tip 类型安全的 provide/inject
使用 `InjectionKey` 可以在提供与注入之间共享类型：

```typescript
// keys.ts
import type { InjectionKey, Ref } from 'vue'
export const themeKey: InjectionKey<Ref<string>> = Symbol('theme')

// 提供侧
provide(themeKey, theme)

// 注入侧（自动推断为 Ref<string>）
const theme = inject(themeKey)
```
:::

## 总结

Vue 3 Composition API 的核心价值：

- **逻辑复用**：composable 比 mixin 更清晰、无命名冲突
- **代码组织**：按功能聚合而非按选项分散
- **TypeScript 友好**：天然支持类型推断
- **更小的生产包**：tree-shaking 更友好

建议新项目全面采用 `<script setup>` + TypeScript + composables 的组合，这是目前最主流的 Vue 3 开发模式。
