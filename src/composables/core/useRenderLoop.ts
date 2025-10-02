import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { RenderLoop } from '../../core/loop'
import { useVhree } from './useVhree'

export interface UseRenderLoopResult {
  loop: ComputedRef<RenderLoop | null>
}

/**
 * Expose the shared render loop created by <Vhree>. Consumers can subscribe via `useFrame` or call `step` manually.
 */
export function useRenderLoop(): UseRenderLoopResult {
  const { context } = useVhree()

  return {
    loop: computed(() => context.value?.loop ?? null),
  }
}
