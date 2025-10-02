import * as THREE from 'three'
import { onBeforeUnmount, shallowRef, watchEffect } from 'vue'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { toValue } from '@vueuse/core'
import type { Disposable, Vec3 } from '../../types/common'
import type { VhreeContextValue } from '../../core/context'
import { useVhree } from './useVhree'

export interface UseCameraOptions {
  fov?: number
  near?: number
  far?: number
  position?: Vec3
  up?: Vec3
  lookAt?: Vec3 | null
  active?: boolean
}

export interface UseCameraResult {
  camera: ShallowRef<THREE.PerspectiveCamera | null>
  dispose: Disposable
}

const DEFAULT_POSITION: Vec3 = [0, 0, 5]
const DEFAULT_UP: Vec3 = [0, 1, 0]

/**
 * Create a managed `PerspectiveCamera` that optionally registers itself with the nearest <Vhree> provider.
 */
export function useCamera(options?: MaybeRefOrGetter<UseCameraOptions | undefined>): UseCameraResult {
  const { context } = useVhree()
  const camera: ShallowRef<THREE.PerspectiveCamera | null> = shallowRef(null)
  const positionVec = new THREE.Vector3()
  const upVec = new THREE.Vector3()
  const lookAtVec = new THREE.Vector3()

  let lastFov: number | null = null
  let lastNear: number | null = null
  let lastFar: number | null = null
  let owner: symbol | null = null
  let active = false
  let boundContext: VhreeContextValue | null = null

  const ensureCamera = (opts: UseCameraOptions): THREE.PerspectiveCamera => {
    if (!camera.value) {
      const fov = typeof opts.fov === 'number' ? opts.fov : 60
      const near = typeof opts.near === 'number' ? opts.near : 0.1
      const far = typeof opts.far === 'number' ? opts.far : 100
      const instance = new THREE.PerspectiveCamera(fov, 1, near, far)
      const pos = opts.position ?? DEFAULT_POSITION
      instance.position.set(pos[0], pos[1], pos[2])
      const up = opts.up ?? DEFAULT_UP
      instance.up.set(up[0], up[1], up[2])
      camera.value = instance
      lastFov = fov
      lastNear = near
      lastFar = far
    }
    return camera.value
  }

  const dispose: Disposable = () => {
    const ctx = boundContext
    if (ctx && camera.value && owner) {
      ctx.releaseCamera({ owner, camera: camera.value, dispose: false })
      active = false
    }
    camera.value?.dispose?.()
    camera.value = null
    owner = null
    boundContext = null
  }

  watchEffect(() => {
    const opts = options ? toValue(options) ?? {} : {}
    const instance = ensureCamera(opts)

    let needsProjectionUpdate = false
    if (typeof opts.fov === 'number' && opts.fov !== lastFov) {
      instance.fov = opts.fov
      lastFov = opts.fov
      needsProjectionUpdate = true
    }

    if (typeof opts.near === 'number' && opts.near !== lastNear) {
      instance.near = Math.max(0.0001, opts.near)
      lastNear = instance.near
      needsProjectionUpdate = true
    }

    if (typeof opts.far === 'number' && opts.far !== lastFar) {
      instance.far = Math.max(instance.near + 0.0001, opts.far)
      lastFar = instance.far
      needsProjectionUpdate = true
    }

    const nextPosition = opts.position ?? DEFAULT_POSITION
    positionVec.set(nextPosition[0], nextPosition[1], nextPosition[2])
    if (!positionVec.equals(instance.position))
      instance.position.copy(positionVec)

    const nextUp = opts.up ?? DEFAULT_UP
    upVec.set(nextUp[0], nextUp[1], nextUp[2])
    if (!upVec.equals(instance.up))
      instance.up.copy(upVec)

    if (opts.lookAt) {
      lookAtVec.set(opts.lookAt[0], opts.lookAt[1], opts.lookAt[2])
      instance.lookAt(lookAtVec)
    }

    if (needsProjectionUpdate)
      instance.updateProjectionMatrix()
  })

  watchEffect((onCleanup) => {
    const ctx = context.value
    const opts = options ? toValue(options) ?? {} : {}
    const instance = camera.value
    if (!ctx || !instance)
      return

    if (ctx !== boundContext) {
      if (boundContext && owner && active)
        boundContext.releaseCamera({ owner, camera: instance, dispose: false })
      owner = ctx.registerCameraOwner()
      boundContext = ctx
      active = false
    }

    if (!owner)
      owner = ctx.registerCameraOwner()

    const shouldBeActive = opts.active !== false
    if (shouldBeActive && !active) {
      ctx.setCamera(instance, { owner: owner!, disposePrev: false })
      active = true
    }
    else if (!shouldBeActive && active) {
      ctx.releaseCamera({ owner: owner!, camera: instance, dispose: false })
      active = false
    }

    onCleanup(() => {
      if (active && boundContext && owner && camera.value) {
        boundContext.releaseCamera({ owner, camera: camera.value, dispose: false })
        active = false
      }
    })
  })

  onBeforeUnmount(() => {
    dispose()
  })

  return { camera, dispose }
}
