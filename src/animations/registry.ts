import type { Animation, AnimationFactory, AnimationSpec } from './types'

const registry = new Map<string, AnimationFactory<unknown>>()

export function registerAnimation<Opts = unknown>(name: string, factory: AnimationFactory<Opts>): void {
  if (import.meta.env.DEV && !name) {
    console.warn('[vhree] registerAnimation requires a non-empty name.')
  }
  registry.set(name, factory as AnimationFactory<unknown>)
}

function resolveFactory(name: string | undefined): AnimationFactory<unknown> | undefined {
  if (!name)
    return undefined
  return registry.get(name)
}

export function resolveAnimation(spec: AnimationSpec | null | undefined): Animation | null {
  if (!spec)
    return null

  if (typeof spec === 'function') {
    return spec
  }

  if (typeof spec === 'string') {
    const factory = resolveFactory(spec)
    return factory ? factory() : null
  }

  if (typeof spec === 'object' && 'name' in spec) {
    const factory = resolveFactory(spec.name)
    return factory ? factory(spec.options) : null
  }

  return null
}
