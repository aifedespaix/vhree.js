<script setup lang="ts">
import type { AnimationSpec, AnimState } from '../animations/types'
import * as THREE from 'three'
import { inject, onBeforeUnmount, shallowRef, watchEffect } from 'vue'
import { useAnimation } from '../animations/useAnimation'
import { useFrame } from '../composables/useFrame'
import { VHREE_CTX } from '../core/context'

type Vec3 = [number, number, number]

const props = withDefaults(defineProps<{
  geometry?: THREE.BufferGeometry | null
  material?: THREE.Material | THREE.Material[] | null
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
  animations?: AnimationSpec | AnimationSpec[] | null
}>(), {
  geometry: null,
  material: null,
  position: () => [0, 0, 0] as Vec3,
  rotation: () => [0, 0, 0] as Vec3,
  scale: () => [1, 1, 1] as Vec3,
  animations: null,
})

const ctx = inject(VHREE_CTX, null)

if (!ctx && import.meta.env.DEV) {
  console.warn('[vhree] <VMesh> requires a parent provider (e.g. <Vhree>) to supply a scene context.')
}

const meshRef = shallowRef<THREE.Mesh | null>(null)
let attachedScene: THREE.Scene | null = null
const animState: AnimState = { t: 0, paused: false }
const animations = useAnimation(() => props.animations)

let ownedGeometry: THREE.BufferGeometry | null = null
let ownedMaterial: THREE.Material | null = null
let lastAssignedGeometry: THREE.BufferGeometry | null = null
let lastAssignedMaterial: THREE.Material | THREE.Material[] | null = null

const ensureOwnedGeometry = (): THREE.BufferGeometry => {
  if (!ownedGeometry)
    ownedGeometry = new THREE.BoxGeometry(1, 1, 1)

  return ownedGeometry
}

const ensureOwnedMaterial = (): THREE.Material => {
  if (!ownedMaterial)
    ownedMaterial = new THREE.MeshBasicMaterial({ color: '#38bdf8' })

  return ownedMaterial
}

const disposeOwnedGeometry = () => {
  if (!ownedGeometry)
    return

  try {
    ownedGeometry.dispose()
  }
  catch (error) {
    if (import.meta.env.DEV)
      console.warn('[vhree] <VMesh> failed to dispose its default geometry.', error)
  }
  ownedGeometry = null
}

const disposeOwnedMaterial = () => {
  if (!ownedMaterial)
    return

  try {
    ownedMaterial.dispose()
  }
  catch (error) {
    if (import.meta.env.DEV)
      console.warn('[vhree] <VMesh> failed to dispose its default material.', error)
  }
  ownedMaterial = null
}

watchEffect((onCleanup) => {
  const scene = ctx?.scene.value
  if (!scene)
    return

  // si mesh pas créé → on fait un cube par défaut
  if (!meshRef.value) {
    const initialGeometry = props.geometry ?? ensureOwnedGeometry()
    const initialMaterial: THREE.Material | THREE.Material[] = props.material ?? ensureOwnedMaterial()

    meshRef.value = new THREE.Mesh(initialGeometry, initialMaterial)
    lastAssignedGeometry = meshRef.value.geometry
    lastAssignedMaterial = meshRef.value.material

    meshRef.value.position.set(...props.position)
    meshRef.value.rotation.set(...props.rotation)
    meshRef.value.scale.set(...props.scale)
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

watchEffect(() => {
  const mesh = meshRef.value
  if (!mesh)
    return

  const nextGeometry = props.geometry
  const previous = lastAssignedGeometry

  if (nextGeometry) {
    if (previous !== nextGeometry) {
      mesh.geometry = nextGeometry
      if (previous && previous === ownedGeometry)
        disposeOwnedGeometry()

      lastAssignedGeometry = nextGeometry
    }
    return
  }

  const fallback = ensureOwnedGeometry()
  if (previous !== fallback) {
    mesh.geometry = fallback
    lastAssignedGeometry = fallback
  }
})

watchEffect(() => {
  const mesh = meshRef.value
  if (!mesh)
    return

  const nextMaterial = props.material
  const previous = lastAssignedMaterial

  if (nextMaterial) {
    if (previous !== nextMaterial) {
      mesh.material = nextMaterial
      if (previous && previous === ownedMaterial)
        disposeOwnedMaterial()

      lastAssignedMaterial = nextMaterial
    }
    return
  }

  const fallback = ensureOwnedMaterial()
  if (previous !== fallback) {
    mesh.material = fallback
    lastAssignedMaterial = fallback
  }
})

onBeforeUnmount(() => {
  attachedScene?.remove(meshRef.value as THREE.Object3D)
  attachedScene = null
  disposeOwnedGeometry()
  disposeOwnedMaterial()
  lastAssignedGeometry = null
  lastAssignedMaterial = null
  meshRef.value = null
})

useFrame((dt, now) => {
  const mesh = meshRef.value
  if (!mesh)
    return

  animState.t += dt

  const active = animations.value
  if (!active.length)
    return

  for (let i = 0; i < active.length; i += 1) {
    active[i](mesh, animState, dt, now)
  }
})
</script>

<template>
  <!-- cube par défaut affiché même sans slot -->
  <slot v-if="$slots.default" />
</template>
