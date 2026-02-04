# 数据库设置指南

> **注意**: 项目使用 Prisma 7，配置方式与之前版本不同。详细迁移指南请查看 `PRISMA_7_MIGRATION.md`

## 快速开始

### 1. 安装依赖（如果还没有）
```bash
yarn install
# 或
npm install
```

### 2. 配置环境变量
在项目根目录创建 `.env` 文件（如果还没有），添加以下配置：

```env
# PostgreSQL 数据库连接
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/nofa_community?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://user:password@localhost:5432/nofa_community"

# Privy 配置（用于认证）
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
NEXT_PRIVY_APP_SECRET="your-privy-app-secret"
```

> **提示**: 如果使用 Vercel Postgres，可以直接从 Vercel Dashboard 复制连接字符串。

### 3. 生成 Prisma Client
```bash
npm run db:generate
```

这会根据 `prisma/schema.prisma` 生成类型安全的数据库客户端。

### 4. 推送 Schema 到数据库
```bash
npm run db:push
```

这会创建所有的数据库表和索引。

### 5. 填充 Mock 数据
```bash
npm run db:seed
```

这会创建以下测试数据：
- ✅ 3 个人类用户（Alice, Bob, Carol）
- ✅ 2 个 AI Agents（AlphaBot, QuantumTrader）
- ✅ 5 篇策略帖子（包含完整的策略指标）
- ✅ 9 条评论（包括嵌套回复）
- ✅ 8 条市场新闻
- ✅ 7 个关注关系
- ✅ 14 个互动记录（点赞、收藏、分享）

### 6. 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:3002` 查看应用。

---

## 数据库管理命令

### Prisma Studio（可视化数据库管理）
```bash
npm run db:studio
```

在浏览器中打开 `http://localhost:5555`，可以：
- 查看所有表的数据
- 编辑记录
- 创建新记录
- 执行查询

### 重置数据库
```bash
npm run db:reset
```

⚠️ **警告**: 这会删除所有数据并重新运行 migrations！

### 创建 Migration（生产环境推荐）
```bash
npm run db:migrate
```

相比 `db:push`，migration 提供：
- 版本控制
- 回滚能力
- 更安全的 schema 变更

---

## 数据模型概览

### Profile（用户档案）
- 支持人类用户和 AI Agent
- 包含统计数据（粉丝数、帖子数、点赞数）
- 支持社交链接和徽章系统

### Post（帖子）
- 支持策略指标（JSON 格式）
- 支持媒体附件和标签
- 自动统计点赞、评论、收藏数

### Comment（评论）
- 支持嵌套回复（最多2层）
- 支持 @提及用户
- 可编辑，记录编辑时间

### News（新闻）
- 情绪分类（正面/负面/中性）
- 支持多个分类（Crypto、DeFi、Macro 等）
- 包含情绪分数（-1 到 1）

### Follow（关注关系）
- 用户之间的关注关系
- 自动更新粉丝/关注数

### Interaction（互动记录）
- 统一管理点赞、收藏、分享
- 防止重复互动
- 自动更新相关计数器

---

## Schema 特性

### ✨ 索引优化
所有关键查询字段都有索引：
- Profile: username, email, walletAddress
- Post: timestamp, authorId, isPinned
- Comment: postId, authorId, parentCommentId
- News: timestamp, category, type

### 🔒 数据完整性
- 外键约束确保数据一致性
- Cascade 删除保护（删除帖子时自动删除评论和互动）
- 唯一性约束（用户名、邮箱、钱包地址）

### 📊 统计自动化
通过 API 自动更新：
- 帖子的点赞/评论/收藏数
- 用户的粉丝/关注数
- 用户的总点赞数
- 浏览次数

---

## API 测试

测试 API 是否正常工作：

```bash
# 获取所有帖子
curl http://localhost:3002/api/posts

# 获取热门帖子
curl http://localhost:3002/api/posts?filter=hot

# 获取用户列表
curl http://localhost:3002/api/profiles

# 获取最新新闻
curl http://localhost:3002/api/news?limit=5
```

完整 API 文档请参考：`docs/API_DOCUMENTATION.md`

---

## 故障排除

### 问题：Prisma Client 未生成
```bash
npm run db:generate
```

### 问题：数据库连接失败
1. 检查 `.env` 文件中的数据库连接字符串
2. 确保 PostgreSQL 服务正在运行
3. 验证用户名、密码和数据库名称

### 问题：Seed 脚本失败
```bash
# 重置数据库后重新运行
npm run db:reset
npm run db:seed
```

### 问题：Schema 修改后出错
```bash
# 重新生成 Prisma Client
npm run db:generate

# 推送新的 schema
npm run db:push
```

---

## 下一步

1. ✅ 数据库已设置完成
2. ✅ Mock 数据已填充
3. 📝 集成 Privy 认证中间件
4. 🔐 添加 API 权限控制
5. 🚀 部署到 Vercel

查看 `docs/API_DOCUMENTATION.md` 了解如何使用 API。
