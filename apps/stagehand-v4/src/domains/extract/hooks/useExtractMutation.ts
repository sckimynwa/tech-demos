import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { postExtract } from '../api/postExtract'
import type { ExtractRequest, ExtractResponse } from '../types'

export function useExtractMutation(): UseMutationResult<ExtractResponse, Error, ExtractRequest> {
  return useMutation({ mutationFn: postExtract })
}
