'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, Target, Zap } from 'lucide-react';

interface GuideViewProps {
  onGetStarted: () => void;
}

export function GuideView({ onGetStarted }: GuideViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex items-center justify-center p-6 bg-background"
    >
      <Card className="max-w-2xl w-full p-8 shadow-lg">
        <div className="text-center space-y-6">
          {/* Welcome Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                欢迎来到交易策略平台
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              我们已经为您创建了第一个策略，让我们开始您的交易之旅！
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">策略编辑器</h3>
              <p className="text-sm text-muted-foreground text-center">
                可视化构建交易策略
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
              <Target className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">回测系统</h3>
              <p className="text-sm text-muted-foreground text-center">
                验证策略历史表现
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
              <Zap className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">AI 助手</h3>
              <p className="text-sm text-muted-foreground text-center">
                智能生成交易策略
              </p>
            </div>
          </div>

          {/* Quick Start Tips */}
          <div className="bg-primary/5 rounded-lg p-4 space-y-2 text-left">
            <h3 className="font-semibold text-sm">快速开始指南：</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>点击左侧策略列表查看您的策略</li>
              <li>使用策略编辑器构建交易规则</li>
              <li>在回测面板验证策略效果</li>
              <li>使用 AI 助手快速生成策略</li>
            </ul>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              size="lg"
              className="w-full md:w-auto px-8"
              onClick={onGetStarted}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              开始使用
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
