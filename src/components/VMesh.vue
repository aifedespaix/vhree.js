<script setup lang="ts">
import { inject, onBeforeUnmount, shallowRef, watch, watchEffect } from 'vue'
import * as THREE from 'three'
import { VHREE_CTX } from '../core/context'
import { useFrame } from '../composables/useFrame'
import { useAnimation } from '../animations/useAnimation'
import type { AnimState, AnimationSpec } from '../animations/types'

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

const getGeometry = () => props.geometry ?? new THREE.BoxGeometry(1, 1, 1)
const getMaterial = () => props.material ?? new THREE.MeshBasicMaterial({ color: '#38bdf8' })

watchEffect((onCleanup) => {
  const scene = ctx?.scene.value
  if (!scene) return

  // si mesh pas créé → on fait un cube par défaut
  if (!meshRef.value) {
    meshRef.value = new THREE.Mesh(getGeometry(), getMaterial())
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

onBeforeUnmount(() => {
  attachedScene?.remove(meshRef.value as THREE.Object3D)
  attachedScene = null
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
  <!-- cube par défaut affiché même sans slot -->
  <slot v-if="$slots.default" />
</template>
