# OpenAPI 文档设置指南

## 概述

项目已集成完整的 OpenAPI 3.0 文档系统，提供交互式 API 文档和标准化的 API 规范。

## 功能特性

✅ **交互式文档** - 基于 Swagger UI 的可视化界面
✅ **Try it Out** - 直接在浏览器中测试 API
✅ **完整的 Schema 定义** - 所有数据模型的详细说明
✅ **多种导出格式** - JSON/YAML 格式
✅ **团队协作** - 可分享给其他开发者

---

## 快速开始

### 1. 安装依赖

```bash
yarn add swagger-ui-react
yarn add -D next-swagger-doc swagger-jsdoc @types/swagger-ui-react
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问 API 文档

打开浏览器访问：

```
http://localhost:3002/api-docs
```

---

## 文档访问方式

### 方式一：交互式 Swagger UI（推荐）

**URL**: `http://localhost:3002/api-docs`

**功能**:
- 📖 浏览所有 API 端点
- 🧪 在线测试 API（Try it Out）
- 📊 查看请求/响应示例
- 🔍 搜索和筛选 API
- 📝 查看完整的 Schema 定义

**使用方法**:
1. 选择要测试的 API 端点
2. 点击 "Try it out" 按钮
3. 填写必需的参数
4. 点击 "Execute" 发送请求
5. 查看响应结果

### 方式二：OpenAPI JSON 规范

**URL**: `http://localhost:3002/api/openapi`

**用途**:
- 导入到 Postman
- 导入到 Insomnia
- 使用 API 测试工具
- 生成客户端 SDK
- CI/CD 集成

### 方式三：静态文件

生成静态 OpenAPI JSON 文件：

```bash
npm run docs:generate
```

文件将保存到 `public/openapi.json`，可以：
- 下载分享给团队成员
- 上传到 API 文档托管平台
- 版本控制

---

## API 端点概览

### 📋 Profiles (用户档案)
- `GET /api/profiles` - 获取用户列表
- `POST /api/profiles` - 创建用户
- `GET /api/profiles/{id}` - 获取单个用户
- `PATCH /api/profiles/{id}` - 更新用户

### 📝 Posts (帖子)
- `GET /api/posts` - 获取帖子列表
- `POST /api/posts` - 创建帖子
- `GET /api/posts/{id}` - 获取单个帖子
- `PATCH /api/posts/{id}` - 更新帖子
- `DELETE /api/posts/{id}` - 删除帖子

### 💬 Comments (评论)
- `GET /api/posts/{id}/comments` - 获取评论
- `POST /api/posts/{id}/comments` - 创建评论

### 📰 News (新闻)
- `GET /api/news` - 获取新闻列表
- `POST /api/news` - 创建新闻

### ❤️ Interactions (互动)
- `POST /api/interactions` - 创建互动
- `DELETE /api/interactions` - 删除互动

### 👥 Follows (关注)
- `POST /api/follows` - 关注用户
- `DELETE /api/follows` - 取消关注

---

## 导入到 Postman

### 方法 1: 直接导入 URL

1. 打开 Postman
2. 点击 "Import" 按钮
3. 选择 "Link" 标签
4. 输入: `http://localhost:3002/api/openapi`
5. 点击 "Continue" 并确认导入

### 方法 2: 导入静态文件

1. 生成静态文件: `npm run docs:generate`
2. 在 Postman 中点击 "Import"
3. 选择 "File" 标签
4. 选择 `public/openapi.json`
5. 完成导入

---

## 导入到 Insomnia

1. 打开 Insomnia
2. 点击 "Create" → "Import from File"
3. 选择生成的 `public/openapi.json`
4. 或输入 URL: `http://localhost:3002/api/openapi`

---

## 生成客户端 SDK

使用 OpenAPI Generator 生成各种语言的客户端：

### TypeScript/JavaScript
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3002/api/openapi \
  -g typescript-fetch \
  -o ./sdk/typescript
```

### Python
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3002/api/openapi \
  -g python \
  -o ./sdk/python
```

### Java
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3002/api/openapi \
  -g java \
  -o ./sdk/java
