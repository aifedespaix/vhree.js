import type { Object3D } from 'three'

/**
 * Shared state object passed to every animation callback.
 * Allows animations to accumulate time and track custom metadata.
 */
export interface AnimState {
  t: number
  paused: boolean
  [key: string]: unknown
}

/**
 * Animation callback executed on each frame.
 *
 * @param obj - Target Three.js object to mutate.
 * @param state - Shared animation state for the object.
 * @param dt - Delta time in seconds since previous frame.
 * @param now - Elapsed time in seconds since the loop started.
 */
export type Animation = (obj: Object3D, state: AnimState, dt: number, now: number) => void

/**
 * Factory that produces an animation when invoked with user options.
 */
export type AnimationFactory<Opts = unknown> = (opts?: Opts) => Animation

/**
 * Declarative animation spec accepted by components.
 */
export type AnimationSpec
  = | string
    | { name: string, options?: unknown }
    | Animation
