'use client';

import { useMutation } from '@tanstack/react-query';
import type { RagRequest } from '@rag/shared';
import { ragAnswer } from '@/lib/api';
import { ragKeys } from '@/lib/query-keys';

export function useRagMutation() {
  return useMutation({
    mutationKey: ragKeys.all,
    mutationFn: (req: RagRequest) => ragAnswer(req),
  });
}