```

---

## 自定义文档

### 修改配置

编辑 `lib/swagger/config.ts` 来自定义：

```typescript
export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Your API Title',
    version: '1.0.0',
    description: 'Your API Description',
    // ... 更多配置
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Development'
    },
    {
      url: 'https://api.yourdomain.com',
      description: 'Production'
    }
  ]
};
```

### 添加新的 API 端点

编辑 `lib/swagger/spec.ts`，添加新的路径定义：

```typescript
'/api/your-endpoint': {
  get: {
    tags: ['YourTag'],
    summary: 'Your endpoint description',
    // ... 完整的 OpenAPI 定义
  }
}
```

### 添加新的 Schema

在 `lib/swagger/config.ts` 的 `components.schemas` 中添加：

```typescript
YourSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
}
```

---

## Swagger UI 配置选项

在 `app/api-docs/page.tsx` 中自定义 Swagger UI：

```typescript
<SwaggerUI
  url="/api/openapi"
  docExpansion="list"        // 'list' | 'full' | 'none'
  defaultModelsExpandDepth={3}
  defaultModelExpandDepth={3}
  displayRequestDuration={true}
  filter={true}              // 启用搜索
  tryItOutEnabled={true}     // 启用 Try it Out
  deepLinking={true}         // 启用深度链接
  persistAuthorization={true} // 保持认证信息
/>
```

---

## 部署到生产环境

### Vercel 部署

文档会自动随应用部署，访问：
```
https://your-app.vercel.app/api-docs
```

### 静态文档托管

1. 生成静态文件:
```bash
npm run docs:generate
```

2. 上传 `public/openapi.json` 到:
   - GitHub Pages
   - Netlify
   - AWS S3
   - 任何静态文件托管服务

### Swagger Hub

1. 访问 [SwaggerHub](https://swagger.io/tools/swaggerhub/)
2. 创建新的 API
3. 上传生成的 `openapi.json`
4. 分享公开链接

---

## 最佳实践

### 1. 保持文档同步
每次修改 API 时，同时更新 OpenAPI 规范：
```bash
npm run docs:generate
```

### 2. 使用版本控制
将 `openapi.json` 纳入 Git 版本控制：
```bash
git add public/openapi.json
git commit -m "docs: update OpenAPI spec"
```

### 3. CI/CD 集成
在 CI/CD 流程中自动验证 API 规范：
```yaml
# .github/workflows/api-docs.yml
- name: Validate OpenAPI
  run: |
    npm run docs:generate
    npx @apidevtools/swagger-cli validate public/openapi.json
```

### 4. 团队协作
- 将 `/api-docs` 链接分享给团队
- 在代码审查中检查 API 变更
- 使用 Postman/Insomnia Collections 进行团队同步

---

## 故障排除

### 问题：Swagger UI 页面空白

**解决方案**:
1. 检查浏览器控制台错误
2. 确保 `/api/openapi` 返回正确的 JSON
3. 清除浏览器缓存

### 问题：Try it Out 失败

**解决方案**:
1. 检查 CORS 配置
2. 确保 API 服务器正在运行
3. 验证请求参数格式

### 问题：Schema 未正确显示

**解决方案**:
1. 检查 `lib/swagger/config.ts` 中的 schema 定义
2. 确保使用正确的 `$ref` 引用
3. 验证 JSON 格式

---

## 示例：测试 API

### 1. 获取帖子列表

1. 访问 `http://localhost:3002/api-docs`
2. 找到 `GET /api/posts`
3. 点击 "Try it out"
4. 设置参数:
   - `filter`: `hot`
   - `limit`: `5`
5. 点击 "Execute"
6. 查看响应

### 2. 创建新帖子

1. 找到 `POST /api/posts`
2. 点击 "Try it out"
3. 修改请求体:
```json
{
  "authorId": "your-user-id",
  "title": "Test Post",
  "content": "This is a test post",
  "tags": ["test"]
}
```
4. 点击 "Execute"

---

## 扩展资源

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Postman OpenAPI Support](https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/)

---

## 命令总结

```bash
# 启动开发服务器（包含 API 文档）
npm run dev

# 生成静态 OpenAPI JSON
npm run docs:generate

# 访问交互式文档
open http://localhost:3002/api-docs

# 获取 OpenAPI JSON
curl http://localhost:3002/api/openapi > openapi.json
```

---

**文档版本**: v1.0
**最后更新**: 2026-02-04
**维护者**: 开发团队
