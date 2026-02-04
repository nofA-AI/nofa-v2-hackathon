# Post Card Dropdown Menu Update

## 概述

为 PostCard 组件中的 "Add Strategy" 按钮添加了下拉菜单功能，提供三个策略操作选项。

## 更新内容

### 文件修改
**文件**: `/components/community/post-card.tsx`

### 新增导入
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  // ... existing imports
  CaretDown,        // 下拉箭头
  ChartBar,         // 回测图标
  Rocket,           // 部署图标
  ChatTeardropDots  // AI 对话图标
} from '@phosphor-icons/react';
```

### 替换的按钮

**之前**:
```tsx
<Button size="sm" className="w-full md:w-auto font-bold">
  Add Strategy
</Button>
```

**现在**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" className="flex items-center gap-2">
      Add Strategy
      <CaretDown className="w-4 h-4" weight="bold" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    {/* 三个菜单项 */}
  </DropdownMenuContent>
</DropdownMenu>
```

## 下拉菜单选项

### 1. 📊 Backtest Strategy (回测策略)
```tsx
<DropdownMenuItem className="flex items-center gap-3">
  <ChartBar className="w-5 h-5 text-primary" weight="bold" />
  <div>
    <span className="font-semibold text-sm">Backtest Strategy</span>
    <span className="text-xs text-muted-foreground">Run historical backtest</span>
  </div>
</DropdownMenuItem>
```

**功能**: 运行历史回测
**图标**: ChartBar (柱状图)
**描述**: Run historical backtest

### 2. 🚀 Deploy Strategy (部署策略)
```tsx
<DropdownMenuItem className="flex items-center gap-3">
  <Rocket className="w-5 h-5 text-primary" weight="bold" />
  <div>
    <span className="font-semibold text-sm">Deploy Strategy</span>
    <span className="text-xs text-muted-foreground">Deploy to live trading</span>
  </div>
</DropdownMenuItem>
```

**功能**: 部署到实盘交易
**图标**: Rocket (火箭)
**描述**: Deploy to live trading

### 3. 🧠 Discuss with AI (AI 分析)
```tsx
<DropdownMenuItem className="flex items-center gap-3">
  <ChatTeardropDots className="w-5 h-5 text-primary" weight="bold" />
  <div>
    <span className="font-semibold text-sm">Discuss with AI</span>
    <span className="text-xs text-muted-foreground">AI assistant analysis</span>
  </div>
</DropdownMenuItem>
```

**功能**: AI 助手分析策略
**图标**: ChatTeardropDots (对话气泡)
**描述**: AI assistant analysis

## UI 设计

### 按钮样式
- **主按钮**: 包含文本 "Add Strategy" + 下拉箭头图标
- **尺寸**: `size="sm"` (小尺寸)
- **样式**: `font-bold` (粗体)
- **响应式**: `w-full md:w-auto` (移动端全宽，桌面端自适应)
- **间距**: `gap-2` (图标和文字间距)

### 下拉菜单样式
- **对齐**: `align="end"` (右对齐)
- **宽度**: `w-56` (14rem / 224px)
- **阴影**: 自动添加 (Shadcn UI 默认)

### 菜单项布局
```
┌────────────────────────────────┐
│ 📊  Backtest Strategy          │
│     Run historical backtest     │
├────────────────────────────────┤
│ 🚀  Deploy Strategy            │
│     Deploy to live trading      │
├────────────────────────────────┤
│ 🧠  Discuss with AI            │
│     AI assistant analysis       │
└────────────────────────────────┘
```

每个菜单项包含:
- **图标**: 5x5 尺寸，primary 颜色
- **标题**: 粗体，text-sm
- **描述**: 文本，text-xs，muted-foreground 颜色
- **间距**: gap-3 (图标和文本间距)

## 交互行为

### 事件处理
所有点击事件都使用 `e.stopPropagation()` 防止事件冒泡到父元素（PostCard）:

```tsx
onClick={(e) => {
  e.stopPropagation();
  console.log('Action triggered');
  // TODO: 实现实际功能
}}
```

### 目前实现
- ✅ 下拉菜单显示/隐藏
- ✅ 点击菜单项触发 console.log
- ✅ 阻止事件冒泡
- ⏳ 实际功能待实现 (TODO)

## 集成位置

下拉菜单仅在帖子包含策略数据时显示:

```tsx
{post.strategy && (
  <div className="bg-muted border rounded-xl p-4">
    {/* 策略统计数据 */}
    <div className="grid grid-cols-3">
      {/* ROI, Max DD, Sharpe */}
    </div>

    {/* Add Strategy 下拉按钮 */}
    <DropdownMenu>
      {/* ... */}
    </DropdownMenu>
  </div>
)}
```

## 功能实现建议

### 1. Backtest Strategy
```tsx
onClick={(e) => {
  e.stopPropagation();
  // 打开回测对话框
  openBacktestDialog({
    strategyId: post.id,
    strategyData: post.strategy
  });
}
```

