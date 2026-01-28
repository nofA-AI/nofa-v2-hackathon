'use client';

import React from "react"

import { useState, useCallback } from 'react';
import { CaretDown, CaretRight, Plus, Sparkle, ClipboardText, Play, ArrowsClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/lib/store/strategy-store';
import {
  StrategyTree,
  IfElseBlock,
  ActionBlock,
  ConditionItem,
  RiskManagement,
  DEFAULT_RISK_MANAGEMENT,
  AVAILABLE_SYMBOLS,
  AVAILABLE_INDICATORS,
  BacktestParams,
  BacktestResult,
} from '@/lib/types/strategy';
import { RiskManagementNode } from './nodes/risk-management-node';
import { IfElseBlockNode } from './nodes/if-else-block-node';
import { ActionBlockNode } from './nodes/action-block-node';
import { AddBlockDropdown } from './add-block-dropdown';
import { BacktestDialog } from '@/components/backtest-dialog';
import { mockRunBacktest } from '@/lib/backtest';
import dayjs from 'dayjs';

interface StrategyTreeEditorProps {
  onCreateWithAI?: () => void;
  onSwitchToBacktest?: () => void;
}

export function StrategyTreeEditor({ onCreateWithAI, onSwitchToBacktest }: StrategyTreeEditorProps) {
  const { history, currentStrategyId, updateStrategyTree, addBacktestResult } = useStrategyStore();
  const strategyTree = history.present;

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root', 'risk', 'main'])
  );
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [backtestParams, setBacktestParams] = useState<BacktestParams>({
    startDate: dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    initialCapital: 10000,
    tradingFee: 0.001,
  });

  // Check if strategy is valid for backtesting
  const mainDecision = Array.isArray(strategyTree.mainDecision)
    ? strategyTree.mainDecision[0]
    : strategyTree.mainDecision;

  const isStrategyValid =
    mainDecision &&
    mainDecision.conditions.length > 0 &&
    (mainDecision.thenAction !== 'NO ACTION' || mainDecision.elseAction !== 'NO ACTION');

  const handleRunBacktest = useCallback(async () => {
    if (!currentStrategyId || !isStrategyValid) return;

    setIsRunningBacktest(true);

    try {
      const result = await mockRunBacktest(currentStrategyId, backtestParams);
      addBacktestResult(currentStrategyId, result);
      setBacktestDialogOpen(false);
      toast.success('Backtest completed successfully!');
      // Switch to backtest tab after successful backtest
      onSwitchToBacktest?.();
    } catch (error) {
      console.error('Backtest failed:', error);
      toast.error('Backtest failed. Please try again.');
    } finally {
      setIsRunningBacktest(false);
    }
  }, [currentStrategyId, isStrategyValid, backtestParams, addBacktestResult, onSwitchToBacktest]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleUpdateRiskManagement = (risk: RiskManagement) => {
    updateStrategyTree({
      ...strategyTree,
      riskManagement: risk,
    });
  };

  const handleUpdateMainDecision = (
    decision: IfElseBlock | IfElseBlock[]
  ) => {
    updateStrategyTree({
      ...strategyTree,
      mainDecision: decision,
    });
  };

  const handleAddIfElseBlock = () => {
    const newBlock: IfElseBlock = {
      type: 'IF_ELSE_BLOCK',
      name: 'New Condition',
      conditionType: 'Compare',
      conditions: [
        {
          type: 'CONDITION_ITEM',
          indicator: 'RSI',
          period: 14,
          symbol: 'BTC/USDT',
          operator: 'Greater Than',
          value: 70,
        },
      ],
      thenAction: 'NO ACTION',
      elseAction: 'NO ACTION',
    };

    if (Array.isArray(strategyTree.mainDecision)) {
      handleUpdateMainDecision([...strategyTree.mainDecision, newBlock]);
    } else {
      // Check if current main decision is essentially empty
      const current = strategyTree.mainDecision;
      if (
        current.conditions.length === 0 &&
        current.thenAction === 'NO ACTION' &&
        current.elseAction === 'NO ACTION'
      ) {
        handleUpdateMainDecision(newBlock);
      } else {
        handleUpdateMainDecision([strategyTree.mainDecision, newBlock]);
      }
    }
  };

  const validateStrategyTree = (data: unknown): data is StrategyTree => {
    if (!data || typeof data !== 'object') return false;
    const tree = data as Record<string, unknown>;

    // Check required fields
    if (tree.type !== 'STRATEGY_TREE') return false;
    if (typeof tree.name !== 'string' || !tree.name) return false;
    if (!tree.riskManagement || typeof tree.riskManagement !== 'object') return false;
    if (!tree.mainDecision) return false;

    return true;
  };

  const handlePasteJson = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonInput);

      if (!validateStrategyTree(parsed)) {
        setJsonError('Invalid strategy tree structure. Please check the JSON format.');
        return;
      }

      // Update the strategy tree
      updateStrategyTree(parsed as StrategyTree);

      // Close dialog and reset
      setPasteDialogOpen(false);
      setJsonInput('');
      setJsonError('');

      // Show success toast
      toast.success('Strategy tree applied successfully!');
    } catch (error) {
      setJsonError('Invalid JSON format. Please check your input.');
    }
  };

  if (!currentStrategyId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Strategy Selected</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Select a strategy from the sidebar or create a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0 h-[49px]">
        <h2 className="font-medium text-sm">Strategy Tree</h2>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-7 hover:bg-primary/10 hover:text-primary"
          onClick={() => setPasteDialogOpen(true)}
        >
          <ClipboardText className="w-4 h-4" />
          Import
        </Button>
      </div>

      {/* Tree Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {/* Root Strategy Node */}
          <div className="strategy-tree">
            <TreeNode
              nodeId="root"
              label={strategyTree.name}
              icon={
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground"
                  >
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
              }
              expanded={expandedNodes.has('root')}
              onToggle={() => toggleExpand('root')}
              depth={0}
              actions={
                isStrategyValid ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBacktestDialogOpen(true);
                    }}
                    disabled={isRunningBacktest}
                  >
                    {isRunningBacktest ? (
                      <>
                        <ArrowsClockwise className="w-3 h-3 mr-1 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="!w-3 !h-3 mr-1" weight="fill" />
                        Backtest
                      </>
                    )}
                  </Button>
                ) : null
              }
            >
              {/* Risk Management */}
              <RiskManagementNode
                risk={strategyTree.riskManagement}
                onUpdate={handleUpdateRiskManagement}
                expanded={expandedNodes.has('risk')}
                onToggle={() => toggleExpand('risk')}
              />

              {/* Main Decision */}
              <div className="ml-6 mt-2">
                {Array.isArray(strategyTree.mainDecision) ? (
                  strategyTree.mainDecision.map((block, index) => (
                    <IfElseBlockNode
                      key={`main-${index}`}
                      nodeId={`main-${index}`}
                      block={block}
                      onUpdate={(updated) => {
                        const newDecisions = [
                          ...(strategyTree.mainDecision as IfElseBlock[]),
                        ];
                        newDecisions[index] = updated;
                        handleUpdateMainDecision(newDecisions);
                      }}
                      onDelete={() => {
                        const newDecisions = (
                          strategyTree.mainDecision as IfElseBlock[]
                        ).filter((_, i) => i !== index);
                        if (newDecisions.length === 1) {
                          handleUpdateMainDecision(newDecisions[0]);
                        } else if (newDecisions.length === 0) {
                          handleUpdateMainDecision({
                            type: 'IF_ELSE_BLOCK',
                            name: 'Main Decision',
                            conditionType: 'Compare',
                            conditions: [],
                            thenAction: 'NO ACTION',
                            elseAction: 'NO ACTION',
                          });
                        } else {
                          handleUpdateMainDecision(newDecisions);
                        }
                      }}
                      expanded={expandedNodes.has(`main-${index}`)}
                      onToggle={() => toggleExpand(`main-${index}`)}
                      expandedNodes={expandedNodes}
                      onToggleChild={toggleExpand}
                    />
                  ))
                ) : (
                  <IfElseBlockNode
                    nodeId="main"
                    block={strategyTree.mainDecision}
                    onUpdate={handleUpdateMainDecision}
                    onDelete={() => {
                      handleUpdateMainDecision({
                        type: 'IF_ELSE_BLOCK',
                        name: 'Main Decision',
                        conditionType: 'Compare',
                        conditions: [],
                        thenAction: 'NO ACTION',
                        elseAction: 'NO ACTION',
                      });
                    }}
                    expanded={expandedNodes.has('main')}
                    onToggle={() => toggleExpand('main')}
                    expandedNodes={expandedNodes}
                    onToggleChild={toggleExpand}
                  />
                )}

                {/* Add Block Button */}
                <div className="mt-3 ml-6">
                  <AddBlockDropdown
                    onAddIfElse={handleAddIfElseBlock}
                    onAddAction={() => {}}
                    showAction={false}
                  />
                </div>
              </div>
            </TreeNode>
          </div>
        </div>
      </ScrollArea>

      {/* Paste JSON Dialog */}
      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Strategy Tree JSON</DialogTitle>
            <DialogDescription>
              Paste your strategy tree JSON below. The format will be validated before applying.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] pr-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Strategy Tree JSON</Label>
                {jsonInput.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 !pr-0 text-xs hover:text-[#484848]"
                    onClick={() => {
                      setJsonInput('');
                      setJsonError('');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setJsonError('');
                }}
                placeholder='{"type": "STRATEGY_TREE", "name": "My Strategy", ...}'
                className="min-h-[240px] max-h-[50vh] font-mono text-sm"
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasteDialogOpen(false);
                setJsonInput('');
                setJsonError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePasteJson} disabled={!jsonInput.trim()}>
              Apply JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backtest Dialog */}
      <BacktestDialog
        open={backtestDialogOpen}
        onOpenChange={setBacktestDialogOpen}
        params={backtestParams}
        onParamsChange={setBacktestParams}
        onRun={handleRunBacktest}
        isRunning={isRunningBacktest}
      />
    </div>
  );
}

interface TreeNodeProps {
  nodeId: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  depth: number;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function TreeNode({
  nodeId,
  label,
  icon,
  badge,
  expanded = true,
  onToggle,
  depth,
  children,
  actions,
}: TreeNodeProps) {
  const hasChildren = Boolean(children);

  return (
    <div className="tree-node">
      <div
        className={cn(
          'group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer',
          'transition-colors'
        )}
        onClick={onToggle}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <CaretDown className="w-3 h-3" weight="bold" />
            ) : (
              <CaretRight className="w-3 h-3" weight="bold" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        {icon}

        {/* Label */}
        <span className="text-sm font-medium flex-1 truncate">{label}</span>

        {/* Badge */}
        {badge}

        {/* Actions (always visible) */}
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-4 pl-4 border-l border-border">{children}</div>
      )}
    </div>
  );
}
