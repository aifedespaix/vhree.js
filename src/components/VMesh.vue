<script setup lang="ts">
import { inject, onBeforeUnmount, shallowRef, watch, watchEffect } from 'vue'
import * as THREE from 'three'
import type { PropType } from 'vue'
import { VHREE_CTX } from '../core/context'
import { useFrame } from '../composables/useFrame'
import { useAnimation } from '../animations/useAnimation'
import type { AnimState, AnimationSpec } from '../animations/types'

const props = defineProps({
  geometry: {
    type: Object as PropType<THREE.BufferGeometry | null>,
    default: null
  },
  material: {
    type: [Object, Array] as PropType<THREE.Material | THREE.Material[] | null>,
    default: null
  },
  position: {
    type: Array as PropType<[number, number, number]>,
    default: () => [0, 0, 0]
  },
  rotation: {
    type: Array as PropType<[number, number, number]>,
    default: () => [0, 0, 0]
  },
  scale: {
    type: Array as PropType<[number, number, number]>,
    default: () => [1, 1, 1]
  },
  animations: {
    type: [String, Array, Function, Object] as PropType<AnimationSpec | AnimationSpec[] | null>,
    default: null
  }
})

const ctx = inject(VHREE_CTX, null)

if (!ctx && import.meta.env.DEV) {
  console.warn('[vhree] <VMesh> requires a parent provider (e.g. <Vhree>) to supply a scene context.')
}

const meshRef = shallowRef<THREE.Mesh | null>(null)
const defaultGeometryRef = shallowRef<THREE.BufferGeometry | null>(null)
const defaultMaterialRef = shallowRef<THREE.Material | THREE.Material[] | null>(null)
let attachedScene: THREE.Scene | null = null
const animState: AnimState = { t: 0, paused: false }
const animations = useAnimation(() => props.animations)

const getGeometry = () => {
  if (props.geometry) {
    if (defaultGeometryRef.value) {
      defaultGeometryRef.value.dispose()
      defaultGeometryRef.value = null
    }
    return props.geometry
  }
  if (!defaultGeometryRef.value) {
    defaultGeometryRef.value = new THREE.BoxGeometry(1, 1, 1)
  }
  return defaultGeometryRef.value
}

const getMaterial = () => {
  if (props.material) {
    disposeDefaultMaterial()
    return props.material
  }
  if (!defaultMaterialRef.value) {
    defaultMaterialRef.value = new THREE.MeshBasicMaterial({ color: '#38bdf8' })
  }
  return defaultMaterialRef.value
}

const disposeDefaultMaterial = () => {
  const material = defaultMaterialRef.value
  if (!material) return
  if (Array.isArray(material)) {
    material.forEach((m) => m.dispose())
  } else {
    material.dispose()
  }
  defaultMaterialRef.value = null
}

const disposeDefaultGeometry = () => {
  defaultGeometryRef.value?.dispose()
  defaultGeometryRef.value = null
}

const trackPosition = () => (props.position ? [...props.position] : null)
const trackRotation = () => (props.rotation ? [...props.rotation] : null)
const trackScale = () => (props.scale ? [...props.scale] : null)

watch(
  [() => meshRef.value, trackPosition],
  ([mesh, val]) => {
    if (!mesh || !val) return
    const [px, py, pz] = val
    mesh.position.set(px, py, pz)
  },
  { immediate: true }
)

watch(
  [() => meshRef.value, trackRotation],
  ([mesh, val]) => {
    if (!mesh || !val) return
    const [rx, ry, rz] = val
    mesh.rotation.set(rx, ry, rz)
  },
  { immediate: true }
)

watch(
  [() => meshRef.value, trackScale],
  ([mesh, val]) => {
    if (!mesh || !val) return
    const [sx, sy, sz] = val
    mesh.scale.set(sx, sy, sz)
  },
  { immediate: true }
)

watch(
  () => props.geometry,
  () => {
    const mesh = meshRef.value
    if (!mesh) return
    mesh.geometry = getGeometry()
  }
)

watch(
  () => props.material,
  () => {
    const mesh = meshRef.value
    if (!mesh) return
    mesh.material = getMaterial()
  }
)

watchEffect((onCleanup) => {
  const scene = ctx?.scene.value
  if (!scene) return

  if (!meshRef.value) {
    meshRef.value = new THREE.Mesh(getGeometry(), getMaterial())
  }

  if (attachedScene !== scene && meshRef.value) {
    attachedScene?.remove(meshRef.value)
    scene.add(meshRef.value)
    attachedScene = scene
  }

  onCleanup(() => {
    if (scene && meshRef.value) {
      scene.remove(meshRef.value)
    }
  })
})

onBeforeUnmount(() => {
  attachedScene?.remove(meshRef.value as THREE.Object3D)
  attachedScene = null

  if (props.geometry === null) {
    disposeDefaultGeometry()
  }

  if (props.material === null) {
    disposeDefaultMaterial()
  }

  meshRef.value = null
})

useFrame((dt, now) => {
  const mesh = meshRef.value
  if (!mesh) return

  animState.t += dt

  const active = animations.value
  if (!active.length) return

  for (let i = 0; i < active.length; i += 1) {
    active[i](mesh, animState, dt, now)
  }
})
</script>

<template>
  <slot />
</template>
