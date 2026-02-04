'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled: authenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    retry: false, // Don't retry on auth errors
  });

  // Listen for 401 unauthorized events and clear user cache
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('[useUser] Received 401 event - clearing user cache');
      // Clear React Query cache for user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.removeQueries({ queryKey: ['user'] });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [queryClient]);

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
