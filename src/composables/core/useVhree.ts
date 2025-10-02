import { computed, inject } from 'vue'
import type { ComputedRef } from 'vue'
import { VHREE_CTX } from '../../core/context'
import type { VhreeContextValue } from '../../core/context'

export interface UseVhreeResult {
  /** Reactive access to the shared vhree.js context. */
  context: ComputedRef<VhreeContextValue | null>
}

/**
 * Access the nearest <Vhree> provider. Returns a computed context reference so consumers can react to provider swaps.
 */
export function useVhree(): UseVhreeResult {
  const ctx = inject(VHREE_CTX, null)

  if (!ctx && import.meta.env.DEV) {
    console.warn('[vhree] useVhree() requires a <Vhree> provider in the component hierarchy.')
  }

  return {
    context: computed(() => ctx),
  }
}
