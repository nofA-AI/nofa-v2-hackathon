'use client';

import { useState } from 'react';
import {
  CaretDown,
  CaretRight,
  PencilSimple,
  Trash,
  GitBranch,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  IfElseBlock,
  ActionBlock,
  ConditionItem,
  ConditionType,
  IndicatorType,
  CompareOperator,
  LogicalOperator,
  Symbol as SymbolType,
  AVAILABLE_INDICATORS,
  AVAILABLE_SYMBOLS,
} from '@/lib/types/strategy';
import { ActionBlockNode } from './action-block-node';
import { AddBlockDropdown } from '../add-block-dropdown';

interface IfElseBlockNodeProps {
  nodeId: string;
  block: IfElseBlock;
  onUpdate: (block: IfElseBlock) => void;
  onDelete: () => void;
  expanded: boolean;
  onToggle: () => void;
  expandedNodes: Set<string>;
  onToggleChild: (nodeId: string) => void;
  depth?: number;
}

export function IfElseBlockNode({
  nodeId,
  block,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
  expandedNodes,
  onToggleChild,
  depth = 0,
}: IfElseBlockNodeProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState(block);

  const handleSave = () => {
    onUpdate(editValues);
    setEditDialogOpen(false);
  };

  const formatCondition = (condition: ConditionItem) => {
    const valueStr =
      typeof condition.value === 'number'
        ? condition.value
        : `${condition.value.indicator}(${condition.value.period})`;
    return `${condition.indicator}(period=${condition.period}) ${condition.operator.toLowerCase()} ${valueStr}`;
  };

  const handleAddThenAction = () => {
    const newAction: ActionBlock = {
      type: 'ACTION_BLOCK',
      name: 'New Allocate',
      symbol: 'BTC/USDT',
      direction: 'LONG',
      allocate: {
        type: 'ALLOCATE_CONFIG',
        mode: 'WEIGHT',
        value: 30,
      },
      leverage: 1,
    };

    if (block.thenAction === 'NO ACTION') {
      onUpdate({ ...block, thenAction: [newAction] });
    } else {
      onUpdate({
        ...block,
        thenAction: [...block.thenAction, newAction],
      });
    }
  };

  const handleAddElseAction = () => {
    const newAction: ActionBlock = {
      type: 'ACTION_BLOCK',
      name: 'New Action',
      symbol: 'BTC/USDT',
      direction: 'LONG',
      allocate: {
        type: 'ALLOCATE_CONFIG',
        mode: 'WEIGHT',
        value: 30,
      },
      leverage: 1,
    };

    if (block.elseAction === 'NO ACTION') {
      onUpdate({ ...block, elseAction: [newAction] });
    } else {
      onUpdate({
        ...block,
        elseAction: [...block.elseAction, newAction],
      });
    }
  };

  const handleAddThenIfElse = () => {
    const newBlock: IfElseBlock = {
      type: 'IF_ELSE_BLOCK',
      name: 'Nested Condition',
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

    if (block.thenAction === 'NO ACTION') {
      onUpdate({ ...block, thenAction: [newBlock] });
    } else {
      onUpdate({
        ...block,
        thenAction: [...block.thenAction, newBlock],
      });
    }
  };

  const handleAddElseIfElse = () => {
    const newBlock: IfElseBlock = {
      type: 'IF_ELSE_BLOCK',
      name: 'Nested Condition',
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

    if (block.elseAction === 'NO ACTION') {
      onUpdate({ ...block, elseAction: [newBlock] });
    } else {
      onUpdate({
        ...block,
        elseAction: [...block.elseAction, newBlock],
      });
    }
  };

  const updateCondition = (
    index: number,
    field: keyof ConditionItem,
    value: unknown,
  ) => {
    const newConditions = [...editValues.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setEditValues({ ...editValues, conditions: newConditions });
  };

  return (
    <>
      <div className="mt-2">
        {/* Main Block */}
        <div
          className="group flex gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-border bg-card"
          onClick={onToggle}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-4 h-4 flex items-center justify-center text-muted-foreground relative top-1"
          >
            {expanded ? (
              <CaretDown className="w-3 h-3" weight="bold" />
            ) : (
              <CaretRight className="w-3 h-3" weight="bold" />
            )}
          </button>

          {/* <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
            <GitBranch className="w-3 h-3 text-muted-foreground" weight="bold" />
          </div> */}

          <div className="flex-1 flex gap-2 min-w-0">
            <div className="h-6 w-6 flex items-center justify-center text-xs font-semibold rounded bg-primary text-primary-foreground">
              IF
            </div>
            <div>
              { block.name && <div className="min-h-[24px] pt-[2px] text-sm font-medium truncate">{block.name}</div> }
              {block.conditions.length > 0 && (
                <div className="min-h-[24px] flex items-center flex-wrap gap-1 mt-[2px]">
                  {block.conditions.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {formatCondition(condition)}
                      </span>
                      {idx < block.conditions.length - 1 && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {block.logicalOperator || 'AND'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setEditValues(block);
                setEditDialogOpen(true);
              }}
            >
              <PencilSimple className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="ml-4 pl-4 border-l border-border">
            {/* THEN Section */}
            <div className="mt-2">
              <span className="text-xs font-semibold text-primary">THEN:</span>
              <div className="ml-4 mt-1">
                {block.thenAction === 'NO ACTION' ? (
                  <span className="text-sm text-muted-foreground italic">
                    No action
                  </span>
                ) : (
                  block.thenAction.map((action, index) =>
                    action.type === 'ACTION_BLOCK' ? (
                      <ActionBlockNode
                        key={`then-action-${index}`}
                        nodeId={`${nodeId}-then-action-${index}`}
                        action={action}
                        onUpdate={(updated) => {
                          const newActions = [
                            ...(block.thenAction as (
                              | ActionBlock
                              | IfElseBlock
                            )[]),
                          ];
                          newActions[index] = updated;
                          onUpdate({ ...block, thenAction: newActions });
                        }}
                        onDelete={() => {
                          const newActions = (
                            block.thenAction as (ActionBlock | IfElseBlock)[]
                          ).filter((_, i) => i !== index);
                          onUpdate({
                            ...block,
                            thenAction:
                              newActions.length > 0 ? newActions : 'NO ACTION',
                          });
                        }}
                      />
                    ) : (
                      <IfElseBlockNode
                        key={`then-ifelse-${index}`}
                        nodeId={`${nodeId}-then-ifelse-${index}`}
                        block={action}
                        onUpdate={(updated) => {
                          const newActions = [
                            ...(block.thenAction as (
                              | ActionBlock
                              | IfElseBlock
                            )[]),
                          ];
                          newActions[index] = updated;
                          onUpdate({ ...block, thenAction: newActions });
                        }}
                        onDelete={() => {
                          const newActions = (
                            block.thenAction as (ActionBlock | IfElseBlock)[]
                          ).filter((_, i) => i !== index);
                          onUpdate({
                            ...block,
                            thenAction:
                              newActions.length > 0 ? newActions : 'NO ACTION',
                          });
                        }}
                        expanded={expandedNodes.has(
                          `${nodeId}-then-ifelse-${index}`,
                        )}
                        onToggle={() =>
                          onToggleChild(`${nodeId}-then-ifelse-${index}`)
                        }
                        expandedNodes={expandedNodes}
                        onToggleChild={onToggleChild}
                        depth={depth + 1}
                      />
                    ),
                  )
                )}
                <div className="mt-2">
                  <AddBlockDropdown
                    onAddAction={handleAddThenAction}
                    onAddIfElse={handleAddThenIfElse}
                  />
                </div>
              </div>
            </div>

            {/* ELSE Section */}
            <div className="mt-3">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500 text-white">
                ELSE
              </span>
              <div className="ml-4 mt-1">
                {block.elseAction === 'NO ACTION' ? (
                  <span className="text-sm text-muted-foreground italic">
                    No action
                  </span>
                ) : (
                  block.elseAction.map((action, index) =>
                    action.type === 'ACTION_BLOCK' ? (
                      <ActionBlockNode
                        key={`else-action-${index}`}
                        nodeId={`${nodeId}-else-action-${index}`}
                        action={action}
                        onUpdate={(updated) => {
                          const newActions = [
                            ...(block.elseAction as (
                              | ActionBlock
                              | IfElseBlock
                            )[]),
                          ];
                          newActions[index] = updated;
                          onUpdate({ ...block, elseAction: newActions });
                        }}
                        onDelete={() => {
                          const newActions = (
                            block.elseAction as (ActionBlock | IfElseBlock)[]
                          ).filter((_, i) => i !== index);
                          onUpdate({
                            ...block,
                            elseAction:
                              newActions.length > 0 ? newActions : 'NO ACTION',
                          });
                        }}
                      />
                    ) : (
                      <IfElseBlockNode
                        key={`else-ifelse-${index}`}
                        nodeId={`${nodeId}-else-ifelse-${index}`}
                        block={action}
                        onUpdate={(updated) => {
                          const newActions = [
                            ...(block.elseAction as (
                              | ActionBlock
                              | IfElseBlock
                            )[]),
                          ];
                          newActions[index] = updated;
                          onUpdate({ ...block, elseAction: newActions });
                        }}
                        onDelete={() => {
                          const newActions = (
                            block.elseAction as (ActionBlock | IfElseBlock)[]
                          ).filter((_, i) => i !== index);
                          onUpdate({
                            ...block,
                            elseAction:
                              newActions.length > 0 ? newActions : 'NO ACTION',
                          });
                        }}
                        expanded={expandedNodes.has(
                          `${nodeId}-else-ifelse-${index}`,
                        )}
                        onToggle={() =>
                          onToggleChild(`${nodeId}-else-ifelse-${index}`)
                        }
                        expandedNodes={expandedNodes}
                        onToggleChild={onToggleChild}
                        depth={depth + 1}
                      />
                    ),
                  )
                )}
                <div className="mt-2">
                  <AddBlockDropdown
                    onAddAction={handleAddElseAction}
                    onAddIfElse={handleAddElseIfElse}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl" autoFocus={false}>
          <DialogHeader>
            <DialogTitle>Edit Condition Block</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Block Name</Label>
              <Input
                value={editValues.name}
                onChange={(e) =>
                  setEditValues({ ...editValues, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 hidden">
              <Label>Condition Type</Label>
              <Select
                value={editValues.conditionType}
                onValueChange={(v: ConditionType) =>
                  setEditValues({ ...editValues, conditionType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compare">Compare</SelectItem>
                  <SelectItem value="Cross">Cross</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                {editValues.conditions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Logic:
                    </Label>
                    <Select
                      value={editValues.logicalOperator || 'AND'}
                      onValueChange={(v: LogicalOperator) =>
                        setEditValues({ ...editValues, logicalOperator: v })
                      }
                    >
                      <SelectTrigger className="h-7 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {editValues.conditions.map((condition, index) => (
                <div key={index}>
                  <div className="p-3 bg-muted rounded-md space-y-2 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-8 w-8 text-destructive"
                      onClick={() => {
                        const newConditions = editValues.conditions.filter(
                          (_, i) => i !== index,
                        );
                        setEditValues({
                          ...editValues,
                          conditions: newConditions,
                        });
                      }}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                    <div className="flex gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Indicator</Label>
                        <Select
                          value={condition.indicator}
                          onValueChange={(v: IndicatorType) =>
                            updateCondition(index, 'indicator', v)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_INDICATORS.map((ind) => (
                              <SelectItem key={ind} value={ind}>
                                {ind}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Period</Label>
                        <Input
                          type="number"
                          className="h-8"
                          value={condition.period}
                          onChange={(e) =>
                            updateCondition(
                              index,
                              'period',
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Symbol</Label>
                        <Select
                          value={condition.symbol}
                          onValueChange={(v: SymbolType) =>
                            updateCondition(index, 'symbol', v)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_SYMBOLS.map((sym) => (
                              <SelectItem key={sym} value={sym}>
                                {sym}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Operator</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(v: CompareOperator) =>
                            updateCondition(index, 'operator', v)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Greater Than">{'>'}</SelectItem>
                            <SelectItem value="Less Than">{'<'}</SelectItem>
                            <SelectItem value="Equal">=</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Value</Label>
                        <Input
                          type="number"
                          className="h-8"
                          value={
                            typeof condition.value === 'number'
                              ? condition.value
                              : 0
                          }
                          onChange={(e) =>
                            updateCondition(
                              index,
                              'value',
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                  {index < editValues.conditions.length - 1 && (
                    <div className="flex justify-center py-1 -mb-3">
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">
                        {editValues.logicalOperator || 'AND'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newCondition: ConditionItem = {
                    type: 'CONDITION_ITEM',
                    indicator: 'RSI',
                    period: 14,
                    symbol: 'BTC/USDT',
                    operator: 'Greater Than',
                    value: 70,
                  };
                  setEditValues({
                    ...editValues,
                    conditions: [...editValues.conditions, newCondition],
                  });
                }}
              >
                Add Condition
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Condition Block</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this condition block? This will
              also delete all nested actions and conditions. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
