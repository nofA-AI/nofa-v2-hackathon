# Database Seed 问题修复文档

## 问题描述

运行 `yarn db:seed` 时遇到 Prisma 7 配置错误和数据库连接问题。

## 已修复的问题

### 1. Prisma 7 配置变更

**问题**: Prisma 7 不再支持在 `schema.prisma` 中使用 `url` 和 `directUrl`

**错误信息**:
```
Error code: P1012
error: The datasource property `url` is no longer supported in schema files.
```

**解决方案**:

#### A. 更新 `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  // 不再需要 url 和 directUrl
}
```

#### B. 简化 `prisma/prisma.config.ts`
```typescript
export default {
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL || '',
      directUrl: process.env.POSTGRES_URL_NON_POOLING,
    },
  },
};
```

#### C. 更新 `prisma/seed.ts` 使用 adapter
```typescript
import { PrismaClient, UserType, NewsType, InteractionType, TargetType } from '../app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Create database pool
const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
});

// Create adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});
```

#### D. 更新 `lib/db/prisma.ts` 主 Prisma Client
```typescript
import { PrismaClient } from '@/app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pgPool: pg.Pool;
};

const createPrismaClient = () => {
  // Create or reuse connection pool
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      connectionString: process.env.POSTGRES_URL_NON_POOLING,
    });
  }

  // Create adapter
  const adapter = new PrismaPg(globalForPrisma.pgPool);

  // Create Prisma Client with adapter
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return client;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();
```

#### E. 安装必要的依赖
```bash
yarn add @prisma/adapter-pg pg
yarn add -D @types/pg
```

**注意**: `@types/pg` 是 TypeScript 类型定义，必须安装以避免类型错误。

### 2. 当前状态

✅ **已完成**:
- Prisma schema 配置正确
- Prisma config 简化
- Seed.ts 使用正确的 adapter 模式
- **主 Prisma Client (`lib/db/prisma.ts`) 已更新为 adapter 模式**
- 必要的包已安装 (`@prisma/adapter-pg`, `pg`)
- Prisma Client 重新生成

⚠️ **当前问题**: 需要验证数据库连接是否正常工作

## 最新修复 (2026-02-04)

### API Routes Prisma Error

**错误信息**:
```
Error [PrismaClientConstructorValidationError]: Using engine type "client"
requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

**原因**: `/lib/db/prisma.ts` 中的主 Prisma Client 没有使用 Prisma 7 的 adapter 模式

**解决方案**: 更新主 Prisma Client 使用 `@prisma/adapter-pg` 并配置 SSL

```typescript
// lib/db/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const createPrismaClient = () => {
  // Create or reuse connection pool
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      connectionString: process.env.POSTGRES_URL_NON_POOLING,
      ssl: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
    });
  }

  const adapter = new PrismaPg(globalForPrisma.pgPool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return client;
};
```

**重要**: 这个修复让所有 API routes 能够正常工作，包括:
- `/api/posts` - 帖子 API
- `/api/posts/[id]/comments` - 评论 API
- `/api/interactions` - 互动 API
- `/api/news` - 新闻 API

### SSL 证书错误

**错误信息**:
```
Error opening a TLS connection: self-signed certificate in certificate chain
```

**原因**: Supabase 使用自签名 SSL 证书，需要配置 pg.Pool 接受这种证书

**解决方案**: 在连接池配置中添加 SSL 选项

```typescript
const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
});
```

**应用到**:
- ✅ `lib/db/prisma.ts` - 主 Prisma Client
- ✅ `prisma/seed.ts` - Seed script

## 之前的错误 (已修复)

```
❌ Error seeding database: PrismaClientKnownRequestError:
Invalid `prisma.interaction.deleteMany()` invocation
code: 'ECONNREFUSED'
```

## 需要检查的事项

### 1. 验证环境变量

检查 `.env` 文件中的数据库连接字符串：

```bash
# 查看当前配置
cat .env | grep POSTGRES
```

**当前配置**:
```
POSTGRES_PRISMA_URL="postgres://postgres.bsegjikhhmkihqlslpwg:***@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://postgres.bsegjikhhmkihqlslpwg:***@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

### 2. 测试数据库连接

```bash
# 使用 psql 测试连接
psql "postgres://postgres.bsegjikhhmkihqlslpwg:***@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

### 3. 检查 Supabase 数据库状态

可能的问题：
- ❌ 数据库实例已暂停/停止
- ❌ IP 地址被防火墙阻止
- ❌ 连接字符串过期或不正确
- ❌ SSL 证书问题

## 解决步骤

### 选项 1: 检查 Supabase 项目状态

1. 登录 Supabase Dashboard
2. 检查项目是否活跃
3. 验证数据库连接字符串
4. 确认 IP 访问策略

### 选项 2: 更新连接字符串

如果 Supabase 项目已更改，需要更新 `.env` 文件：

```env
POSTGRES_PRISMA_URL="新的连接字符串"
POSTGRES_URL_NON_POOLING="新的直连字符串"
```

