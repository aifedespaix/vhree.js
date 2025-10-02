import * as THREE from 'three'
import { onBeforeUnmount, shallowRef, watchEffect } from 'vue'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { toValue } from '@vueuse/core'
import type { ColorLike, Disposable, Vec3 } from '../../types/common'
import { useScene } from '../geom/useScene'

export interface UseDirectionalLightOptions {
  color?: ColorLike
  intensity?: number
  position?: Vec3
  target?: Vec3
  castShadow?: boolean
}

export interface UseDirectionalLightResult {
  light: ShallowRef<THREE.DirectionalLight | null>
  dispose: Disposable
}

function applyVector(target: THREE.Vector3, tuple?: Vec3) {
  if (!tuple)
    return
  target.set(tuple[0], tuple[1], tuple[2])
}

/**
 * Create and register a `THREE.DirectionalLight` inside the active scene.
 */
export function useDirectionalLight(options?: MaybeRefOrGetter<UseDirectionalLightOptions | undefined>): UseDirectionalLightResult {
  const { scene } = useScene()
  const light: ShallowRef<THREE.DirectionalLight | null> = shallowRef(null)
  const targetHelper = new THREE.Object3D()

  const dispose: Disposable = () => {
    if (!light.value)
      return

    const currentScene = scene.value
    if (currentScene) {
      currentScene.remove(light.value)
      currentScene.remove(light.value.target)
    }

    light.value.dispose()
    light.value = null
  }

  watchEffect((onCleanup) => {
    const currentScene = scene.value
    if (!currentScene)
      return

    if (!light.value) {
      const resolved = options ? toValue(options) ?? {} : {}
      light.value = new THREE.DirectionalLight(resolved.color ?? 0xffffff, resolved.intensity ?? 1)
      applyVector(light.value.position, resolved.position ?? [3, 3, 3])
      applyVector(targetHelper.position, resolved.target ?? [0, 0, 0])
      light.value.target = targetHelper
      light.value.castShadow = resolved.castShadow ?? false
      currentScene.add(light.value)
      currentScene.add(light.value.target)
    }

    const instance = light.value
    if (!instance)
      return

    currentScene.add(instance)
    currentScene.add(instance.target)

    onCleanup(() => {
      currentScene.remove(instance)
      currentScene.remove(instance.target)
    })
  })

  watchEffect(() => {
    if (!light.value)
      return

    const next = options ? toValue(options) ?? {} : {}

    if (next.color !== undefined)
      light.value.color.set(next.color)
    if (typeof next.intensity === 'number')
      light.value.intensity = Math.max(0, next.intensity)
    if (next.position)
      applyVector(light.value.position, next.position)
    if (next.target)
      applyVector(light.value.target.position, next.target)
    if (typeof next.castShadow === 'boolean')
      light.value.castShadow = next.castShadow
  })

  onBeforeUnmount(() => {
    dispose()
  })

  return { light, dispose }
}
