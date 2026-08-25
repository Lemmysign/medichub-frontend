import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { SubjectResponse } from "@/lib/types"

/** Active taxonomy subjects — shared read for authoring pickers and student filters. */
export function useSubjects() {
  return useApi(() => api.get<SubjectResponse[]>("/subjects").then((r) => r.data), [])
}