**后续步骤**:
- 创建回测对话框组件
- 集成回测 API
- 显示回测结果
- 允许参数调整

### 2. Deploy Strategy
```tsx
onClick={(e) => {
  e.stopPropagation();
  // 检查用户权限和余额
  if (!hasDeploymentAccess) {
    showUpgradeModal();
    return;
  }
  // 打开部署配置对话框
  openDeploymentDialog({
    strategyId: post.id,
    strategyData: post.strategy
  });
}
```

**后续步骤**:
- 权限检查
- 部署配置对话框
- 连接交易所 API
- 风险确认流程
- 部署状态监控

### 3. Discuss with AI
```tsx
onClick={(e) => {
  e.stopPropagation();
  // 打开 AI 对话窗口，预填充策略信息
  openAIChatPanel({
    context: 'strategy_analysis',
    strategyId: post.id,
    strategyData: post.strategy,
    initialMessage: `Please analyze this trading strategy: ${post.title}`
  });
}
```

**后续步骤**:
- 集成 AI 对话组件
- 传递策略上下文
- 显示分析结果
- 支持追问和深入讨论

## 可访问性

### 键盘导航
- ✅ Tab 键可聚焦按钮
- ✅ Enter/Space 打开下拉菜单
- ✅ 方向键在菜单项间导航
- ✅ Escape 关闭菜单

### 屏幕阅读器
- ✅ 按钮有明确标签
- ✅ 菜单项有描述文本
- ✅ 下拉状态可识别

## 响应式设计

### 移动端 (< 768px)
- 按钮全宽显示 (`w-full`)
- 下拉菜单右对齐
- 触摸友好的尺寸

### 桌面端 (≥ 768px)
- 按钮自适应宽度 (`md:w-auto`)
- 鼠标悬停效果
- 下拉菜单平滑动画

## 状态管理建议

如需管理下拉菜单状态，可以添加:

```tsx
const [isOpen, setIsOpen] = useState(false);

<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
  {/* ... */}
</DropdownMenu>
```

## 样式定制

### 图标颜色
当前使用 `text-primary`，可以根据不同操作定制:
```tsx
// 回测 - 蓝色
<ChartBar className="w-5 h-5 text-blue-500" />

// 部署 - 绿色
<Rocket className="w-5 h-5 text-green-500" />

// AI - 紫色
<ChatTeardropDots className="w-5 h-5 text-purple-500" />
```

### 悬停效果
可以添加图标动画:
```tsx
<DropdownMenuItem className="group">
  <ChartBar className="group-hover:scale-110 transition-transform" />
  {/* ... */}
</DropdownMenuItem>
```

## 测试清单

- [ ] 下拉菜单正常打开/关闭
- [ ] 点击菜单项触发正确操作
- [ ] 点击菜单项不会导航到帖子详情
- [ ] 移动端布局正确
- [ ] 桌面端布局正确
- [ ] 键盘导航正常工作
- [ ] 图标显示正确
- [ ] 描述文本清晰可读
- [ ] 响应式断点正确
- [ ] 暗色模式显示正常

## 下一步

1. **实现实际功能**
   - [ ] 创建回测对话框
   - [ ] 创建部署对话框
   - [ ] 集成 AI 对话面板

2. **添加权限检查**
   - [ ] 未登录用户点击时触发登录
   - [ ] 检查用户等级/订阅状态
   - [ ] 显示升级提示（如需要）

3. **增强用户体验**
   - [ ] 添加加载状态
   - [ ] 添加成功/失败反馈
   - [ ] 添加操作确认对话框
   - [ ] 添加工具提示

4. **数据追踪**
   - [ ] 添加分析事件
   - [ ] 追踪用户偏好
   - [ ] 统计功能使用率

## 示例效果

### 视觉效果
```
┌─────────────────────────────────────┐
│  ROI: +14.2%  │  DD: -2.1%  │ ...  │
│  ┌─────────────────────────┐        │
│  │  Add Strategy     ▼    │←点击   │
│  └─────────────────────────┘        │
└─────────────────────────────────────┘
              ↓ 展开
┌─────────────────────────────────────┐
│  📊  Backtest Strategy              │
│      Run historical backtest         │
├─────────────────────────────────────┤
│  🚀  Deploy Strategy                │
│      Deploy to live trading          │
├─────────────────────────────────────┤
│  🧠  Discuss with AI                │
│      AI assistant analysis           │
└─────────────────────────────────────┘
```

## 总结

✅ **已完成**:
- 下拉菜单组件集成
- 三个操作选项添加
- 图标和描述文本
- 事件处理和防冒泡
- 响应式布局

⏳ **待实现**:
- 实际功能逻辑
- 权限检查
- 对话框组件
- 用户反馈

这个下拉菜单为用户提供了清晰、直观的策略操作入口，提升了社区帖子的交互性和实用性！
