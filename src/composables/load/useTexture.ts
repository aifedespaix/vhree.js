import * as THREE from 'three'
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { MaybeRefOrGetter, ShallowRef, ComputedRef } from 'vue'
import { toValue } from '@vueuse/core'
import type { Disposable } from '../../types/common'

const isClient = typeof window !== 'undefined'

export interface UseTextureOptions {
  crossOrigin?: string
  colorSpace?: THREE.ColorSpace
  generateMipmaps?: boolean
  minFilter?: THREE.TextureFilter
  magFilter?: THREE.TextureFilter
  wrapS?: THREE.Wrapping
  wrapT?: THREE.Wrapping
  anisotropy?: number
  flipY?: boolean
}

export interface UseTextureResult {
  texture: ShallowRef<THREE.Texture | null>
  isLoading: ComputedRef<boolean>
  error: ShallowRef<Error | null>
  dispose: Disposable
  reload: () => Promise<void>
}

function applyTextureOptions(texture: THREE.Texture, options: UseTextureOptions | undefined) {
  if (!options)
    return

  if (options.colorSpace)
    texture.colorSpace = options.colorSpace
  if (typeof options.generateMipmaps === 'boolean')
    texture.generateMipmaps = options.generateMipmaps
  if (typeof options.flipY === 'boolean')
    texture.flipY = options.flipY
  if (typeof options.anisotropy === 'number')
    texture.anisotropy = options.anisotropy
  if (options.minFilter)
    texture.minFilter = options.minFilter
  if (options.magFilter)
    texture.magFilter = options.magFilter
  if (options.wrapS)
    texture.wrapS = options.wrapS
  if (options.wrapT)
    texture.wrapT = options.wrapT
  texture.needsUpdate = true
}

export function useTexture(source: MaybeRefOrGetter<string | null | undefined>, options?: MaybeRefOrGetter<UseTextureOptions | undefined>): UseTextureResult {
  const texture: ShallowRef<THREE.Texture | null> = shallowRef(null)
  const error = shallowRef<Error | null>(null)
  const loading = shallowRef(false)
  let token = 0

  const dispose: Disposable = () => {
    token += 1
    texture.value?.dispose()
    texture.value = null
    error.value = null
    loading.value = false
  }

  const loadFromUrl = async (url: string) => {
    if (!isClient)
      return

    const current = ++token
    loading.value = true
    error.value = null

    const loader = new THREE.TextureLoader()
    if (options) {
      const resolved = toValue(options)
      if (resolved?.crossOrigin)
        loader.setCrossOrigin(resolved.crossOrigin)
    }

    try {
      const tex = await loader.loadAsync(url)
      if (current !== token) {
        tex.dispose()
        return
      }

      applyTextureOptions(tex, options ? toValue(options) : undefined)
      const previous = texture.value
      texture.value = tex
      previous?.dispose()
    }
    catch (err) {
      if (current === token)
        error.value = err instanceof Error ? err : new Error(String(err))
    }
    finally {
      if (current === token)
        loading.value = false
    }
  }

  const reload = async () => {
    const url = toValue(source)
    if (!url) {
      dispose()
      return
    }
    await loadFromUrl(url)
  }

  watch(
    () => toValue(source),
    (url) => {
      if (!url) {
        dispose()
        return
      }
      reload()
    },
    { immediate: true },
  )

  watch(
    () => (options ? toValue(options) : undefined),
    (next) => {
      if (!texture.value || !next)
        return
      applyTextureOptions(texture.value, next)
    },
    { deep: true },
  )

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    texture,
    isLoading: computed(() => loading.value),
    error,
    dispose,
    reload,
  }
}
