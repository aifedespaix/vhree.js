<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, shallowRef, watch } from 'vue'
import * as THREE from 'three'
import { VHREE_CTX } from '../core/context'
import type { CameraReleaseOptions, CameraSetOptions } from '../core/context'
import { createRenderLoop } from '../core/loop'

const props = defineProps({
  background: { type: String, default: '#0f172a' },
  devicePixelRatio: { type: Number, default: 1 }
})

const rootRef = shallowRef<HTMLDivElement | null>(null)
const canvasRef = shallowRef<HTMLCanvasElement | null>(null)

const sceneRef = shallowRef<THREE.Scene | null>(null)
const cameraRef = shallowRef<THREE.PerspectiveCamera | null>(null)
const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)
const sizeElRef = shallowRef<HTMLElement | null>(null)
const loop = createRenderLoop()

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let defaultCamera: THREE.PerspectiveCamera | null = null
let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let activeCameraOwner: symbol | null = null
let lastSize = { width: 1, height: 1 }

const DEFAULT_CAMERA_OWNER = Symbol('vhree-default-camera')

const registerCameraOwner = () => Symbol('vhree-camera-owner')

const updateCameraAspect = (camera: THREE.PerspectiveCamera | null) => {
  if (!camera) return
  camera.aspect = lastSize.width / lastSize.height
  camera.updateProjectionMatrix()
}

const ensureDefaultCamera = () => {
  if (!scene) return null
  if (!defaultCamera) {
    defaultCamera = new THREE.PerspectiveCamera(60, lastSize.width / lastSize.height, 0.1, 100)
    defaultCamera.position.set(0, 0, 3)
    defaultCamera.lookAt(0, 0, 0)
  }
  return defaultCamera
}

const requestRender = () => {
  if (!renderer || !scene) return
  const cam = cameraRef.value
  if (!cam) return
  renderer.render(scene, cam)
}

const setCamera = (camera: THREE.PerspectiveCamera, { owner, disposePrev = false }: CameraSetOptions) => {
  if (!scene) return
  if (import.meta.env.DEV && activeCameraOwner && activeCameraOwner !== owner) {
    console.warn('[vhree] multiple active cameras detected. Last mounted camera wins.')
  }

  const previousCamera = cameraRef.value
  if (disposePrev && previousCamera && previousCamera !== camera && previousCamera === defaultCamera) {
    defaultCamera = null
  }

  cameraRef.value = camera
  activeCameraOwner = owner
  updateCameraAspect(camera)
  requestRender()
}

const releaseCamera = ({ owner }: CameraReleaseOptions) => {
  if (activeCameraOwner !== owner) {
    if (import.meta.env.DEV) {
      console.warn('[vhree] releaseCamera called by non-active owner. Ignoring.')
    }
    return
  }

  const fallback = ensureDefaultCamera()
  activeCameraOwner = null

  if (fallback) {
    cameraRef.value = fallback
    activeCameraOwner = DEFAULT_CAMERA_OWNER
    updateCameraAspect(fallback)
  } else {
    cameraRef.value = null
  }

  requestRender()
}

provide(VHREE_CTX, {
  scene: sceneRef,
  camera: cameraRef,
  renderer: rendererRef,
  sizeEl: sizeElRef,
  loop,
  registerCameraOwner,
  setCamera,
  releaseCamera
})

const applyBackground = (value: string) => {
  if (!scene) return
  scene.background = new THREE.Color(value)
}

const resize = () => {
  const container = sizeElRef.value
  if (!container || !renderer) return
  const rect = container.getBoundingClientRect()
  const width = Math.max(rect.width || container.clientWidth, 1)
  const height = Math.max(rect.height || container.clientHeight, 1)
  lastSize = { width, height }
  renderer.setSize(width, height, false)
  updateCameraAspect(cameraRef.value)
}

watch(
  () => props.background,
  (value) => applyBackground(value),
  { immediate: true }
)

watch(
  () => props.devicePixelRatio,
  (value) => {
    if (!renderer || typeof window === 'undefined') return
    const target = value > 0 ? value : Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(target)
    requestRender()
  },
  { immediate: true }
)

onMounted(() => {
  if (typeof window === 'undefined') return

  const canvas = canvasRef.value
  const root = rootRef.value
  if (!canvas || !root) return

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  rendererRef.value = renderer

  const targetDpr = props.devicePixelRatio > 0 ? props.devicePixelRatio : Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(targetDpr)

  scene = new THREE.Scene()
  sceneRef.value = scene
  sizeElRef.value = root

  applyBackground(props.background)

  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  const directional = new THREE.DirectionalLight(0xffffff, 0.8)
  directional.position.set(3, 2, 1)
  scene.add(ambient, directional)

  const rect = root.getBoundingClientRect()
  const width = Math.max(rect.width || root.clientWidth, 1)
  const height = Math.max(rect.height || root.clientHeight, 1)
  lastSize = { width, height }
  renderer.setSize(width, height, false)

  const initialCamera = ensureDefaultCamera()
  if (initialCamera) {
    cameraRef.value = initialCamera
    activeCameraOwner = DEFAULT_CAMERA_OWNER
    updateCameraAspect(initialCamera)
  }

  requestRender()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
  } else {
    window.addEventListener('resize', resize)
  }

  const renderLoop = (time: number) => {
    loop.step(time)

    if (!renderer || !scene) return
    const cam = cameraRef.value
    if (cam) {
      renderer.render(scene, cam)
    }
    animationFrameId = window.requestAnimationFrame(renderLoop)
  }

  loop.reset()
  animationFrameId = window.requestAnimationFrame(renderLoop)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  loop.reset()

  resizeObserver?.disconnect()
  resizeObserver = null
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resize)
  }

  renderer?.dispose()

  scene?.clear()

  sceneRef.value = null
  cameraRef.value = null
  rendererRef.value = null
  sizeElRef.value = null
  defaultCamera = null
  renderer = null
  scene = null
})
</script>

<template>
  <div ref="rootRef" class="vhree-root">
    <canvas ref="canvasRef" class="vhree-canvas" />
    <slot />
  </div>
</template>

<style scoped>
.vhree-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
}

.vhree-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
