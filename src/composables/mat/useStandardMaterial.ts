import * as THREE from 'three'
import { onBeforeUnmount, shallowRef, watchEffect } from 'vue'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { toValue } from '@vueuse/core'
import type { ColorLike, Disposable } from '../../types/common'

export interface UseStandardMaterialOptions {
  color?: ColorLike
  roughness?: number
  metalness?: number
  emissive?: ColorLike
  envMap?: THREE.Texture | null
  map?: THREE.Texture | null
}

export interface UseStandardMaterialResult {
  material: ShallowRef<THREE.MeshStandardMaterial | null>
  dispose: Disposable
}

function ensureMaterial(ref: ShallowRef<THREE.MeshStandardMaterial | null>): THREE.MeshStandardMaterial {
  if (!ref.value)
    ref.value = new THREE.MeshStandardMaterial({ color: '#ffffff' })
  return ref.value
}

/**
 * Create a `MeshStandardMaterial` that updates in place when the provided options change.
 */
export function useStandardMaterial(options?: MaybeRefOrGetter<UseStandardMaterialOptions | undefined>): UseStandardMaterialResult {
  const material: ShallowRef<THREE.MeshStandardMaterial | null> = shallowRef(null)

  const dispose: Disposable = () => {
    if (material.value) {
      material.value.dispose()
      material.value = null
    }
  }

  watchEffect(() => {
    const next = options ? toValue(options) ?? {} : {}
    const instance = ensureMaterial(material)

    if (next.color !== undefined)
      instance.color.set(next.color)
    if (next.emissive !== undefined)
      instance.emissive.set(next.emissive)
    if (typeof next.roughness === 'number')
      instance.roughness = THREE.MathUtils.clamp(next.roughness, 0, 1)
    if (typeof next.metalness === 'number')
      instance.metalness = THREE.MathUtils.clamp(next.metalness, 0, 1)

    if (next.map !== undefined)
      instance.map = next.map ?? null
    if (next.envMap !== undefined) {
      instance.envMap = next.envMap ?? null
      instance.needsUpdate = true
    }
  })

  onBeforeUnmount(() => {
    dispose()
  })

  return { material, dispose }
}
