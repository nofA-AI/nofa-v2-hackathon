# Prisma 7 迁移指南

## 概述

Prisma 7 引入了重大变更，主要是将数据源配置从 `schema.prisma` 移到了 `prisma.config.ts`。

## 主要变更

### 1. Schema 文件简化

**之前 (Prisma 6 及以下)**:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

**现在 (Prisma 7)**:
```prisma
datasource db {
  provider = "postgresql"
}
```

### 2. 新增配置文件

创建 `prisma/prisma.config.ts`:

```typescript
import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
      directUrl: process.env.POSTGRES_URL_NON_POOLING,
    },
  },
});
```

### 3. PrismaClient 配置更新

**之前**:
```typescript
const prisma = new PrismaClient();
```

**现在**:
```typescript
const prisma = new PrismaClient({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL,
});
```

或使用 Accelerate:
```typescript
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL,
}).$extends(withAccelerate());
```

## 已修复的文件

1. ✅ **`prisma/schema.prisma`** - 移除了 url 和 directUrl
2. ✅ **`prisma/prisma.config.ts`** - 新增配置文件
3. ✅ **`lib/db/prisma.ts`** - 更新了 PrismaClient 创建方式

## 迁移步骤

### 1. 重新生成 Prisma Client

```bash
npm run db:generate
```

### 2. 推送 Schema 到数据库

```bash
npm run db:push
```

或使用 migration:
```bash
npm run db:migrate
```

### 3. 验证配置

```bash
# 启动开发服务器
npm run dev

# 测试数据库连接
npm run db:studio
```

## 环境变量

确保 `.env` 文件包含必要的数据库连接字符串：

```env
# PostgreSQL 数据库连接
POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/dbname"

# 如果使用 Prisma Accelerate
# POSTGRES_PRISMA_URL="prisma://accelerate.prisma-data.net/?api_key=..."
```

## 配置选项说明

### `datasourceUrl`
- 直接在 PrismaClient 构造函数中传入
- 优先级高于 `prisma.config.ts`
- 适合需要动态配置的场景

### `prisma.config.ts`
- 集中管理数据源配置
- 支持多个环境配置
- 更好的类型安全

### Accelerate Extension
- 仅在使用 Prisma Accelerate 时需要
- 提供全球边缘缓存和连接池
- 自动检测 URL 中的 `accelerate.prisma-data.net`

## 常见问题

### Q: 为什么要移除 schema.prisma 中的 URL？

A: Prisma 7 将配置和 schema 分离，使得：
- Schema 更纯粹（只定义模型）
- 配置更灵活（支持多环境）
- 类型安全性更好

### Q: 还能用 .env 文件吗？

A: 可以！`prisma.config.ts` 中可以读取 `process.env`：

```typescript
export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Q: Migration 会受影响吗？

A: 不会。Migration 仍然正常工作：

```bash
npm run db:migrate      # 创建 migration
npm run db:push         # 推送 schema（不创建 migration）
```

### Q: 生产环境需要改什么？

A: 确保环境变量正确配置即可。`prisma.config.ts` 会自动读取环境变量。

### Q: 如何使用多个数据库？

A: 在 `prisma.config.ts` 中配置：

```typescript
export default defineConfig({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL,
    },
    analytics: {
      url: process.env.ANALYTICS_DB_URL,
    },
  },
});
```

## 最佳实践

### 1. 使用环境变量

```typescript
// ✅ 推荐
export default defineConfig({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
      directUrl: process.env.POSTGRES_URL_NON_POOLING,
    },
  },
});

// ❌ 不推荐（硬编码）
export default defineConfig({
  datasources: {
    db: {
      url: 'postgresql://user:pass@localhost:5432/db',
    },
  },
});
```

### 2. 条件性使用 Accelerate

```typescript
const createPrismaClient = () => {
  const client = new PrismaClient({
    datasourceUrl: process.env.POSTGRES_PRISMA_URL,
  });

  // 仅在使用 Accelerate 时应用扩展
  if (process.env.POSTGRES_PRISMA_URL?.includes('accelerate.prisma-data.net')) {
    return client.$extends(withAccelerate());
  }

  return client;
};
```

### 3. 开发环境优化

```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient();

// 防止热重载时创建多个实例
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## 性能优化

### 使用连接池

```env
# 连接池配置（推荐用于生产环境）
POSTGRES_PRISMA_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=10"
```

### 使用 Accelerate

```env
# Prisma Accelerate（全球边缘缓存）
POSTGRES_PRISMA_URL="prisma://accelerate.prisma-data.net/?api_key=your_api_key"
```

## 故障排除

### 错误：找不到 datasource

```bash
Error: Prisma schema validation error
```

**解决方案**：
1. 确保 `prisma.config.ts` 存在
2. 检查环境变量是否正确
3. 重新生成 Prisma Client: `npm run db:generate`

### 错误：无法连接数据库

**解决方案**：
1. 验证环境变量：
```bash
echo $POSTGRES_PRISMA_URL
```

2. 测试数据库连接：
```bash
npm run db:studio
```

3. 检查数据库是否运行：
```bash
psql -h localhost -U postgres -c "SELECT version();"
```

## 参考资料

- [Prisma 7 发布说明](https://www.prisma.io/blog/prisma-7-stable)
- [配置迁移指南](https://pris.ly/d/config-datasource)
- [PrismaClient 配置](https://pris.ly/d/prisma7-client-config)
- [Prisma Accelerate 文档](https://www.prisma.io/docs/accelerate)

---

**迁移完成时间**: 2026-02-04
**Prisma 版本**: 7.3.0
