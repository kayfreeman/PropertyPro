import { useQuery } from '@tanstack/react-query';

interface ApiError {
  message: string;
  status: number;
}

export function useApi<T>(key: string, endpoint: string, enabled = true, params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${endpoint}${queryString}`;

  return useQuery<T, ApiError>({
    queryKey: [key, params],
    queryFn: async () => {
      const res = await fetch(url);
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
