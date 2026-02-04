# Layout 结构说明

## 概述

使用 Next.js 路由组（Route Groups）功能拆分 layout，实现不同页面使用不同的布局结构。

## 目录结构

```
app/
├── layout.tsx                 # 根 layout（最小化）
├── globals.css                # 全局样式
├── providers.tsx              # Providers 配置
│
├── (main)/                    # 主应用路由组
│   ├── layout.tsx            # 主应用 layout（完整功能）
│   ├── page.tsx              # 首页 /
│   └── community/            # 社区 /community
│
├── api-docs/                  # API 文档（独立）
│   ├── layout.tsx            # 独立 layout
│   ├── page.tsx              # /api-docs
│   └── swagger-fix.css       # Swagger 样式修复
│
└── api/                       # API 路由
    ├── posts/
    ├── profiles/
    └── ...
```

## Layout 层级

### 1. 根 Layout (`app/layout.tsx`)

**用途**: 所有页面的基础 layout
**包含**:
- 基础的 `<html>` 和 `<body>` 标签
- 全局 CSS
- 最小化配置

**代码**:
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

**特点**:
- ✅ 极简设计，无任何 providers
- ✅ 不限制子路由的布局
- ✅ 所有路由都会继承这个基础结构

---

### 2. 主应用 Layout (`app/(main)/layout.tsx`)

**用途**: 首页和 community 页面
**包含**:
- Providers (Privy, QueryClient, ApiClient)
- AuthGuard
- ConditionalHeader
- Analytics
- Toaster

**应用于**:
- `/` - 首页
- `/community` - 社区页面
- `/community/*` - 社区子页面

**代码**:
```tsx
export default function MainLayout({ children }) {
  return (
    <Providers>
      <QueryProvider>
        <ApiClientProvider>
          <div className="min-h-screen flex flex-col">
            <ConditionalHeader />
            <div className="flex-1 overflow-hidden">
              <AuthGuard publicPaths={['/community/*']}>
                {children}
              </AuthGuard>
            </div>
          </div>
        </ApiClientProvider>
      </QueryProvider>
      <Toaster />
      <Analytics />
    </Providers>
  )
}
```

**特点**:
- ✅ 完整的应用功能
- ✅ 包含认证守卫
- ✅ 顶部导航栏
- ✅ 分析和通知

---

### 3. API 文档 Layout (`app/api-docs/layout.tsx`)

**用途**: API 文档页面
**包含**:
- 独立的 `<html>` 和 `<body>`
- Swagger 样式修复
- 滚动优化

**应用于**:
- `/api-docs` - API 文档页面

**代码**:
```tsx
export default function ApiDocsLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        overflow: 'auto',
        minHeight: '100vh'
      }}>
        {children}
      </body>
    </html>
  )
}
```

**特点**:
- ✅ 完全独立的 HTML 结构
- ✅ 不受主应用样式影响
- ✅ 优化的滚动行为
- ✅ 无 providers 开销

---

## 路由组说明

### 什么是路由组？

路由组是 Next.js App Router 的功能，使用 `(folder)` 格式命名。

**特点**:
- 括号内的文件夹名称**不会**出现在 URL 路径中
- 可以在组内使用独立的 layout
- 用于组织相关路由，而不影响 URL 结构

### 为什么使用路由组？

**优势**:
1. **布局隔离**: 不同功能区域使用不同 layout
2. **性能优化**: 避免不必要的 providers 和组件
3. **代码组织**: 逻辑清晰，易于维护
4. **灵活性**: 每个区域独立配置

**示例**:
```
app/
├── (main)/page.tsx       → URL: /
├── (main)/community/     → URL: /community
└── api-docs/             → URL: /api-docs
```

---

## 页面路由对应关系

| URL 路径 | 文件路径 | 使用的 Layout |
|----------|----------|---------------|
| `/` | `app/(main)/page.tsx` | Root → Main |
| `/community` | `app/(main)/community/page.tsx` | Root → Main |
| `/api-docs` | `app/api-docs/page.tsx` | Root → API Docs |
| `/api/*` | `app/api/*/route.ts` | Root only |

---

## Layout 继承关系

```
Root Layout (app/layout.tsx)
│
├─→ Main Layout (app/(main)/layout.tsx)
│   ├─→ Home Page (/)
│   └─→ Community Pages (/community/*)
│
└─→ API Docs Layout (app/api-docs/layout.tsx)
    └─→ API Docs Page (/api-docs)
```

---

## 优势对比

### 之前（单一 Root Layout）

❌ 所有页面共享相同的 layout
❌ API 文档页面继承了不需要的 providers
❌ 滚动问题难以解决
❌ 样式冲突难以隔离

### 现在（拆分 Layout）

✅ 每个区域使用合适的 layout
✅ API 文档完全独立，无多余依赖
✅ 滚动问题轻松解决
✅ 样式完全隔离
✅ 性能更优（减少不必要的 providers）

---

## 开发建议

### 1. 添加新的主应用页面

在 `app/(main)/` 下创建：
```
app/(main)/new-page/page.tsx
```
自动使用 Main Layout。

### 2. 添加新的独立页面

在 `app/` 下创建，并提供自己的 layout：
```
app/new-section/
├── layout.tsx
└── page.tsx
```

### 3. 修改主应用 Layout

编辑 `app/(main)/layout.tsx`，只影响主应用页面。

### 4. 修改根 Layout

谨慎修改 `app/layout.tsx`，会影响所有页面。

---

## 常见问题

### Q: 为什么首页在 (main) 文件夹里？

A: 使用路由组不影响 URL。`app/(main)/page.tsx` 仍然映射到 `/`。

### Q: 可以有多个路由组吗？

A: 可以！可以创建 `(admin)`, `(dashboard)`, `(public)` 等多个路由组。

### Q: API 路由受影响吗？

A: 不受影响。API 路由 (`app/api/`) 只使用根 layout 的基础结构。

### Q: 路由组可以嵌套吗？

A: 可以嵌套，但通常一层就够用了。

---

## 迁移检查清单

- [x] 创建 `app/(main)/` 路由组
- [x] 移动 `page.tsx` 到 `(main)/`
- [x] 移动 `community/` 到 `(main)/`
- [x] 创建 `(main)/layout.tsx` 包含完整功能
- [x] 简化 `app/layout.tsx` 为最小配置
- [x] 更新 `api-docs/layout.tsx` 为独立 layout
- [x] 测试所有路由正常工作
- [x] 验证滚动功能正常

---

## 测试验证

```bash
# 启动开发服务器
npm run dev

# 测试路由
# 1. 访问首页
open http://localhost:3002/

# 2. 访问社区页面
open http://localhost:3002/community

# 3. 访问 API 文档
open http://localhost:3002/api-docs

# 验证要点：
# ✓ 首页和 community 有顶部导航
# ✓ API 文档独立布局，无顶部导航
# ✓ API 文档可以正常滚动
# ✓ 所有页面功能正常
```

---

**创建时间**: 2026-02-04
**版本**: v1.0
**维护者**: 开发团队
