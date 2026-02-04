# API Client

认证的 HTTP 客户端，自动添加 Privy 授权 token。

## 设置

`ApiClientProvider` 已经在 `app/layout.tsx` 中配置好了，会自动使用 Privy 的 `getAccessToken()` 方法获取正确的 access token。

## 使用方式

### 1. 使用默认客户端（推荐）

```typescript
import { apiClient } from '@/lib/api/client';

// GET 请求
const response = await apiClient.get('/api/endpoint');

// POST 请求
const response = await apiClient.post('/api/endpoint', {
  key: 'value'
});

// 其他方法
await apiClient.put('/api/endpoint', data);
await apiClient.patch('/api/endpoint', data);
await apiClient.delete('/api/endpoint');
```

### 2. 创建自定义客户端

```typescript
import { createAuthenticatedClient } from '@/lib/api/client';

const myClient = createAuthenticatedClient('https://api.example.com');
const response = await myClient.get('/endpoint');
```

### 3. 使用自定义 Token

```typescript
import { createClientWithToken } from '@/lib/api/client';
import { usePrivy } from '@privy-io/react-auth';

function MyComponent() {
  const { getAccessToken } = usePrivy();

  const fetchData = async () => {
    const token = await getAccessToken();
    const client = createClientWithToken(token);
    const response = await client.get('/api/endpoint');
  };
}
```

### 4. Backtest 专用客户端

```typescript
import { backtestClient } from '@/lib/api/backtest-client';

const response = await backtestClient.post('/backtest/run', {
  strategy: strategyTree,
  capital: 10000,
  // ...
});
```

## 特性

- ✅ 自动从 cookie 读取 Privy token
- ✅ 自动添加 Authorization header
- ✅ 401 错误自动处理
- ✅ 30 秒请求超时
- ✅ TypeScript 类型支持

## 环境变量

```env
NEXT_PUBLIC_BACKTEST_API_URL=https://your-api-url.com/api/v1
```

## 安装依赖

如果项目中还没有 axios：

```bash
npm install axios
# or
yarn add axios
```