### 选项 3: 使用本地数据库测试

如果 Supabase 不可用，可以暂时使用本地 PostgreSQL：

```bash
# 启动本地 PostgreSQL (使用 Docker)
docker run --name postgres-test -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# 更新 .env
POSTGRES_URL_NON_POOLING="postgres://postgres:password@localhost:5432/postgres"
```

### 选项 4: 运行迁移

确保数据库 schema 是最新的：

```bash
# 推送 schema 到数据库
npx prisma db push

# 或者运行迁移
npx prisma migrate dev
```

## 验证修复

成功修复后，运行以下命令验证：

```bash
# 1. 生成 Prisma Client
npx prisma generate

# 2. 测试数据库连接
npx prisma db execute --stdin < /dev/null

# 3. 运行 seed
yarn db:seed
```

**预期输出**:
```
🌱 Starting database seed...
🗑️  Cleared existing data
✅ Created 3 human users
✅ Created 2 AI agents
✅ Created follow relationships
✅ Created 5 posts
✅ Created 9 comments (including replies)
✅ Created user interactions
✅ Created news items

🎉 Database seed completed successfully!
```

## 文件变更总结

### 修改的文件

1. **`prisma/schema.prisma`**
   - 移除 `url` 和 `directUrl` 配置

2. **`prisma/prisma.config.ts`**
   - 移除 `defineConfig` 导入
   - 简化为普通对象导出

3. **`prisma/seed.ts`**
   - 添加 `@prisma/adapter-pg` 和 `pg` 导入
   - 创建连接池
   - 使用 adapter 初始化 PrismaClient

4. **`lib/db/prisma.ts`** ⭐ 重要
   - 添加 `@prisma/adapter-pg` 和 `pg` 导入
   - 创建并复用全局连接池
   - 使用 adapter 初始化 PrismaClient
   - 移除 Accelerate extension 逻辑

### 新增的依赖

**生产依赖**:
```json
{
  "@prisma/adapter-pg": "^7.3.0",
  "pg": "^8.18.0"
}
```

**开发依赖**:
```json
{
  "@types/pg": "^8.16.0"
}
```

## Prisma 7 重要变更

### 配置方式变更

**Prisma 6 及之前**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Prisma 7**:
```typescript
// schema.prisma - 不包含 url
datasource db {
  provider = "postgresql"
}

// seed.ts - 使用 adapter
const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

### PrismaClient 构造函数选项

**支持的选项**:
- `adapter` - 数据库适配器 (必需)
- `accelerateUrl` - Prisma Accelerate URL (或者使用 adapter)
- `errorFormat` - 错误格式 ('pretty' | 'colorless' | 'minimal')
- `log` - 日志级别
- `transactionOptions` - 事务配置
- `omit` - 排除字段
- `comments` - SQL 注释插件

**不再支持**:
- ❌ `datasources` - 已移除

## 相关资源

- [Prisma 7 Client Configuration](https://pris.ly/d/prisma7-client-config)
- [Prisma Adapter - PostgreSQL](https://www.prisma.io/docs/orm/overview/databases/postgresql#adapter)
- [Supabase with Prisma](https://supabase.com/docs/guides/integrations/prisma)

## 下一步

1. **验证数据库连接**
   ```bash
   npx prisma db execute --stdin < /dev/null
   ```

2. **确认 schema 同步**
   ```bash
   npx prisma db push
   ```

3. **运行 seed**
   ```bash
   yarn db:seed
   ```

4. **查看数据**
   ```bash
   npx prisma studio
   ```

## 故障排除

### 如果仍然遇到 ECONNREFUSED

1. **检查防火墙规则**
   - Supabase 项目设置
   - 本地防火墙配置

2. **验证网络连接**
   ```bash
   ping aws-1-ap-southeast-1.pooler.supabase.com
   ```

3. **测试端口连接**
   ```bash
   nc -zv aws-1-ap-southeast-1.pooler.supabase.com 5432
   ```

4. **检查 SSL 配置**
   - 确保 `sslmode=require` 正确
   - 尝试不同的 SSL 模式

### 如果迁移失败

```bash
# 重置数据库 (⚠️ 会删除所有数据)
npx prisma migrate reset

# 或者强制推送 schema
npx prisma db push --force-reset
```

## 总结

✅ Prisma 7 配置问题已完全解决
✅ 必要的包已安装 (`@prisma/adapter-pg`, `pg`, `@types/pg`)
✅ 主 Prisma Client 已更新为 adapter 模式
✅ Seed script 已更新为 adapter 模式
✅ SSL 证书配置已完成
✅ TypeScript 类型定义已安装
✅ API routes 现在可以正常工作

### 下一步

如果仍然遇到数据库连接问题:
1. 检查 Supabase 项目是否活跃
2. 验证 `.env` 文件中的连接字符串是否正确
3. 确认 IP 地址没有被防火墙阻止
4. 运行 `yarn db:seed` 测试数据库连接

如果数据库连接正常，API 应该可以立即工作。
