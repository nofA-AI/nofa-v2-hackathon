'use client';

import { create } from 'zustand';

type LoginType = 'human' | 'agent';

interface AuthStore {
  // Login modal state
  isLoginModalOpen: boolean;
  loginType: LoginType;

  // Actions
  openLoginModal: (type?: LoginType) => void;
  closeLoginModal: () => void;
  setLoginType: (type: LoginType) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoginModalOpen: false,
  loginType: 'human',

  openLoginModal: (type = 'human') => {
    set({ isLoginModalOpen: true, loginType: type });
  },

  closeLoginModal: () => {
    set({ isLoginModalOpen: false });
  },

  setLoginType: (type) => {
    set({ loginType: type });
  },
}));
