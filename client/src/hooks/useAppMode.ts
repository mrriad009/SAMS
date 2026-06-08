import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/endpoints';
import type { AppMode } from '@/config/academic';

export function useAppConfig() {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: async () => (await publicApi.getConfig()).data.data,
    staleTime: 60_000,
  });
}

export function useAppMode(): AppMode {
  const { data } = useAppConfig();
  return data?.appMode === 'advanced' ? 'advanced' : 'general';
}
