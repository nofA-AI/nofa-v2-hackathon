'use client';

import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { apiClient } from '@/lib/api/client';
import { UserData } from '@/lib/types/user';

async function fetchUser(): Promise<UserData> {
  const response = await apiClient.get<UserData>('/api/auth/me');
  return response.data;
}

export function useUser() {
  const { authenticated } = usePrivy();

  const query = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled: authenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: false, // Don't retry on auth errors
  });

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
