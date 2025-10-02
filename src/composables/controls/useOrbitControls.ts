import * as THREE from 'three'
import type { MaybeRefOrGetter, ShallowRef, WatchStopHandle, ComputedRef } from 'vue'
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { toValue } from '@vueuse/core'
import type { Disposable, Vec3 } from '../../types/common'
import { useVhree } from '../core/useVhree'
import { useFrame } from '../useFrame'

const isClient = typeof window !== 'undefined'

interface OrbitControlsCtor {
  new (camera: THREE.Camera, domElement: HTMLElement): OrbitControlsInstance
}

interface OrbitControlsInstance {
  object: THREE.Camera
  domElement: HTMLElement
  target: THREE.Vector3
  enableDamping: boolean
  dampingFactor: number
  autoRotate: boolean
  autoRotateSpeed: number
  enableZoom: boolean
  minDistance: number
  maxDistance: number
  enablePan: boolean
  dispose: () => void
  update: () => void
}

type OrbitControlsModule = typeof import('three/examples/jsm/controls/OrbitControls')

let ctorPromise: Promise<OrbitControlsCtor> | null = null

async function resolveCtor(): Promise<OrbitControlsCtor> {
  if (ctorPromise)
    return ctorPromise
  ctorPromise = import('three/examples/jsm/controls/OrbitControls').then((mod: OrbitControlsModule) => mod.OrbitControls)
  return ctorPromise
}

export interface UseOrbitControlsOptions {
  target?: Vec3
  enableDamping?: boolean
  dampingFactor?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
  enableZoom?: boolean
  minDistance?: number
  maxDistance?: number
  enablePan?: boolean
}

export interface UseOrbitControlsResult {
  controls: ShallowRef<OrbitControlsInstance | null>
  dispose: Disposable
  isActive: ComputedRef<boolean>
}

function applyVector(target: THREE.Vector3, tuple?: Vec3) {
  if (!tuple)
    return
  target.set(tuple[0], tuple[1], tuple[2])
}

/**
 * Attach `OrbitControls` to the active camera/renderer pair provided by <Vhree>.
 */
export function useOrbitControls(options?: MaybeRefOrGetter<UseOrbitControlsOptions | undefined>): UseOrbitControlsResult {
  const { context } = useVhree()
  const controls: ShallowRef<OrbitControlsInstance | null> = shallowRef(null)
  let frameStop: Disposable | null = null
  let stopWatch: WatchStopHandle | null = null
  let disposed = false
  let lastToken = 0

  const disposeControls = () => {
    frameStop?.()
    frameStop = null
    controls.value?.dispose()
    controls.value = null
  }

  const dispose: Disposable = () => {
    disposed = true
    stopWatch?.()
    stopWatch = null
    disposeControls()
  }

  const ensureFrameSubscription = () => {
    const instance = controls.value
    const shouldTick = !!instance && (instance.enableDamping || instance.autoRotate)
    if (shouldTick) {
      if (!frameStop)
        frameStop = useFrame(() => controls.value?.update())
    }
    else if (frameStop) {
      frameStop()
      frameStop = null
    }
  }

  if (!isClient) {
    if (import.meta.env.DEV) {
      console.warn('[vhree] useOrbitControls() is a client-only composable. The call will be a no-op during SSR.')
    }
    return {
      controls,
      dispose,
      isActive: computed(() => false),
    }
  }

  const applyOptions = () => {
    const instance = controls.value
    if (!instance)
      return

    const next = options ? toValue(options) ?? {} : {}

    if (next.target)
      applyVector(instance.target, next.target)
    instance.enableDamping = next.enableDamping ?? instance.enableDamping
    if (typeof next.dampingFactor === 'number')
      instance.dampingFactor = next.dampingFactor
    instance.autoRotate = next.autoRotate ?? instance.autoRotate
    if (typeof next.autoRotateSpeed === 'number')
      instance.autoRotateSpeed = next.autoRotateSpeed
    if (typeof next.enableZoom === 'boolean')
      instance.enableZoom = next.enableZoom
    if (typeof next.enablePan === 'boolean')
      instance.enablePan = next.enablePan
    if (typeof next.minDistance === 'number')
      instance.minDistance = next.minDistance
    if (typeof next.maxDistance === 'number')
      instance.maxDistance = next.maxDistance

    instance.update()
    ensureFrameSubscription()
  }

  const setupWatch = () => {
    stopWatch = watch(
      () => {
        const value = context.value
        return [value?.camera.value ?? null, value?.renderer.value ?? null] as const
      },
      ([camera, renderer]) => {
        if (!camera || !renderer) {
          disposeControls()
          return
        }

        const canvas = renderer.domElement
        if (!canvas) {
          disposeControls()
          return
        }

        const token = ++lastToken
        resolveCtor()
          .then((Ctor) => {
            if (disposed || token !== lastToken)
              return

            disposeControls()
            const instance = new Ctor(camera, canvas)
            controls.value = instance
            applyOptions()
          })
          .catch((error) => {
            if (import.meta.env.DEV)
              console.warn('[vhree] Failed to instantiate OrbitControls.', error)
          })
      },
      { immediate: true },
    )
  }

  setupWatch()

  watch(
    () => (options ? toValue(options) : undefined),
    () => applyOptions(),
    { deep: true },
  )

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    controls,
    dispose,
    isActive: computed(() => !!controls.value),
  }
}
