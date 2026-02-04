'use client';

import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { apiClient } from '@/lib/api/client';
import { UserData } from '@/lib/types/user';
import { useAuthStore } from '@/lib/store/auth-store';

async function fetchUser(): Promise<UserData> {
  const response = await apiClient.get<UserData>('/api/auth/me');
  return response.data;
}

export function useUser() {
  const { authenticated } = usePrivy();
  const openLoginModal = useAuthStore((state) => state.openLoginModal);

  const query = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled: authenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: false, // Don't retry on auth errors
  });

  /**
   * Guard function to ensure user is authenticated before executing an action
   * If user is not authenticated, opens the login modal
   * @returns true if authenticated, false otherwise
   */
  const guard = (): boolean => {
    if (!authenticated) {
      openLoginModal();
      return false;
    }
    return true;
  };

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    authenticated,
    guard,
  };
}
