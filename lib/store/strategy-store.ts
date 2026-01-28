'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Strategy,
  StrategyTree,
  ChatMessage,
  BacktestResult,
  DEFAULT_STRATEGY_TREE
} from '@/lib/types/strategy';

interface HistoryState {
  past: StrategyTree[];
  present: StrategyTree;
  future: StrategyTree[];
}

interface StrategyStore {
  // Strategy list
  strategies: Strategy[];
  currentStrategyId: string | null;
  hasHydrated: boolean;

  // History for undo/redo
  history: HistoryState;

  // Chat messages per strategy
  chatMessages: Record<string, ChatMessage[]>;

  // Backtest results per strategy
  backtestResults: Record<string, BacktestResult[]>;

  // Actions
  createStrategy: () => string;
  deleteStrategy: (id: string) => void;
  setCurrentStrategy: (id: string | null) => void;
  updateStrategyTree: (tree: StrategyTree) => void;
  updateStrategyName: (name: string) => void;
  setHasHydrated: (hydrated: boolean) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Chat
  addChatMessage: (strategyId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatMessages: (strategyId: string) => void;

  // Backtest
  addBacktestResult: (strategyId: string, result: Omit<BacktestResult, 'id' | 'createdAt'>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set, get) => ({
      strategies: [],
      currentStrategyId: null,
      hasHydrated: false,
      history: {
        past: [],
        present: DEFAULT_STRATEGY_TREE,
        future: [],
      },
      chatMessages: {},
      backtestResults: {},

      createStrategy: () => {
        const id = generateId();
        const now = new Date().toISOString();
        const newStrategy: Strategy = {
          id,
          strategyTree: { ...DEFAULT_STRATEGY_TREE, name: 'Untitled Strategy' },
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          strategies: [...state.strategies, newStrategy],
          currentStrategyId: id,
          history: {
            past: [],
            present: newStrategy.strategyTree,
            future: [],
          },
          chatMessages: {
            ...state.chatMessages,
            [id]: [],
          },
        }));

        return id;
      },

      deleteStrategy: (id) => {
        set((state) => {
          const newStrategies = state.strategies.filter((s) => s.id !== id);
          const newChatMessages = { ...state.chatMessages };
          delete newChatMessages[id];
          const newBacktestResults = { ...state.backtestResults };
          delete newBacktestResults[id];

          return {
            strategies: newStrategies,
            currentStrategyId: state.currentStrategyId === id
              ? (newStrategies[0]?.id || null)
              : state.currentStrategyId,
            chatMessages: newChatMessages,
            backtestResults: newBacktestResults,
          };
        });
      },

      setCurrentStrategy: (id) => {
        const strategy = get().strategies.find((s) => s.id === id);
        if (strategy) {
          set({
            currentStrategyId: id,
            history: {
              past: [],
              present: strategy.strategyTree,
              future: [],
            },
          });
        } else {
          set({ currentStrategyId: null });
        }
      },

      updateStrategyTree: (tree) => {
        const { currentStrategyId, history } = get();
        if (!currentStrategyId) return;

        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === currentStrategyId
              ? { ...s, strategyTree: tree, updatedAt: new Date().toISOString() }
              : s
          ),
          history: {
            past: [...history.past, history.present],
            present: tree,
            future: [],
          },
        }));
      },

      updateStrategyName: (name) => {
        const { currentStrategyId, history } = get();
        if (!currentStrategyId) return;

        const newTree = { ...history.present, name };
        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === currentStrategyId
              ? { ...s, strategyTree: newTree, updatedAt: new Date().toISOString() }
              : s
          ),
          history: {
            ...history,
            present: newTree,
          },
        }));
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });
      },

      undo: () => {
        const { history, currentStrategyId } = get();
        if (history.past.length === 0) return;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        set((state) => ({
          history: {
            past: newPast,
            present: previous,
            future: [history.present, ...history.future],
          },
          strategies: state.strategies.map((s) =>
            s.id === currentStrategyId
              ? { ...s, strategyTree: previous, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      redo: () => {
        const { history, currentStrategyId } = get();
        if (history.future.length === 0) return;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set((state) => ({
          history: {
            past: [...history.past, history.present],
            present: next,
            future: newFuture,
          },
          strategies: state.strategies.map((s) =>
            s.id === currentStrategyId
              ? { ...s, strategyTree: next, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,

      addChatMessage: (strategyId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          chatMessages: {
            ...state.chatMessages,
            [strategyId]: [...(state.chatMessages[strategyId] || []), newMessage],
          },
        }));
      },

      clearChatMessages: (strategyId) => {
        set((state) => ({
          chatMessages: {
            ...state.chatMessages,
            [strategyId]: [],
          },
        }));
      },

      addBacktestResult: (strategyId, result) => {
        const newResult: BacktestResult = {
          ...result,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          backtestResults: {
            ...state.backtestResults,
            [strategyId]: [...(state.backtestResults[strategyId] || []), newResult],
          },
        }));
      },
    }),
    {
      name: 'strategy-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
