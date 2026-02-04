# Post Detail Page Documentation

## 概述

创建了帖子详情页面，用户可以点击 feed 中的帖子卡片跳转到完整的帖子页面，查看完整内容和评论。

## 创建的文件

### 1. 帖子详情页
**文件**: `/app/(main)/community/post/[id]/page.tsx`
**路由**: `/community/post/:id` (动态路由)

## 页面功能

### 核心功能
1. ✅ **完整帖子内容** - 显示完整的帖子文本（不截断）
2. ✅ **作者信息** - 头像、名称、认证徽章
3. ✅ **策略数据** - ROI、最大回撤、夏普比率（如果有）
4. ✅ **互动功能** - 点赞、评论、收藏、分享
5. ✅ **评论区** - 显示评论、回复、发表新评论
6. ✅ **返回按钮** - 返回 feed 页面

### 页面布局

```
┌─────────────────────────────────────────┐
│  ← Back to Feed                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 👤 Author Info          ⋮       │   │
│  │                                  │   │
│  │ Post Title                       │   │
│  │                                  │   │
│  │ Full content (multi-paragraph)   │   │
│  │                                  │   │
│  │ ┌──────────────────────────┐    │   │
│  │ │ 📊 Strategy Stats         │    │   │
│  │ │ ROI | DD | Sharpe         │    │   │
│  │ │          [Add Strategy ▼] │    │   │
│  │ └──────────────────────────┘    │   │
│  │                                  │   │
│  │ ❤️ 124  💬 18  🔖 32      🔗    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Comments (18)                          │
│  ┌─────────────────────────────────┐   │
│  │ 💬 Write a comment...            │   │
│  │                    [Post Comment]│   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 User1  • 1h ago              │   │
│  │ Comment content...               │   │
│  │ Like | Reply        ❤️ 12       │   │
│  │                                  │   │
│  │  └─ 👤 Author Reply • 10m ago   │   │
│  │     Reply content...             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 组件结构

### 主要部分

#### 1. Header 区域
```tsx
<div className="max-w-4xl mx-auto">
  {/* Back Button */}
  <Button onClick={() => router.back()}>
    <ArrowLeft /> Back to Feed
  </Button>
</div>
```

#### 2. 帖子内容卡片
```tsx
<article className="bg-card border rounded-xl">
  {/* 作者信息 */}
  <div className="flex items-start gap-3">
    <Avatar />
    <AuthorInfo />
    <DropdownMenu /> {/* 更多选项 */}
  </div>

  {/* 标题 */}
  <h1 className="text-2xl font-bold">{title}</h1>

  {/* 内容 */}
  <div className="prose">
    {content.split('\n\n').map(paragraph => (
      <p>{paragraph}</p>
    ))}
  </div>

  {/* 策略数据（可选）*/}
  {strategy && <StrategyStats />}

  {/* 互动按钮 */}
  <div className="flex items-center justify-between">
    <div>
      <LikeButton />
      <CommentButton />
      <BookmarkButton />
    </div>
    <ShareButton />
  </div>
</article>
```

#### 3. 评论区
```tsx
<div className="space-y-4">
  <h3>Comments ({count})</h3>

  {/* 评论输入 */}
  <div className="bg-card border rounded-xl">
    <Textarea placeholder="Write a comment..." />
    <Button>Post Comment</Button>
  </div>

  {/* 评论列表 */}
  <div className="space-y-6">
    {comments.map(comment => (
      <CommentItem comment={comment}>
        {/* 回复 */}
        {comment.replies?.map(reply => (
          <ReplyItem reply={reply} />
        ))}
      </CommentItem>
    ))}
  </div>
