import * as THREE from 'three'
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { MaybeRefOrGetter, ShallowRef, ComputedRef } from 'vue'
import { toValue } from '@vueuse/core'
import type { Disposable } from '../../types/common'
import { useVhree } from '../core/useVhree'

const isClient = typeof window !== 'undefined'

export type EnvMapSource =
  | string
  | { type: 'rgbe'; url: string }
  | { type: 'equirect'; url: string }
  | { type: 'cube'; urls: readonly [string, string, string, string, string, string] }

export interface UseEnvMapOptions {
  colorSpace?: THREE.ColorSpace
  usePmrem?: boolean
}

export interface UseEnvMapResult {
  envMap: ShallowRef<THREE.Texture | null>
  isLoading: ComputedRef<boolean>
  error: ShallowRef<Error | null>
  dispose: Disposable
  reload: () => Promise<void>
}

function inferSourceType(source: string): EnvMapSource {
  const lower = source.toLowerCase()
  if (lower.endsWith('.hdr') || lower.endsWith('.exr'))
    return { type: 'rgbe', url: source }
  return { type: 'equirect', url: source }
}

async function loadRgbE(url: string): Promise<THREE.DataTexture> {
  const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader')
  const loader = new RGBELoader()
  return loader.loadAsync(url)
}

function applyEnvMapOptions(texture: THREE.Texture, options: UseEnvMapOptions | undefined) {
  if (!options)
    return
  if (options.colorSpace)
    texture.colorSpace = options.colorSpace
  texture.needsUpdate = true
}

export function useEnvMap(source: MaybeRefOrGetter<EnvMapSource | null | undefined>, options?: MaybeRefOrGetter<UseEnvMapOptions | undefined>): UseEnvMapResult {
  const { context } = useVhree()
  const envMap: ShallowRef<THREE.Texture | null> = shallowRef(null)
  const error = shallowRef<Error | null>(null)
  const loading = shallowRef(false)
  let token = 0

  const dispose: Disposable = () => {
    token += 1
    envMap.value?.dispose()
    envMap.value = null
    error.value = null
    loading.value = false
  }

  const convertWithPmrem = (texture: THREE.Texture, type: 'equirect' | 'rgbe' | 'cube'): THREE.Texture => {
    const renderer = context.value?.renderer.value
    const shouldPmrem = options ? (toValue(options)?.usePmrem ?? true) : true
    if (!renderer || !shouldPmrem)
      return texture

    const generator = new THREE.PMREMGenerator(renderer)
    generator.compileEquirectangularShader()

    try {
      let target: THREE.WebGLRenderTarget
      if (type === 'cube')
        target = generator.fromCubemap(texture as THREE.CubeTexture)
      else
        target = generator.fromEquirectangular(texture)
      texture.dispose()
      const result = target.texture
      generator.dispose()
      return result
    }
    catch (err) {
      generator.dispose()
      throw err
    }
  }

  const loadTextureByKind = async (source: Exclude<EnvMapSource, string>): Promise<THREE.Texture> => {
    if (!isClient)
      return new THREE.Texture()

    if (source.type === 'cube') {
      const loader = new THREE.CubeTextureLoader()
      const cube = await loader.loadAsync(source.urls)
      cube.mapping = THREE.CubeReflectionMapping
      return convertWithPmrem(cube, 'cube')
    }

    if (source.type === 'rgbe') {
      const hdr = await loadRgbE(source.url)
      hdr.mapping = THREE.EquirectangularReflectionMapping
      hdr.needsUpdate = true
      return convertWithPmrem(hdr, 'rgbe')
    }

    const loader = new THREE.TextureLoader()
    const texture = await loader.loadAsync(source.url)
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.needsUpdate = true
    return convertWithPmrem(texture, 'equirect')
  }

  const load = async (input: EnvMapSource) => {
    if (!isClient)
      return

    const current = ++token
    loading.value = true
    error.value = null

    try {
      const texture = await (typeof input === 'string' ? loadTextureByKind(inferSourceType(input)) : loadTextureByKind(input))

      if (current !== token) {
        texture.dispose()
        return
      }

      applyEnvMapOptions(texture, options ? toValue(options) : undefined)
      const previous = envMap.value
      envMap.value = texture
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
    const raw = toValue(source)
    if (!raw) {
      dispose()
      return
    }
    await load(raw)
  }

  watch(
    () => toValue(source),
    (value) => {
      if (!value) {
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
      if (!envMap.value || !next)
        return
      applyEnvMapOptions(envMap.value, next)
    },
    { deep: true },
  )

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    envMap,
    isLoading: computed(() => loading.value),
    error,
    dispose,
    reload,
  }
}
