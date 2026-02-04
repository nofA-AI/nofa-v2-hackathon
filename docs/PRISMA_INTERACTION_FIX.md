# Prisma Interaction Model 修复说明

## 问题描述

原始的 `Interaction` 模型尝试同时关联 `Post` 和 `Comment`，使用同一个 `targetId` 字段：

```prisma
model Interaction {
  // ...
  post    Post?    @relation(fields: [targetId], references: [id])
  comment Comment? @relation(fields: [targetId], references: [id])
}
```

**错误原因**：
- Prisma 不支持多态关联（Polymorphic Associations）
- 同一个字段不能同时作为多个表的外键
- 这会导致 Prisma 生成失败的错误

## 解决方案

### ✅ 移除直接关联，在应用层处理

修改后的 `Interaction` 模型：

```prisma
model Interaction {
  id              Int             @id @default(autoincrement())
  userId          String
  targetType      TargetType      // POST | COMMENT
  targetId        Int             // 引用 Post.id 或 Comment.id
  interactionType InteractionType
  createdAt       DateTime        @default(now())

  // Relations
  user Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Note: targetId references either Post.id or Comment.id depending on targetType
  // Prisma doesn't support polymorphic relations, so we handle this in application logic

  @@unique([userId, targetType, targetId, interactionType])
  @@index([userId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

**关键变更**：
1. ✅ 移除了 `post` 和 `comment` 关联
2. ✅ 保留 `targetType` 和 `targetId` 作为普通字段
3. ✅ 在应用代码中根据 `targetType` 查询相应的表

## 应用层实现

### 创建互动示例

```typescript
// API: /api/interactions (POST)
const interaction = await prisma.interaction.create({
  data: {
    userId: 'user123',
    targetType: 'POST',      // 或 'COMMENT'
    targetId: 1,             // Post.id 或 Comment.id
    interactionType: 'LIKE'
  }
});

// 根据 targetType 更新相应的计数
if (interaction.targetType === 'POST') {
  await prisma.post.update({
    where: { id: interaction.targetId },
    data: { likeCount: { increment: 1 } }
  });
} else if (interaction.targetType === 'COMMENT') {
  await prisma.comment.update({
    where: { id: interaction.targetId },
    data: { likeCount: { increment: 1 } }
  });
}
```

### 查询互动示例

```typescript
// 获取用户对某个帖子的互动
const interaction = await prisma.interaction.findUnique({
  where: {
    userId_targetType_targetId_interactionType: {
      userId: 'user123',
      targetType: 'POST',
      targetId: 1,
      interactionType: 'LIKE'
    }
  },
  include: {
    user: true
  }
});

// 然后在应用层获取 post 或 comment
if (interaction.targetType === 'POST') {
  const post = await prisma.post.findUnique({
    where: { id: interaction.targetId }
  });
}
```

## 迁移步骤

### 1. 生成 Prisma Client

```bash
npm run db:generate
```

### 2. 推送 Schema 变更到数据库

```bash
npm run db:push
```

或使用 migration（生产环境推荐）：

```bash
npm run db:migrate
```

### 3. 重新填充数据（开发环境）

```bash
# 重置数据库并重新 seed
npm run db:reset

# 或手动重新 seed
npm run db:seed
```

### 4. 验证修复

启动开发服务器：
```bash
npm run dev
```

测试 API：
```bash
# 创建互动
curl -X POST http://localhost:3002/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "clxxx",
    "targetType": "POST",
    "targetId": 1,
    "interactionType": "LIKE"
  }'

# 查看数据库
npm run db:studio
```

## 为什么不使用其他方案？

### ❌ 方案 1: 分开两个字段 (postId 和 commentId)

```prisma
model Interaction {
  postId    Int?
  commentId Int?
  post      Post?    @relation(fields: [postId], references: [id])
  comment   Comment? @relation(fields: [commentId], references: [id])
}
```

**缺点**：
- 需要额外的验证确保只有一个字段有值
- 查询更复杂（需要检查两个字段）
- 唯一约束难以实现

### ❌ 方案 2: 分开两个模型 (PostInteraction 和 CommentInteraction)

```prisma
model PostInteraction {
  postId Int
  post   Post @relation(...)
}

model CommentInteraction {
  commentId Int
  comment   Comment @relation(...)
}
```

**缺点**：
- 代码重复
- 查询互动列表需要合并两个表
- 维护成本高

### ✅ 当前方案的优势

1. **简洁**：单一的 Interaction 表
2. **灵活**：易于扩展到其他类型（如 News）
3. **高效**：查询简单，性能好
4. **易维护**：应用层逻辑清晰

## 数据库约束

即使移除了 Prisma 关联，我们仍然保留了重要的约束：

✅ **唯一性约束**：
```prisma
@@unique([userId, targetType, targetId, interactionType])
```
确保同一用户不能对同一目标重复同类型互动。

✅ **索引优化**：
```prisma
@@index([userId])
@@index([targetType, targetId])
@@index([createdAt])
```
确保查询性能。

✅ **外键约束**：
```prisma
user Profile @relation(..., onDelete: Cascade)
```
删除用户时自动删除其所有互动。

## 后续优化建议

### 1. 添加数据库级别的检查约束（可选）

如果使用原生 SQL，可以添加：

```sql
ALTER TABLE "Interaction" ADD CONSTRAINT check_target_exists
CHECK (
  (target_type = 'POST' AND EXISTS (SELECT 1 FROM "Post" WHERE id = target_id))
  OR
  (target_type = 'COMMENT' AND EXISTS (SELECT 1 FROM "Comment" WHERE id = target_id))
);
```

### 2. 添加应用层验证

在 API 中验证 targetId 是否存在：

```typescript
// 创建互动前验证
if (targetType === 'POST') {
  const postExists = await prisma.post.findUnique({
    where: { id: targetId }
  });
  if (!postExists) {
    return { error: 'Post not found' };
  }
}
```

### 3. 使用 TypeScript 类型保护

```typescript
type PostInteraction = {
  targetType: 'POST';
  targetId: number;
  // ... other fields
};

type CommentInteraction = {
  targetType: 'COMMENT';
  targetId: number;
  // ... other fields
};

type Interaction = PostInteraction | CommentInteraction;

// 类型保护函数
function isPostInteraction(i: Interaction): i is PostInteraction {
  return i.targetType === 'POST';
}
```

## 常见问题

### Q: 如何防止引用不存在的 Post 或 Comment？

A: 在应用层添加验证（见上面的优化建议 #2）。

### Q: 删除 Post 或 Comment 时，Interaction 会自动删除吗？

A: 不会。需要在应用层处理：

```typescript
// 删除 Post 时
await prisma.$transaction([
  prisma.interaction.deleteMany({
    where: { targetType: 'POST', targetId: postId }
  }),
  prisma.post.delete({
    where: { id: postId }
  })
]);
```

或使用数据库触发器（Trigger）。

### Q: 性能会受影响吗？

A: 不会。索引已优化，查询性能与有关联的方案相同。

## 总结

这个修复移除了 Prisma 不支持的多态关联，改为在应用层处理。这是一个成熟且广泛使用的模式，既保持了代码简洁，又避免了 ORM 的限制。

---

**修复完成时间**: 2026-02-04
**相关文件**:
- `prisma/schema.prisma`
- `app/api/interactions/route.ts`
- `prisma/seed.ts`
