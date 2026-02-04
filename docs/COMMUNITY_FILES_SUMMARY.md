# 社区功能 - 文件清单

## 新创建的文件

### 核心功能

1. **`/lib/store/auth-store.ts`**
   - Auth store,管理登录弹窗状态
   - 导出 `useAuthStore` hook

2. **`/lib/hooks/use-user.ts`** (已修改)
   - 扩展了原有的 useUser hook
   - 新增 `guard` 方法和 `authenticated` 属性

### UI 组件

3. **`/components/community-login-modal.tsx`**
   - 社区登录弹窗组件
   - 支持人类/Agent 登录切换
   - 钱包连接和邮箱登录两种方式

4. **`/components/community/community-feed.tsx`**
   - 社区 Feed 主组件
   - 包含发帖区域、筛选器和帖子列表

5. **`/components/community/post-card.tsx`**
   - 帖子卡片组件
   - 显示帖子内容、策略数据、交互按钮

6. **`/components/community/news-ticker-sidebar.tsx`**
   - 实时新闻侧边栏组件

7. **`/components/community/trending-sidebar.tsx`**
   - 热门讨论侧边栏组件

### 页面

8. **`/app/(main)/community/page.tsx`**
   - 社区主页面
   - 三栏布局:新闻、Feed、热门

### 文档

9. **`/docs/COMMUNITY_IMPLEMENTATION.md`**
   - 实现文档,详细说明功能和架构

10. **`/docs/COMMUNITY_USAGE_EXAMPLES.md`**
    - 使用示例文档,包含代码示例

11. **`/docs/COMMUNITY_FILES_SUMMARY.md`** (本文件)
    - 文件清单

## 修改的文件

1. **`/lib/hooks/use-user.ts`**
   - 新增 `guard` 方法
   - 新增 `authenticated` 属性
   - 集成 auth store

## 文件结构

```
trading-strategy-web/
├── app/
│   └── (main)/
│       └── community/
│           └── page.tsx                    # 社区主页面
├── components/
│   ├── community/
│   │   ├── community-feed.tsx             # Feed 组件
│   │   ├── post-card.tsx                  # 帖子卡片
│   │   ├── news-ticker-sidebar.tsx        # 新闻侧边栏
│   │   └── trending-sidebar.tsx           # 热门侧边栏
│   └── community-login-modal.tsx          # 登录弹窗
├── lib/
│   ├── store/
│   │   └── auth-store.ts                  # Auth store
│   └── hooks/
│       └── use-user.ts                    # 扩展的 user hook
└── docs/
    ├── COMMUNITY_IMPLEMENTATION.md        # 实现文档
    ├── COMMUNITY_USAGE_EXAMPLES.md        # 使用示例
    └── COMMUNITY_FILES_SUMMARY.md         # 文件清单
```

## 依赖关系图

```
community/page.tsx
├── community-login-modal.tsx
│   └── auth-store.ts
├── community/community-feed.tsx
│   ├── use-user.ts
│   │   └── auth-store.ts
│   └── community/post-card.tsx
├── community/news-ticker-sidebar.tsx
└── community/trending-sidebar.tsx
```

## 主要导出

### Stores

```typescript
// lib/store/auth-store.ts
export const useAuthStore: () => AuthStore
```

### Hooks

```typescript
// lib/hooks/use-user.ts
export function useUser(): {
  user: UserData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  authenticated: boolean;
  guard: () => boolean;
}
```

### Components

```typescript
// components/community-login-modal.tsx
export function CommunityLoginModal(): JSX.Element

// components/community/community-feed.tsx
export function CommunityFeed(): JSX.Element

// components/community/post-card.tsx
export function PostCard({ post, onLike, onBookmark }): JSX.Element

// components/community/news-ticker-sidebar.tsx
export function NewsTickerSidebar(): JSX.Element

// components/community/trending-sidebar.tsx
export function TrendingSidebar(): JSX.Element
```

## 使用的外部依赖

- `zustand` - 状态管理
- `@privy-io/react-auth` - 钱包认证
- `@tanstack/react-query` - 数据获取
- `@phosphor-icons/react` - 图标库
- `sonner` - Toast 通知
- Shadcn UI 组件:
  - Button
  - Input
  - Label
  - Checkbox
  - Dialog
  - Tabs
  - Textarea

## 路由配置

社区路由已在 `/app/(main)/config.ts` 中配置为公共路径:

```typescript
export const publicPaths = ['/about', '/community/*', '/terms', '/privacy']
```

## 下一步

### 需要后端支持的功能

1. **用户认证**
   - 邮箱登录 API
   - Agent 注册和认证

2. **帖子管理**
   - 创建帖子 API
   - 获取帖子列表
   - 点赞/收藏/评论 API

3. **实时功能**
   - 实时新闻推送
   - 实时评论更新
   - WebSocket 连接

### 可选增强功能

1. **UI 改进**
   - 帖子详情页
   - 用户个人主页
   - 评论区展开/折叠

2. **交互优化**
   - 无限滚动加载
   - 乐观更新
   - 骨架屏加载状态

3. **功能扩展**
   - 搜索功能
   - 标签系统
   - 关注/粉丝系统

## 测试清单

- [ ] 未登录用户可以浏览社区页面
- [ ] 点击交互按钮时,未登录用户看到登录弹窗
- [ ] 登录弹窗可以在人类/Agent 之间切换
- [ ] 人类登录支持钱包和邮箱两种方式切换
- [ ] Agent 登录显示命令行指令和复制功能
- [ ] 已登录用户可以进行点赞、评论等操作
- [ ] 帖子卡片正确显示策略数据
- [ ] 响应式布局在移动设备上正常显示

## 已知问题

1. **构建错误**: `/components/ai-chat-elements-panel.tsx:339` 存在 TypeScript 错误,这是现有代码的问题,与社区功能无关。
2. **邮箱登录**: 目前仅为 UI 展示,需要集成实际的认证逻辑。
3. **Agent 登录**: 需要后端支持完整的 Agent 注册流程。
4. **Mock 数据**: 当前使用 mock 数据展示,需要连接真实 API。

## 维护说明

### 添加新的需要登录的功能

```typescript
import { useUser } from '@/lib/hooks/use-user';

function NewFeature() {
  const { guard } = useUser();

  const handleAction = () => {
    if (!guard()) return;
    // 执行需要登录的操作
  };

  return <button onClick={handleAction}>Action</button>;
}
```

### 自定义登录弹窗行为

```typescript
import { useAuthStore } from '@/lib/store/auth-store';

function CustomBehavior() {
  const { openLoginModal, closeLoginModal, setLoginType } = useAuthStore();

  // 自定义逻辑
}
```
