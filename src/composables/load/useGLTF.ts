import * as THREE from 'three'
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { MaybeRefOrGetter, ShallowRef, ComputedRef } from 'vue'
import { toValue } from '@vueuse/core'
import type { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import type { Disposable } from '../../types/common'
import { useVhree } from '../core/useVhree'

const isClient = typeof window !== 'undefined'

export interface UseGLTFOptions {
  crossOrigin?: string
  dracoDecoderPath?: string
  ktx2TranscoderPath?: string
  meshoptDecoder?: () => Promise<any>
  onModifyLoader?: (loader: GLTFLoader) => void
}

export interface UseGLTFResult {
  gltf: ShallowRef<GLTF | null>
  scene: ComputedRef<THREE.Object3D | null>
  isLoading: ComputedRef<boolean>
  error: ShallowRef<Error | null>
  dispose: Disposable
  reload: () => Promise<void>
}

async function createLoader(options: UseGLTFOptions | undefined, renderer: THREE.WebGLRenderer | null): Promise<{ loader: GLTFLoader; dispose: Disposable }> {
  const { GLTFLoader: LoaderCtor } = await import('three/examples/jsm/loaders/GLTFLoader')
  const loader = new LoaderCtor()
  const disposers: Disposable[] = []

  if (options?.crossOrigin)
    loader.setCrossOrigin(options.crossOrigin)

  if (options?.dracoDecoderPath) {
    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader')
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(options.dracoDecoderPath)
    loader.setDRACOLoader(dracoLoader)
    disposers.push(() => dracoLoader.dispose())
  }

  if (options?.ktx2TranscoderPath) {
    const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader')
    const ktxLoader = new KTX2Loader()
    ktxLoader.setTranscoderPath(options.ktx2TranscoderPath)
    if (renderer)
      ktxLoader.detectSupport(renderer)
    loader.setKTX2Loader(ktxLoader)
    disposers.push(() => ktxLoader.dispose())
  }

  if (options?.meshoptDecoder) {
    const decoder = await options.meshoptDecoder()
    loader.setMeshoptDecoder(decoder)
  }

  options?.onModifyLoader?.(loader)

  return { loader, dispose: () => disposers.forEach((fn) => fn()) }
}

function disposeGLTF(gltf: GLTF | null) {
  if (!gltf)
    return

  const materials = new Set<THREE.Material>()

  const disposeMaterial = (material: THREE.Material | THREE.Material[] | undefined) => {
    if (!material)
      return
    if (Array.isArray(material)) {
      material.forEach((mat) => disposeMaterial(mat))
      return
    }
    if (materials.has(material))
      return
    material.dispose?.()
    materials.add(material)
  }

  const disposeTexture = (texture: THREE.Texture | undefined) => {
    texture?.dispose?.()
  }

  gltf.scenes?.forEach((scene) => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh || mesh.isSkinnedMesh) {
        disposeMaterial(mesh.material as THREE.Material | THREE.Material[])
        mesh.geometry?.dispose?.()
      }
      const points = child as THREE.Points
      if (points.isPoints) {
        disposeMaterial(points.material as THREE.Material | THREE.Material[])
        points.geometry?.dispose?.()
      }
      const line = child as THREE.Line
      if (line.isLine || line.isLineSegments) {
        disposeMaterial(line.material as THREE.Material | THREE.Material[])
        line.geometry?.dispose?.()
      }
    })
  })

  void gltf.parser?.getDependencies?.('texture').then((textures) => {
    textures?.forEach((tex) => disposeTexture(tex))
  }).catch(() => {})

  gltf.parser?.dispose?.()
}

export function useGLTF(source: MaybeRefOrGetter<string | null | undefined>, options?: MaybeRefOrGetter<UseGLTFOptions | undefined>): UseGLTFResult {
  const { context } = useVhree()
  const gltf: ShallowRef<GLTF | null> = shallowRef(null)
  const error = shallowRef<Error | null>(null)
  const loading = shallowRef(false)
  let token = 0

  const dispose: Disposable = () => {
    token += 1
    disposeGLTF(gltf.value)
    gltf.value = null
    error.value = null
    loading.value = false
  }

  const load = async (url: string) => {
    if (!isClient)
      return

    const targetUrl = url.trim()
    if (!targetUrl) {
      dispose()
      return
    }

    const current = ++token
    loading.value = true
    error.value = null

    let disposeExtras: Disposable | null = null
    try {
      const opts = options ? toValue(options) : undefined
      const created = await createLoader(opts, context.value?.renderer.value ?? null)
      const loader = created.loader
      disposeExtras = created.dispose
      const model = await loader.loadAsync(targetUrl)

      if (current !== token) {
        disposeGLTF(model)
        return
      }

      disposeGLTF(gltf.value)
      gltf.value = model
    }
    catch (err) {
      if (current === token) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        const failure = new Error(`Failed to load GLTF from "${targetUrl}": ${errorMessage}`)
        if (err instanceof Error) {
          try {
            Object.defineProperty(failure, 'cause', { value: err })
          }
          catch {
            // ignore environments that do not allow redefining the property
          }
        }
        error.value = failure
      }
    }
    finally {
      disposeExtras?.()
      if (current === token)
        loading.value = false
    }
  }

  const reload = async () => {
    const rawUrl = toValue(source)
    const normalizedUrl = typeof rawUrl === 'string' ? rawUrl.trim() : ''
    if (!normalizedUrl) {
      dispose()
      return
    }
    await load(normalizedUrl)
  }

  watch(
    () => toValue(source),
    (url) => {
      const resolvedUrl = typeof url === 'string' ? url.trim() : ''
      if (!resolvedUrl) {
        dispose()
        return
      }
      void load(resolvedUrl)
    },
    { immediate: true },
  )

  watch(
    () => (options ? toValue(options) : undefined),
    () => {
      if (!gltf.value)
        return
      reload()
    },
    { deep: true },
  )

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    gltf,
    scene: computed(() => gltf.value?.scene ?? null),
    isLoading: computed(() => loading.value),
    error,
    dispose,
    reload,
  }
}
