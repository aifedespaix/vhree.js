import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { Animation, AnimationSpec } from './types'
import { computed, unref } from 'vue'
import { resolveAnimation } from './registry'
import './builtins'

function toArray(spec: AnimationSpec | AnimationSpec[] | null | undefined): AnimationSpec[] {
  if (!spec)
    return []
  return Array.isArray(spec) ? spec : [spec]
}

/**
 * Resolve animation specifications into executable callbacks using the registry.
 */
export function useAnimation(specs: MaybeRefOrGetter<AnimationSpec | AnimationSpec[] | null | undefined>): ComputedRef<Animation[]> {
  return computed<Animation[]>(() => {
    const value = typeof specs === 'function' ? (specs as () => AnimationSpec | AnimationSpec[] | null | undefined)() : unref(specs)
    const entries = toArray(value)
    const resolved: Animation[] = []

    for (let i = 0; i < entries.length; i += 1) {
      const anim = resolveAnimation(entries[i])
      if (anim) {
        resolved.push(anim)
      }
    }

    return resolved
  })
}
