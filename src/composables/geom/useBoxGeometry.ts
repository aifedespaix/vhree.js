import * as THREE from 'three'
import { onBeforeUnmount, shallowRef, watch } from 'vue'
import type { MaybeRefOrGetter, ShallowRef, WatchStopHandle } from 'vue'
import { toValue } from '@vueuse/core'
import type { Disposable } from '../../types/common'

export interface UseBoxGeometryOptions {
  width?: number
  height?: number
  depth?: number
  widthSegments?: number
  heightSegments?: number
  depthSegments?: number
}

export interface UseBoxGeometryResult {
  geometry: ShallowRef<THREE.BoxGeometry | null>
  dispose: Disposable
}

function createGeometry(options: UseBoxGeometryOptions): THREE.BoxGeometry {
  const {
    width = 1,
    height = 1,
    depth = 1,
    widthSegments = 1,
    heightSegments = 1,
    depthSegments = 1,
  } = options

  return new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)
}

/**
 * Lazily instantiate a `THREE.BoxGeometry` that updates whenever the options change.
 */
export function useBoxGeometry(options?: MaybeRefOrGetter<UseBoxGeometryOptions | undefined>): UseBoxGeometryResult {
  const geometry: ShallowRef<THREE.BoxGeometry | null> = shallowRef(null)
  let stop: WatchStopHandle | null = null

  const dispose: Disposable = () => {
    stop?.()
    stop = null
    if (geometry.value) {
      geometry.value.dispose()
      geometry.value = null
    }
  }

  const apply = (next: UseBoxGeometryOptions | undefined) => {
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
        return `${value.width ?? 1}|${value.height ?? 1}|${value.depth ?? 1}|${value.widthSegments ?? 1}|${value.heightSegments ?? 1}|${value.depthSegments ?? 1}`
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
