import * as THREE from 'three'
import { onBeforeUnmount, shallowRef, watch } from 'vue'
import type { MaybeRefOrGetter, ShallowRef, WatchStopHandle } from 'vue'
import { toValue } from '@vueuse/core'
import type { Disposable } from '../../types/common'

export interface UseSphereGeometryOptions {
  radius?: number
  widthSegments?: number
  heightSegments?: number
  phiStart?: number
  phiLength?: number
  thetaStart?: number
  thetaLength?: number
}

export interface UseSphereGeometryResult {
  geometry: ShallowRef<THREE.SphereGeometry | null>
  dispose: Disposable
}

function createGeometry(options: UseSphereGeometryOptions): THREE.SphereGeometry {
  const {
    radius = 1,
    widthSegments = 32,
    heightSegments = 16,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI,
  } = options

  return new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments,
    phiStart,
    phiLength,
    thetaStart,
    thetaLength,
  )
}

/**
 * Lazily instantiate a `THREE.SphereGeometry` that reacts to option updates while disposing previous instances.
 */
export function useSphereGeometry(options?: MaybeRefOrGetter<UseSphereGeometryOptions | undefined>): UseSphereGeometryResult {
  const geometry: ShallowRef<THREE.SphereGeometry | null> = shallowRef(null)
  let stop: WatchStopHandle | null = null

  const dispose: Disposable = () => {
    stop?.()
    stop = null
    if (geometry.value) {
      geometry.value.dispose()
      geometry.value = null
    }
  }

  const apply = (next: UseSphereGeometryOptions | undefined) => {
    const resolved = next ?? {}
    const fresh = createGeometry(resolved)
    const previous = geometry.value
    geometry.value = fresh
    previous?.dispose()
  }

  if (options) {
    let lastSignature = ''
    stop = watch(
      () => {
        const value = toValue(options) ?? {}
        return `${value.radius ?? 1}|${value.widthSegments ?? 32}|${value.heightSegments ?? 16}|${value.phiStart ?? 0}|${value.phiLength ?? Math.PI * 2}|${value.thetaStart ?? 0}|${value.thetaLength ?? Math.PI}`
      },
      (signature) => {
        if (signature === lastSignature)
          return
        lastSignature = signature
        const resolved = toValue(options) ?? {}
        apply(resolved)
      },
      { immediate: true },
    )
  }
  else {
    apply(undefined)
  }

  onBeforeUnmount(() => {
    dispose()
  })

  return { geometry, dispose }
}
