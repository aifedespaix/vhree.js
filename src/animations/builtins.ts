import type { Animation, AnimationFactory } from './types'
import { registerAnimation } from './registry'

const TAU = Math.PI * 2

type Axis = 'x' | 'y' | 'z'

export interface SpinOptions {
  axis?: Axis
  speed?: number
}

export const spin: AnimationFactory<SpinOptions> = (options?: SpinOptions): Animation => {
  const axis: Axis = options?.axis === 'x' || options?.axis === 'y' || options?.axis === 'z' ? options.axis : 'y'
  const speed = typeof options?.speed === 'number' ? options.speed : 1

  return (obj, state, dt) => {
    if (state.paused || dt === 0) return
    obj.rotation[axis] += speed * dt
  }
}

export interface RotateOptions {
  x?: number
  y?: number
  z?: number
}

export const rotate: AnimationFactory<RotateOptions> = (options?: RotateOptions): Animation => {
  const x = options?.x ?? 0
  const y = options?.y ?? 0
  const z = options?.z ?? 0

  return (obj, state, dt) => {
    if (state.paused || dt === 0) return
    if (x) obj.rotation.x += x * dt
    if (y) obj.rotation.y += y * dt
    if (z) obj.rotation.z += z * dt
  }
}

export interface BounceOptions {
  axis?: Axis
  amplitude?: number
  frequency?: number
  center?: number
}

export const bounce: AnimationFactory<BounceOptions> = (options?: BounceOptions): Animation => {
  const axis: Axis = options?.axis === 'x' || options?.axis === 'y' || options?.axis === 'z' ? options.axis : 'y'
  const amplitude = typeof options?.amplitude === 'number' ? options.amplitude : 0.25
  const frequency = typeof options?.frequency === 'number' ? options.frequency : 1
  const center = typeof options?.center === 'number' ? options.center : 0
  const angular = frequency * TAU

  return (obj, state, _dt, now) => {
    if (state.paused) return
    obj.position[axis] = center + Math.sin(now * angular) * amplitude
  }
}

export interface PulseOptions {
  amplitude?: number
  frequency?: number
  base?: number
}

export const pulse: AnimationFactory<PulseOptions> = (options?: PulseOptions): Animation => {
  const amplitude = typeof options?.amplitude === 'number' ? options.amplitude : 0.15
  const frequency = typeof options?.frequency === 'number' ? options.frequency : 1.5
  const base = typeof options?.base === 'number' ? options.base : 1
  const angular = frequency * TAU

  return (obj, state, _dt, now) => {
    if (state.paused) return
    const scalar = base + Math.sin(now * angular) * amplitude
    obj.scale.setScalar(scalar)
  }
}

registerAnimation('spin', spin)
registerAnimation('rotate', rotate)
registerAnimation('bounce', bounce)
registerAnimation('pulse', pulse)