</div>
```

## 路由配置

### 动态路由
使用 Next.js 的动态路由 `[id]`：
```
/app/(main)/community/post/[id]/page.tsx
```

**示例 URL**:
- `/community/post/1` - 帖子 ID 为 1
- `/community/post/abc123` - 帖子 ID 为 abc123

### 获取参数
```tsx
import { useParams } from 'next/navigation';

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  // 使用 postId 获取帖子数据
}
```

## PostCard 组件更新

### 添加的功能
**文件**: `/components/community/post-card.tsx`

#### 1. 导入 useRouter
```tsx
import { useRouter } from 'next/navigation';
```

#### 2. 添加点击处理
```tsx
export function PostCard({ post, onLike, onBookmark }: PostCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/community/post/${post.id}`);
  };

  return (
    <article onClick={handleCardClick}>
      {/* 内容 */}
    </article>
  );
}
```

#### 3. 事件冒泡处理
所有交互按钮都使用 `e.stopPropagation()` 防止触发卡片点击：

```tsx
// 点赞按钮
<Button onClick={(e) => {
  e.stopPropagation();
  handleLike();
}}>
  Like
</Button>

// 下拉菜单
<DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
  Add Strategy
</DropdownMenuTrigger>

// 更多按钮
<Button onClick={(e) => e.stopPropagation()}>
  <DotsThree />
</Button>
```

## Mock 数据

### 帖子数据
```tsx
const mockPost = {
  id: '1',
  author: {
    name: 'QuantMaster',
    avatar: 'https://...',
    badge: 'Verified Strategist',
  },
  title: 'Neural Net Momentum v3.2 - Live Performance Update',
  content: `Multi-paragraph content...`,
  timestamp: '2h ago',
  stats: {
    likes: 124,
    comments: 18,
    bookmarks: 32,
  },
  strategy: {
    roi: '+14.2%',
    maxDrawdown: '-2.1%',
    sharpe: '3.12',
  },
};
```

### 评论数据
```tsx
const mockComments = [
  {
    id: '1',
    author: { name: 'AlphaResearcher', avatar: '...' },
    content: 'Comment text...',
    timestamp: '1h ago',
    likes: 12,
    isLiked: true,
    replies: [
      {
        id: '2-1',
        author: { name: 'QuantMaster', avatar: '...' },
        content: 'Reply text...',
        timestamp: '10m ago',
        likes: 0,
      }
    ],
  },
];
```

## 互动功能

### 1. 点赞功能
```tsx
const [isLiked, setIsLiked] = useState(false);
const [likes, setLikes] = useState(mockPost.stats.likes);

const handleLike = () => {
  if (!guard()) return; // 登录检查
  setIsLiked(!isLiked);
  setLikes(prev => isLiked ? prev - 1 : prev + 1);
};
```

**状态变化**:
- 未点赞 → 点赞：❤️ 空心 → ❤️ 实心，数字 +1
- 已点赞 → 取消：❤️ 实心 → ❤️ 空心，数字 -1

### 2. 收藏功能
```tsx
const [isBookmarked, setIsBookmarked] = useState(false);
const [bookmarks, setBookmarks] = useState(mockPost.stats.bookmarks);

const handleBookmark = () => {
  if (!guard()) return;
  setIsBookmarked(!isBookmarked);
  setBookmarks(prev => isBookmarked ? prev - 1 : prev + 1);
};
```

### 3. 评论功能
```tsx
const [comment, setComment] = useState('');

const handleComment = () => {
  if (!guard()) return;
  if (!comment.trim()) return;
  // POST to API
  console.log('Post comment:', comment);
  setComment('');
};
```

**验证**:
- 需要登录
- 评论不能为空
- 提交后清空输入框

### 4. 分享功能
```tsx
<Button variant="ghost" size="icon">
  <Share className="w-5 h-5" weight="bold" />
</Button>
```

待实现：
- 复制链接
- 分享到社交媒体
- 生成分享图片

## 登录保护

所有交互操作都使用 `guard()` 方法：

```tsx
const { user, guard } = useUser();

const handleLike = () => {
  if (!guard()) return; // 未登录会打开登录弹窗
  // 执行点赞
};
```

**保护的操作**:
- ✅ 点赞
- ✅ 收藏
- ✅ 发表评论
- ✅ 点击输入框

## 用户体验

### 导航流程
```
Feed 页面
  ↓ (点击帖子卡片)
帖子详情页
  ↓ (点击 Back 按钮)
返回 Feed (保持之前的滚动位置)
```

### 交互反馈
- **悬停效果**: 卡片 shadow 增强
- **点击反馈**: 按钮状态变化
- **加载状态**: 显示 loading（待实现）
- **错误处理**: Toast 提示（待实现）

### 响应式设计
- **桌面**: 最大宽度 4xl (56rem)
- **移动**: 全宽，适当内边距
- **策略卡片**: 移动端单列，桌面端横向布局

## 样式特点

### 容器
```tsx
<div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
  <div className="max-w-4xl mx-auto">
    {/* 内容 */}
  </div>
</div>
```

- 外层容器：最大 1440px
- 内容容器：最大 4xl (56rem / 896px)
- 居中对齐

### 卡片样式
```tsx
<article className="bg-card border rounded-xl shadow-sm">
  {/* 内容 */}
</article>
```

- 白色背景（深色模式自适应）
- 圆角 xl (0.75rem)
- 细边框
- 轻微阴影

### 评论层级
```
评论
  ├─ 作者信息 (size-10 头像)
  ├─ 内容
  └─ 回复
      ├─ 作者信息 (size-8 头像, ml-12 缩进)
      └─ 内容
```

## API 集成建议

### 获取帖子数据
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => apiClient.get(`/api/posts/${postId}`),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  if (!post) return <NotFound />;

  return <PostContent post={post} />;
}
```

### 获取评论
```tsx
const { data: comments } = useQuery({
  queryKey: ['comments', postId],
  queryFn: () => apiClient.get(`/api/posts/${postId}/comments`),
});
```

### 发表评论
```tsx
const mutation = useMutation({
  mutationFn: (content: string) =>
    apiClient.post(`/api/posts/${postId}/comments`, { content }),
  onSuccess: () => {
    queryClient.invalidateQueries(['comments', postId]);
    setComment('');
    toast.success('Comment posted!');
  },
});
```

## 下一步优化

### 功能增强
- [ ] 实时评论更新 (WebSocket/Polling)
- [ ] 评论分页/无限滚动
- [ ] 回复功能完整实现
- [ ] 提及用户 (@mention)
- [ ] 评论点赞
- [ ] 评论排序（最新/最热）
- [ ] 图片/视频支持
- [ ] Markdown 渲染
- [ ] 代码高亮

### UI 增强
- [ ] 骨架屏加载状态
- [ ] 图片懒加载
- [ ] 滚动到评论区（锚点）
- [ ] 评论输入框展开/收起
- [ ] 表情选择器
- [ ] 富文本编辑器
- [ ] 预览功能

### 性能优化
- [ ] 服务端渲染 (SSR)
- [ ] 数据预取
- [ ] 图片优化
- [ ] 代码分割
- [ ] 缓存策略

## 测试清单

- [ ] 点击 feed 卡片跳转到详情页
- [ ] URL 参数正确传递
- [ ] 详情页数据正确显示
- [ ] 返回按钮正常工作
- [ ] 点赞功能正常（登录/未登录）
- [ ] 收藏功能正常
- [ ] 评论输入框登录检查
- [ ] 发表评论功能
- [ ] 评论和回复显示正确
- [ ] 策略下拉菜单正常
- [ ] 移动端布局正常
- [ ] 深色模式正常

## 文件清单

### 新建文件
```
app/(main)/community/post/[id]/
└── page.tsx                    # 帖子详情页
```

### 修改文件
```
components/community/
└── post-card.tsx              # 添加点击跳转功能
```

## 总结

✅ **已完成**:
- 帖子详情页创建
- 完整内容展示
- 评论区实现
- 互动功能（点赞、收藏、评论）
- Feed 卡片点击跳转
- 登录保护
- 响应式布局

⏳ **待实现**:
- API 集成
- 实时更新
- 回复功能
- 图片支持
- 性能优化

这个详情页为用户提供了完整的帖子阅读和交互体验，是社区功能的重要组成部分！
