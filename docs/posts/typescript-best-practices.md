---
title: "TypeScript 前端最佳实践"
date: "2025-12-05"
category: "工程化"
tags: ["typescript", "javascript", "工程化"]
description: "系统总结 TypeScript 在前端项目中的最佳实践，涵盖类型系统进阶、工具类型、类型体操技巧及项目配置建议。"
---

# TypeScript 前端最佳实践

TypeScript 已成为大型前端项目的标配。本文整理了实战中最有价值的 TypeScript 使用技巧，帮助你写出更安全、更易维护的代码。

## 类型（Type）vs 接口（Interface）

这是 TypeScript 中最常见的争论之一：

| 维度 | `type` | `interface` |
|------|--------|-------------|
| 扩展 | 用交叉类型 `&` | 用 `extends` |
| 合并声明 | ❌ 不支持 | ✅ 支持 |
| 联合/交叉 | ✅ 原生支持 | ❌ 不支持 |
| 映射类型 | ✅ 支持 | ❌ 不支持 |

**实践建议**：
- 定义**对象形状**时优先用 `interface`（可被扩展和合并）
- 联合类型、元组、函数签名、映射类型等场景用 `type`

```typescript
// interface：描述对象形状
interface User {
  id: number
  name: string
  email: string
}

// interface 声明合并（第三方库类型扩展常用）
interface Window {
  myPlugin: () => void
}

// type：联合类型
type Status = 'idle' | 'loading' | 'success' | 'error'

// type：元组
type Coordinate = [number, number]

// type：函数
type Handler<T> = (event: T) => void
```

## 泛型：类型系统的核心

泛型是 TypeScript 最强大的特性，让你编写可复用且类型安全的代码：

```typescript
// 通用 API 响应包装
interface ApiResponse<T> {
  data: T
  code: number
  message: string
}

// 类型推断自动工作
async function fetchUser(id: number): Promise<ApiResponse<User>> {
  return fetch(`/api/users/${id}`).then(r => r.json())
}

// 泛型约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user: User = { id: 1, name: 'Alice', email: 'alice@example.com' }
const name = getProperty(user, 'name')  // 类型为 string
const id = getProperty(user, 'id')      // 类型为 number
// getProperty(user, 'invalid')         // ❌ 编译报错
```

## 内置工具类型

TypeScript 内置了大量实用的工具类型，熟练运用可以避免大量重复类型定义：

```typescript
interface User {
  id: number
  name: string
  email: string
  password: string
  createdAt: Date
}

// Partial<T>：所有属性变为可选
type UpdateUserDto = Partial<User>

// Required<T>：所有属性变为必选
type FullUser = Required<User>

// Pick<T, K>：从 T 中挑选属性 K
type UserProfile = Pick<User, 'id' | 'name' | 'email'>

// Omit<T, K>：从 T 中排除属性 K
type PublicUser = Omit<User, 'password'>

// Record<K, V>：键值映射
type UserMap = Record<number, User>

// Readonly<T>：所有属性变为只读
type ImmutableUser = Readonly<User>

// ReturnType<F>：获取函数返回值类型
async function getUser() { return {} as User }
type UserResult = Awaited<ReturnType<typeof getUser>> // User
```

### 条件类型与 infer

```typescript
// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

type A = UnwrapPromise<Promise<string>>  // string
type B = UnwrapPromise<number>           // number

// 提取数组元素类型
type ElementType<T> = T extends Array<infer E> ? E : never
type C = ElementType<string[]>  // string
```

## 类型收窄（Type Narrowing）

TypeScript 会根据控制流分析自动收窄类型：

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }

function area(shape: Shape): number {
  // 判别联合（Discriminated Union）：通过 kind 收窄
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2  // shape: { kind: 'circle'; radius: number }
    case 'rect':
      return shape.width * shape.height   // shape: { kind: 'rect'; ... }
  }
}
```

### 自定义类型守卫

```typescript
interface Cat { meow(): void }
interface Dog { bark(): void }

// 类型谓词
function isCat(animal: Cat | Dog): animal is Cat {
  return (animal as Cat).meow !== undefined
}

function interact(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow()  // animal: Cat
  } else {
    animal.bark()  // animal: Dog
  }
}
```

## 严格模式配置

在 `tsconfig.json` 中开启 `strict` 是最重要的一步，它等同于开启以下选项：

```json
{
  "compilerOptions": {
    "strict": true,         // 开启所有严格检查
    "noUncheckedIndexedAccess": true,  // 数组索引返回 T | undefined
    "noImplicitOverride": true,        // 子类覆盖方法必须显式标注 override
    "exactOptionalPropertyTypes": true // 可选属性不允许显式赋 undefined
  }
}
```

```typescript
// noUncheckedIndexedAccess 示例
const arr = [1, 2, 3]
const item = arr[0]  // 类型为 number | undefined（不是 number）

if (item !== undefined) {
  console.log(item.toFixed(2))  // ✅ 安全
}
```

## 实战技巧

### 1. 使用 `satisfies` 操作符

```typescript
const config = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>

// satisfies 在保持字面量类型的同时验证类型合法性
config.port  // 类型为 3000（字面量），而非 string | number
```

### 2. 模板字面量类型

```typescript
type EventName = 'click' | 'focus' | 'blur'
type EventHandler = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'

type CSSProperty = 'margin' | 'padding'
type CSSSpacing = `${CSSProperty}${'Top' | 'Right' | 'Bottom' | 'Left'}`
// 'marginTop' | 'marginRight' | ... | 'paddingLeft'
```

### 3. 函数重载

```typescript
function createElement(tag: 'a'): HTMLAnchorElement
function createElement(tag: 'canvas'): HTMLCanvasElement
function createElement(tag: 'table'): HTMLTableElement
function createElement(tag: string): HTMLElement {
  return document.createElement(tag)
}

const anchor = createElement('a')   // HTMLAnchorElement
const canvas = createElement('canvas')  // HTMLCanvasElement
```

## tsconfig 推荐配置

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 总结

TypeScript 的价值不仅在于捕获运行时错误，更在于**提升代码的可读性和可维护性**。合理使用泛型、工具类型和类型收窄，可以让你的 API 设计更加清晰，让 IDE 提供更好的智能提示，最终让团队协作更加高效。
