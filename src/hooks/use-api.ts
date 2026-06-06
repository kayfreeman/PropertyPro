import { useQuery } from '@tanstack/react-query';

interface ApiError {
  message: string;
  status: number;
}

export function useApi<T>(key: string, endpoint: string, enabled = true) {
  return useQuery<T, ApiError>({
    queryKey: [key],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw { message: `API Error: ${res.statusText}`, status: res.status };
      }
      return res.json();
    },
    enabled,
    staleTime: 30000,
    retry: 1,
  });
}
