import { Badge } from '@/components/ui/badge'
import { useApiHealthQuery } from '../hooks/useApiHealthQuery'

export function ModelStatusBadge() {
  const health = useApiHealthQuery()
  if (health.isPending) return <Badge variant="outline">checking API…</Badge>
  if (health.isError) return <Badge variant="destructive">API offline</Badge>
  if (!health.data.model) return <Badge variant="outline">local browser · no LLM</Badge>
  return <Badge variant="outline">local browser · {health.data.model}</Badge>
}
