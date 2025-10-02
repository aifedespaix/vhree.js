import type { FrameCallback } from '../core/loop'
import { inject, onBeforeUnmount } from 'vue'
import { VHREE_CTX } from '../core/context'

function noop() {}

/**
 * Subscribe a callback to the shared render loop managed by <Vhree>.
 * Returns a disposer that can be called to unsubscribe early.
 */
export function useFrame(cb: FrameCallback): (() => void) {
  const ctx = inject(VHREE_CTX, null)

  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn('[vhree] useFrame() requires a <Vhree> provider in the component hierarchy.')
    }
    return noop
  }

  const dispose = ctx.loop.add(cb)

  onBeforeUnmount(() => {
    ctx.loop.remove(cb)
  })

  return dispose
}
