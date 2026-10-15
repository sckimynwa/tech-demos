import { useQuery, type UseQueryResult } from '@tanstack/react-query'

type ApiHealth = { ok: boolean; model: string | null }

async function fetchApiHealth(): Promise<ApiHealth> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`API unavailable (${response.status})`)
  return response.json()
}

export function useApiHealthQuery(): UseQueryResult<ApiHealth, Error> {
  return useQuery({ queryKey: ['api-health'], queryFn: fetchApiHealth, retry: 5 })
}
