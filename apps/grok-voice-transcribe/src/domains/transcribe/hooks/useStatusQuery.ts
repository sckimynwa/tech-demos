import { useQuery } from "@tanstack/react-query"
import { MODEL_ID } from "../constants"
import type { StatusResponse } from "../types"

export function useStatusQuery() {
  return useQuery({
    queryKey: ["stt-status"],
    queryFn: async (): Promise<StatusResponse> => {
      const response = await fetch("/api/status")
      if (!response.ok) {
        return { mode: "demo", model: MODEL_ID }
      }
      return (await response.json()) as StatusResponse
    },
    staleTime: 15_000,
  })
}
