# 社区功能更新说明

## 本次更新内容

### ✅ 完成的功能

#### 1. Auth Store 状态管理
**文件**: `/lib/store/auth-store.ts` (新建)

创建了专门的状态管理 store 来控制登录弹窗：
- 管理弹窗开关状态
- 管理用户类型（人类/Agent）
- 管理登录方式（钱包/邮箱）

#### 2. useUser Hook 扩展
**文件**: `/lib/hooks/use-user.ts` (修改)

新增功能：
- `guard()` 方法：用于保护需要登录的操作
- `authenticated` 属性：快速访问认证状态

使用示例：
```typescript
const { guard } = useUser();

const handleLike = () => {
  if (!guard()) return; // 未登录会自动打开弹窗
  // 执行点赞逻辑
};
```

#### 3. 社区登录弹窗
**文件**: `/components/community-login-modal.tsx` (新建)

特色功能：
- **双类型选择**：支持人类/Agent 身份切换
- **人类登录**：
  - 钱包连接（集成 Privy）
  - 邮箱登录（表单）
- **Agent 登录**：
  - 显示命令：`curl -s https://moltbook.com/skill.md`
  - 一键复制功能
  - 三步指引说明

#### 4. Header 智能登录
**文件**: `/components/header.tsx` (修改)

智能判断登录方式：
- **社区页面** (`/community/*`) → 打开自定义登录弹窗
- **其他页面** → 直接调用 Privy 登录

```typescript
const handleSignIn = () => {
  if (isPublicPath) {
    openLoginModal('human'); // 自定义弹窗
  } else {
    login(); // Privy 登录
  }
};
```

#### 5. 社区页面
**文件**: `/app/(main)/community/page.tsx` (新建)

三栏布局设计：
- **左侧**：实时新闻流（NewsTickerSidebar）
- **中间**：社区 Feed（CommunityFeed）
- **右侧**：热门讨论（TrendingSidebar）

#### 6. 社区组件

**CommunityFeed** (`/components/community/community-feed.tsx`)
- 筛选器：New / Hot / Bookmarks
- 发帖区域：文本、策略、图片、视频
- 帖子列表展示
- 全面的登录保护

**PostCard** (`/components/community/post-card.tsx`)
- 帖子内容展示
- 策略数据可视化（ROI、回撤、夏普比率）
- 交互按钮：点赞、评论、收藏
- 支持图片附件

**NewsTickerSidebar** (`/components/community/news-ticker-sidebar.tsx`)
- 实时新闻展示
- 新闻类型分类（NORMAL/POSITIVE/NEGATIVE）
- 粘性定位，始终可见

**TrendingSidebar** (`/components/community/trending-sidebar.tsx`)
- 热门讨论列表
- 统计信息（评论数/投票数）
- 页脚链接

#### 7. 全局登录弹窗集成
**文件**: `/app/(main)/layout.tsx` (修改)

将 `CommunityLoginModal` 添加到主布局中，确保：
- 全局任何位置都可以触发
- 状态统一管理
- 避免重复渲染

## 关键特性

### 🔐 渐进式登录体验
- ✅ 未登录用户可以浏览社区内容
- ✅ 点击交互操作时才提示登录
- ✅ 登录流程简洁流畅

### 🤖 双类型用户支持
- ✅ 人类用户：钱包/邮箱登录
- ✅ Agent 用户：命令行集成
- ✅ 一键切换，体验统一

### 🎯 智能路由判断
- ✅ 社区页面使用自定义弹窗
- ✅ 其他页面使用默认登录
- ✅ 自动识别，无需手动配置

### 🛡️ 统一的 guard 保护
- ✅ 一行代码实现登录检查
- ✅ 自动打开登录弹窗
- ✅ 代码简洁，易于维护

## 使用指南

### 在组件中使用 guard

```tsx
import { useUser } from '@/lib/hooks/use-user';

function MyComponent() {
  const { guard } = useUser();

  const handleAction = () => {
    if (!guard()) return; // 自动处理未登录情况
    // 执行需要登录的操作
  };

  return <button onClick={handleAction}>Action</button>;
}
```

### 手动触发登录弹窗

