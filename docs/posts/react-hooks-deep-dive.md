---
title: "React Hooks 深度解析：从原理到最佳实践"
date: "2025-11-10"
category: "框架原理"
tags: ["react", "hooks", "javascript"]
description: "深入剖析 React Hooks 的工作机制，涵盖 useState、useEffect、useCallback、useMemo 及自定义 Hook 的最佳实践与常见陷阱。"
---

# React Hooks 深度解析：从原理到最佳实践

React Hooks 自 16.8 版本发布以来，彻底改变了 React 的编程模型。本文将深入剖析常用 Hooks 的工作原理，并总结工程实践中的经验与陷阱。

## 为什么需要 Hooks？

在 Hooks 出现之前，复用状态逻辑的方式主要依赖高阶组件（HOC）和 Render Props，这两种方式会带来"嵌套地狱"（wrapper hell）和难以追踪的组件层级。类组件中的生命周期方法也经常将毫无关联的逻辑混杂在一起：

```jsx
// 类组件时代：订阅与计时器逻辑混入同一个 componentDidMount
componentDidMount() {
  this.props.store.subscribe(this.handleChange)
  this.timerID = setInterval(() => this.tick(), 1000)
}
```

Hooks 的本质是**将状态逻辑从组件树中抽离**，使其可以独立测试和复用，而无需改变组件结构。

## useState：状态管理

### 函数式更新

当新状态依赖旧状态时，应始终使用函数式更新，避免闭包陷阱：

```jsx
// ❌ 存在闭包陷阱
const [count, setCount] = useState(0)
setTimeout(() => setCount(count + 1), 1000) // count 可能已过期

// ✅ 函数式更新，始终使用最新值
setTimeout(() => setCount(c => c + 1), 1000)
```

### 惰性初始化

如果初始状态需要复杂计算，可以传入函数，确保只在首次渲染时执行：

```jsx
// ❌ 每次渲染都会调用 expensiveCompute()
const [state, setState] = useState(expensiveCompute())

// ✅ 仅在初始化时调用一次
const [state, setState] = useState(() => expensiveCompute())
```

### 批量更新

React 18 引入了**自动批处理（Automatic Batching）**，在异步操作（setTimeout、Promise、原生事件）中的多次 setState 也会被合并为一次渲染：

```jsx
// React 18：以下两次 setState 只触发一次渲染
setTimeout(() => {
  setCount(c => c + 1)
  setFlag(f => !f)
}, 0)
```

## useEffect：副作用管理

### 依赖数组的三种模式

| 写法 | 触发时机 |
|------|----------|
| `useEffect(fn)` | 每次渲染后 |
| `useEffect(fn, [])` | 仅挂载后（componentDidMount） |
| `useEffect(fn, [a, b])` | 挂载后及 `a` 或 `b` 变化后 |

### 清理函数

清理函数用于避免内存泄漏，在组件卸载或下次 effect 执行前调用：

```jsx
useEffect(() => {
  const controller = new AbortController()

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(setData)

  return () => controller.abort() // 清理：取消未完成的请求
}, [id])
```

### 常见陷阱：过时的闭包

```jsx
// ❌ 每隔 1 秒打印的永远是初始值 0
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000)
  return () => clearInterval(id)
}, []) // 遗漏了 count 依赖

// ✅ 方案一：添加依赖（会重新创建 interval）
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000)
  return () => clearInterval(id)
}, [count])

// ✅ 方案二：使用 ref 保存最新值，无需重建 interval
const countRef = useRef(count)
useEffect(() => { countRef.current = count }, [count])
useEffect(() => {
  const id = setInterval(() => console.log(countRef.current), 1000)
  return () => clearInterval(id)
}, [])
```

## useCallback 与 useMemo

### 何时使用 useCallback

`useCallback` 返回一个记忆化的函数引用，主要用于：

1. 将函数传给经 `React.memo` 包裹的子组件，避免不必要的重渲染
2. 函数被其他 Hook 的依赖数组引用

```jsx
// 未使用 useCallback：每次父组件渲染，handleClick 引用都会变化
// 导致 ExpensiveChild 也重新渲染（即使用了 React.memo）
const handleClick = useCallback(() => {
  doSomething(id)
}, [id]) // 只有 id 变化时才创建新函数
```

### 何时使用 useMemo

`useMemo` 缓存计算结果，避免在每次渲染时进行昂贵的运算：

```jsx
const sortedList = useMemo(
  () => items.slice().sort((a, b) => a.value - b.value),
  [items] // items 不变则跳过排序
)
```

::: warning 不要过度优化
`useCallback`/`useMemo` 本身有执行成本（对比引用、存储旧值）。对于轻量计算或不传给子组件的函数，不必使用它们。先写出正确代码，再根据性能分析结果优化。
:::

## 自定义 Hook

自定义 Hook 是 Hooks 最强大的特性，让你把复杂的有状态逻辑封装成可复用的函数：

```jsx
// useFetch：封装数据请求逻辑
function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => { if (!cancelled) setData(json) })
      .catch(err => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [url])

  return { data, loading, error }
}

// 使用
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`)
  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <div>{user.name}</div>
}
```

### Hook 的规则

1. **只在最顶层调用 Hook**，不在条件、循环或嵌套函数中调用
2. **只在 React 函数组件或自定义 Hook 中调用 Hook**

这两条规则是 React 依赖 Hooks 调用顺序来维护状态的根本保证。

## 总结

| Hook | 核心用途 | 关键点 |
|------|----------|--------|
| `useState` | 管理组件本地状态 | 函数式更新、惰性初始化 |
| `useEffect` | 处理副作用 | 依赖数组、清理函数 |
| `useCallback` | 缓存函数引用 | 配合 `React.memo` |
| `useMemo` | 缓存计算结果 | 避免过度优化 |
| `useRef` | 持久化可变值/DOM 引用 | 变更不触发重渲染 |
| 自定义 Hook | 复用状态逻辑 | 命名以 `use` 开头 |

掌握 React Hooks 的核心在于理解 **闭包** 和 **渲染模型**。每次渲染都是一次独立的快照，理解这一点便能避免大多数常见陷阱。
