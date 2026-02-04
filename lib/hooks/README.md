# React Query Hooks

使用 TanStack Query 封装的 API hooks，提供缓存、自动重新验证和更好的状态管理。

## 用户信息 Hook

### `useUser()`

获取当前登录用户信息，带自动缓存和刷新。

```typescript
import { useUser } from '@/lib/hooks/use-user';

function MyComponent() {
  const { user, loading, error, refetch } = useUser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Wallets: {user?.wallets.length}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

**特性：**
- ✅ 自动缓存 5 分钟
- ✅ 只在已登录时请求
- ✅ 多个组件共享缓存
- ✅ 提供 `refetch()` 手动刷新

## 创建自定义 Query Hook

### 模板

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface MyData {
  // 定义数据类型
}

async function fetchMyData(id: string): Promise<MyData> {
  const response = await apiClient.get<MyData>(\`/api/my-endpoint/\${id}\`);
  return response.data;
}

export function useMyData(id: string) {
  return useQuery({
    queryKey: ['myData', id], // 缓存键
    queryFn: () => fetchMyData(id),
    enabled: !!id, // 条件启用
    staleTime: 2 * 60 * 1000, // 2 分钟
  });
}
```

### Mutation Hook (POST/PUT/DELETE)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface CreateData {
  name: string;
}

async function createItem(data: CreateData) {
  const response = await apiClient.post('/api/items', data);
  return response.data;
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      // 成功后刷新列表
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

// 使用
function MyComponent() {
  const createMutation = useCreateItem();

  const handleCreate = () => {
    createMutation.mutate({ name: 'New Item' });
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createMutation.isPending}
    >
      {createMutation.isPending ? 'Creating...' : 'Create'}
    </button>
  );
}
```

## Query 配置选项

### 常用选项

```typescript
useQuery({
  queryKey: ['key'],
  queryFn: fetchData,

  // 数据新鲜度
  staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求

  // 缓存时间
  gcTime: 10 * 60 * 1000, // 10 分钟后清理缓存

  // 重试
  retry: 3, // 失败重试 3 次

  // 条件启用
  enabled: true, // 是否启用查询

  // 窗口聚焦时重新请求
  refetchOnWindowFocus: false,

  // 网络重连时重新请求
  refetchOnReconnect: true,
});
```

## DevTools

开发环境下会自动显示 React Query DevTools，可以查看：
- 所有查询的状态
- 缓存的数据
- 查询时间线
- 手动触发查询

按 `Ctrl/Cmd + Shift + D` 切换显示。

## 安装依赖

如果项目中还没有 TanStack Query：

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
# or
yarn add @tanstack/react-query @tanstack/react-query-devtools
```
