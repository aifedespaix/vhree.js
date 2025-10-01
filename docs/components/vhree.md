# Vhree

`Vhree` is the render provider. It mounts a Three.js renderer inside a canvas element, sets up a neutral lighting rig, and exposes the scene infrastructure through context so components like `VCamera` and `VMesh` can hook into it.

::: tip SSR safety
The component defers every WebGL side effect to `onMounted` and cleans up GPU resources on unmount, making it safe to import in SSR environments.
:::

## Usage

```vue
<script setup lang="ts">
import { Vhree, VCamera, VMesh } from 'vhree.js'
import * as THREE from 'three'

const background = '#0f172a'
const geometry = new THREE.TorusKnotGeometry(0.45, 0.18, 128, 32)
const material = new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.2 })
</script>

<template>
  <div class="viewport">
    <Vhree :background="background">
      <VCamera :position="[0, 0, 3]" :look-at="[0, 0, 0]" />
      <VMesh :geometry="geometry" :material="material" :position="[0, 0.15, 0]" />
    </Vhree>
  </div>
</template>
```

`Vhree` stretches to fill the parent element and reacts to container resizes automatically. It shares `{ scene, camera, renderer, sizeEl }` via Vue's `provide/inject`, letting nested primitives render inside the same canvas without hidden wiring.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `background` | `string` | `'#0f172a'` | Applied to the scene background via `THREE.Color`. |
| `dpr` | `number` | `0` | Caps renderer DPR. `0` falls back to `Math.min(devicePixelRatio, 2)`. |

## Behaviour Overview

- Creates a single renderer and disposes it during `onBeforeUnmount`.
- Caps the device pixel ratio (auto-capped to `2` unless overridden via `dpr`).
- Observes its container size through `ResizeObserver`.
- Seeds the scene with ambient and directional lights so meshes look reasonable out of the box.
- Provides `{ scene, camera, renderer, sizeEl, setCamera }` so dependent components (e.g. `VCamera`, `VMesh`) can hook into the same render loop.

## Histoire Story

A live set of variants covering both props lives under `/stories/Vhree.story.vue`. Run `bun run story:dev` and tweak the controls to verify behavior before shipping changes.
