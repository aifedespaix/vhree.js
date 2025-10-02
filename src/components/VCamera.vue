<script setup lang="ts">
import type { PropType } from 'vue'
import { useMutationObserver, useResizeObserver } from '@vueuse/core'
import * as THREE from 'three'
import { inject, onBeforeUnmount, onMounted, shallowRef, toRef, watch } from 'vue'
import { VHREE_CTX } from '../core/context'

defineOptions({ name: 'VCamera' })

const props = defineProps({
  active: { type: Boolean, default: true },
  fov: { type: Number, default: 60 }, // (0, 180)
  near: { type: Number, default: 0.1 }, // > 0
  far: { type: Number, default: 100 }, // > near
  position: { type: Array as PropType<Vec3>, default: () => [0, 0, 5] },
  up: { type: Array as PropType<Vec3>, default: () => [0, 1, 0] },
  lookAt: { type: Array as PropType<Vec3 | null>, default: () => null },
  matrixAutoUpdate: { type: Boolean, default: true },
})

const emit = defineEmits<{ (e: 'ready', camera: THREE.PerspectiveCamera): void }>()

type Vec3 = [number, number, number]

const ctx = inject(VHREE_CTX, null)
if (!ctx && import.meta.env.DEV) {
  console.warn('[vhree] <VCamera> requires a <Vhree> provider.')
}

const ownerToken = ctx?.registerCameraOwner?.() ?? null
const cameraRef = shallowRef<THREE.PerspectiveCamera | null>(null)
const isActive = shallowRef(false)

// handy refs
const activeRef = toRef(props, 'active')
const fovRef = toRef(props, 'fov')
const nearRef = toRef(props, 'near')
const farRef = toRef(props, 'far')
const posRef = toRef(props, 'position')
const upRef = toRef(props, 'up')
const lookAtRef = toRef(props, 'lookAt')
const autoMatRef = toRef(props, 'matrixAutoUpdate')

// temp vectors (no per-frame allocs)
const tmpVec3 = new THREE.Vector3()

function devValidate() {
  if (!import.meta.env.DEV)
    return
  const fov = fovRef.value
  const near = nearRef.value
  const far = farRef.value
  if (!Number.isFinite(fov) || fov <= 0 || fov >= 180)
    console.warn('[vhree][VCamera] fov should be (0,180), got:', fov)
  if (!(near > 0))
    console.warn('[vhree][VCamera] near should be > 0, got:', near)
  if (!(far > near))
    console.warn('[vhree][VCamera] far should be > near (near:', near, 'far:', far, ')')
}

function computeAspect(): number {
  const el = ctx?.sizeEl?.value
  if (!el)
    return 1
  const r = el.getBoundingClientRect()
  const w = Math.max(1, Math.floor(r.width || el.clientWidth || 1))
  const h = Math.max(1, Math.floor(r.height || el.clientHeight || 1))
  return w / h
}

function syncAspect() {
  const cam = cameraRef.value
  if (!cam)
    return
  cam.aspect = computeAspect()
  cam.updateProjectionMatrix()
}

function activateCamera() {
  if (!ctx || !cameraRef.value)
    return
  // ✅ fallback: activer même sans ownerToken
  if (ownerToken) {
    ctx.setCamera?.(cameraRef.value, { owner: ownerToken, disposePrev: true })
  }
  else {
    ctx.setCamera?.(cameraRef.value, { disposePrev: true } as any)
  }
  isActive.value = true
}

function releaseCamera() {
  if (!ctx || !cameraRef.value || !isActive.value)
    return
  if (ownerToken && ctx.releaseCamera) {
    ctx.releaseCamera({ owner: ownerToken, camera: cameraRef.value })
  }
  else {
    // fallback: si notre caméra est active, la libère via setCamera(null) si le provider l’autorise
    if (ctx.camera?.value === cameraRef.value && (ctx as any).clearCamera) {
      (ctx as any).clearCamera()
    }
  }
  isActive.value = false
  if (import.meta.env.DEV && !ctx.camera?.value) {
    console.warn('[vhree][VCamera] released; no active camera remains.')
  }
}

function applyMatrixAutoUpdate() {
  const cam = cameraRef.value
  if (!cam)
    return
  cam.matrixAutoUpdate = !!autoMatRef.value
}

function applyProjection() {
  const cam = cameraRef.value
  if (!cam)
    return
  cam.fov = fovRef.value
  cam.near = nearRef.value
  cam.far = farRef.value
  cam.updateProjectionMatrix()
}

function applyPosition() {
  const cam = cameraRef.value
  const v = posRef.value
  if (!cam || !v)
    return
  cam.position.set(v[0], v[1], v[2])
  cam.updateMatrixWorld()
}

function applyUp() {
  const cam = cameraRef.value
  const v = upRef.value
  if (!cam || !v)
    return
  cam.up.set(v[0], v[1], v[2])
  cam.updateMatrixWorld()
}

function applyLookAt() {
  const cam = cameraRef.value
  const v = lookAtRef.value
  if (!cam || !v)
    return
  tmpVec3.set(v[0], v[1], v[2])
  cam.lookAt(tmpVec3)
  cam.updateMatrixWorld()
}

// observe sizeEl even if it comes later
function setupResizeSync() {
  watch(() => ctx?.sizeEl?.value, (el, _, onCleanup) => {
    if (!el)
      return
    syncAspect() // initial sync now that el exists
    const ro = useResizeObserver(el, syncAspect)
    const mo = useMutationObserver(el, syncAspect, { attributes: true, attributeFilter: ['style', 'class'] })
    onCleanup(() => {
      ro.stop()
      mo.stop()
    })
  }, { immediate: true })
}

onMounted(() => {
  if (!ctx || typeof window === 'undefined')
    return

  devValidate()

  const cam = new THREE.PerspectiveCamera(
    fovRef.value,
    /* aspect */ computeAspect(), // direct aspect on mount if possible
    nearRef.value,
    farRef.value,
  )
  cameraRef.value = cam

  applyMatrixAutoUpdate()
  applyProjection() // keep, ensures planes set + projection
  applyPosition()
  applyUp()
  applyLookAt()

  setupResizeSync() // ensures future aspect syncs

  if (activeRef.value)
    activateCamera()
  emit('ready', cam)
})

// Activation / désactivation
watch(activeRef, (val) => {
  val ? activateCamera() : releaseCamera()
})

// Projection groupée (1 seul updateProjectionMatrix)
watch([fovRef, nearRef, farRef], () => {
  devValidate()
  applyProjection()
})

// Transforms
watch(posRef, applyPosition, { immediate: true })
watch(upRef, applyUp, { immediate: true })
watch(lookAtRef, applyLookAt, { immediate: true })

// Matrix auto
watch(autoMatRef, applyMatrixAutoUpdate, { immediate: true })

onBeforeUnmount(() => {
  releaseCamera()
  cameraRef.value = null
})

// expose
defineExpose({ camera: cameraRef })
</script>

<template>
  <slot />
</template>