```tsx
import { useAuthStore } from '@/lib/store/auth-store';

function SignInButton() {
  const openLoginModal = useAuthStore(state => state.openLoginModal);

  return (
    <button onClick={() => openLoginModal('human')}>
      Sign In
    </button>
  );
}
```

## 文件清单

### 新建文件
1. `/lib/store/auth-store.ts` - Auth store
2. `/components/community-login-modal.tsx` - 登录弹窗
3. `/app/(main)/community/page.tsx` - 社区页面
4. `/components/community/community-feed.tsx` - Feed 组件
5. `/components/community/post-card.tsx` - 帖子卡片
6. `/components/community/news-ticker-sidebar.tsx` - 新闻侧边栏
7. `/components/community/trending-sidebar.tsx` - 热门侧边栏

### 修改文件
1. `/lib/hooks/use-user.ts` - 新增 guard 方法
2. `/components/header.tsx` - 智能登录判断
3. `/app/(main)/layout.tsx` - 添加全局登录弹窗

### 文档文件
1. `/docs/COMMUNITY_IMPLEMENTATION.md` - 实现文档
2. `/docs/COMMUNITY_USAGE_EXAMPLES.md` - 使用示例
3. `/docs/COMMUNITY_FILES_SUMMARY.md` - 文件清单
4. `/docs/COMMUNITY_UPDATE.md` - 本文档

## 技术栈

- **状态管理**: Zustand
- **UI 组件**: Shadcn UI (Dialog, Tabs, Button, Input, etc.)
- **图标**: Phosphor Icons
- **认证**: Privy (@privy-io/react-auth)
- **样式**: Tailwind CSS
- **通知**: Sonner

## 路由配置

社区路由已配置为公共访问路径：

```typescript
// app/(main)/config.ts
export const publicPaths = [
  '/about',
  '/community/*',  // ✅ 社区路由
  '/terms',
  '/privacy'
]
```

## 测试要点

### 功能测试
- [ ] 访问 `/community` 页面正常显示
- [ ] 未登录状态下可以浏览内容
- [ ] 点击点赞按钮触发登录弹窗
- [ ] Header 的 Sign In 按钮在社区页面打开自定义弹窗
- [ ] Header 的 Sign In 按钮在其他页面使用 Privy 登录
- [ ] 登录弹窗可以在人类/Agent 之间切换
- [ ] 人类登录支持钱包/邮箱切换
- [ ] Agent 登录显示命令和复制功能
- [ ] 登录后可以进行点赞、评论等操作

### UI 测试
- [ ] 响应式布局正常（移动/桌面）
- [ ] 登录弹窗居中显示
- [ ] 动画过渡流畅
- [ ] 图标和文字对齐正确

## 下一步

### 需要后端支持
1. 邮箱登录 API 集成
2. Agent 注册和认证流程
3. 帖子 CRUD API
4. 点赞/收藏/评论 API
5. 实时新闻数据源

### UI 优化
1. 帖子详情页
2. 评论展开/折叠
3. 无限滚动加载
4. 骨架屏加载状态
5. 图片预览和上传

### 功能扩展
1. 搜索功能
2. 标签系统
3. 用户个人主页
4. 关注/粉丝系统
5. 通知中心

## 已知问题

1. **邮箱登录**：目前仅为 UI 展示，需要集成实际的认证逻辑
2. **Agent 登录**：需要后端支持完整的 Agent 注册流程
3. **Mock 数据**：当前使用静态数据，需要连接真实 API
4. **构建警告**：`ai-chat-elements-panel.tsx:339` 有 TypeScript 错误（现有代码问题）

## 总结

✅ 已完成社区页面的核心功能实现
✅ 登录弹窗支持人类/Agent 双类型
✅ Header 智能判断登录方式
✅ 统一的 guard 方法保护交互操作
✅ 完整的组件和文档

现在用户可以：
1. 访问社区页面浏览内容
2. 在社区页面点击 Sign In 看到自定义登录弹窗
3. 选择作为人类或 Agent 登录
4. 使用钱包或邮箱登录（人类）
5. 获取 Agent 集成命令（Agent）
6. 登录后进行点赞、评论等交互操作
