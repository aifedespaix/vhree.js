import * as THREE from 'three'
import { computed, shallowRef, onBeforeUnmount } from 'vue'
import type { ShallowRef, ComputedRef } from 'vue'
import type { Disposable } from '../../types/common'
import { useVhree } from '../core/useVhree'

export interface UseSceneOptions {
  /** When true, create a standalone scene if no provider is available. */
  createLocal?: boolean
  /** Optional callback executed exactly once when a local scene gets created. */
  onCreate?: (scene: THREE.Scene) => void
}

export interface UseSceneResult {
  scene: ComputedRef<THREE.Scene | null>
  dispose: Disposable
}

/**
 * Access the shared scene created by <Vhree>. When no provider is found and `createLocal` is enabled,
 * the composable will lazily instantiate a standalone `THREE.Scene` that gets disposed on unmount.
 */
export function useScene(options: UseSceneOptions = {}): UseSceneResult {
  const { context } = useVhree()
  const localScene: ShallowRef<THREE.Scene | null> = shallowRef(null)

  const ensureLocalScene = (): THREE.Scene => {
    if (!localScene.value) {
      localScene.value = new THREE.Scene()
      options.onCreate?.(localScene.value)
    }
    return localScene.value
  }

  const scene = computed(() => {
    const existing = context.value?.scene.value
    if (existing)
      return existing
    if (options.createLocal)
      return ensureLocalScene()
    return null
  })

  const dispose: Disposable = () => {
    if (!localScene.value)
      return
    try {
      localScene.value.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose?.())
          }
          else {
            mesh.material?.dispose?.()
          }
          mesh.geometry?.dispose?.()
        }
      })
    }
    finally {
      localScene.value.clear()
      localScene.value = null
    }
  }

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    scene,
    dispose,
  }
}
