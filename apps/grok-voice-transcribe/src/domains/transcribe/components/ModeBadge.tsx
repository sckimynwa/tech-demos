import { Badge } from "@/components/ui/badge"
import { useStatusQuery } from "../hooks/useStatusQuery"

export function ModeBadge() {
  const statusQuery = useStatusQuery()
  const mode = statusQuery.data?.mode ?? "demo"
  const isLive = mode === "live"

  return (
    <Badge variant={isLive ? "default" : "secondary"} data-testid="mode-badge">
      {isLive ? "Live · XAI_API_KEY" : "Demo mode · no key"}
    </Badge>
  )
}
