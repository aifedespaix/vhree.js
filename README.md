# vhree.js

**vhree.js** experiments with a lean, explicit Vue 3 layer on top of Three.js. The current preview ships three SSR-safe building blocks:

- `Vhree` – the render provider (canvas + renderer + scene lifecycle)
- `VCamera` – an opt-in `PerspectiveCamera` controller wired to `Vhree`
- `VMesh` – declarative mesh helper for attaching geometry/material to the shared scene

The goal is to keep Three primitives accessible while embracing Vue idioms (`provide/inject`, small composables, slot-based composition).

## Installation

```bash
bun install
```

Scripts use Bun, but any Node 18+ runtime can run the tooling. The published package expects peer dependencies `vue` and `three` to be provided by the host app.

## Usage

```vue
<script setup lang="ts">
import * as THREE from 'three'
import { VCamera, Vhree, VMesh } from 'vhree.js'

const background = '#0f172a'
const geometry = new THREE.SphereGeometry(0.55, 32, 16)
const material = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.2 })
</script>

<template>
  <div class="viewport">
    <Vhree :background="background" :dpr="2">
      <VCamera :position="[0, 0, 3]" :look-at="[0, 0, 0]" @ready="(cam) => cam.updateProjectionMatrix()" />
      <VMesh :geometry="geometry" :material="material" :position="[0, 0.1, 0]" />
    </Vhree>
  </div>
</template>
```

`Vhree` exposes its scene, renderer, and size element through context, allowing primitives like `VCamera` and `VMesh` to opt in without extra wiring.

### `Vhree` props

| Prop         | Type     | Default        | Description                                                     |
| ------------ | -------- | -------------- | --------------------------------------------------------------- |
| `background` | `string` | `'#0f172a'`    | Solid colour applied to `scene.background`.                     |
| `dpr`        | `number` | `0` (auto cap) | Device pixel ratio cap. `0` applies `min(devicePixelRatio, 2)`. |

### `VCamera` props

| Prop               | Type                               | Default     | Description                                                           |
| ------------------ | ---------------------------------- | ----------- | --------------------------------------------------------------------- |
| `active`           | `boolean`                          | `true`      | Whether the camera should register as the active scene camera.        |
| `fov`              | `number`                           | `60`        | Field of view in degrees. Updates trigger `updateProjectionMatrix()`. |
| `near`             | `number`                           | `0.1`       | Near clipping plane. Must stay `> 0`.                                 |
| `far`              | `number`                           | `100`       | Far clipping plane. Must stay `> near`.                               |
| `position`         | `[number, number, number]`         | `[0, 0, 5]` | Camera world position.                                                |
| `up`               | `[number, number, number]`         | `[0, 1, 0]` | Up vector to stabilise roll.                                          |
| `lookAt`           | `[number, number, number] \| null` | `null`      | Optional target for `camera.lookAt`.                                  |
| `matrixAutoUpdate` | `boolean`                          | `true`      | Mirrors `camera.matrixAutoUpdate`.                                    |

`VCamera` emits `ready(camera)` once mounted and exposes the raw Three camera through `defineExpose({ camera })` for imperative tweaks.

### `VMesh` props

| Prop         | Type                                         | Default                              | Description                                                                                  |
| ------------ | -------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `geometry`   | `THREE.BufferGeometry \| null`               | `null` (creates `BoxGeometry`)       | Geometry applied to the mesh. Custom geometries are not disposed automatically.              |
| `material`   | `THREE.Material \| THREE.Material[] \| null` | `null` (creates `MeshBasicMaterial`) | Default material is visible without lights. Custom materials are not disposed automatically. |
| `position`   | `[number, number, number]`                   | `[0, 0, 0]`                          | Mesh world position.                                                                         |
| `rotation`   | `[number, number, number]`                   | `[0, 0, 0]`                          | Euler rotation in radians (XYZ order).                                                       |
| `scale`      | `[number, number, number]`                   | `[1, 1, 1]`                          | Non-uniform scale per axis.                                                                  |
| `animations` | `AnimationSpec \| AnimationSpec[] \| null`   | `null`                               | One or more animations applied each frame.                                                   |

### Behaviour highlights

- `Vhree` owns renderer/scene lifecycles, caps DPR, observes container resize, and shares `{ scene, camera, renderer, sizeEl }` through context.
- `VCamera` registers itself with `Vhree`, keeps aspect ratios synced via `ResizeObserver`, and restores the provider’s fallback camera when unmounted.
- `VMesh` mounts lazily once the scene is available, removes itself on unmount, and only disposes of geometry/material it created.

## Animations

`VMesh` accepts an `animations` prop that resolves specs into callbacks executed inside the shared render loop. An **Animation** is a function with signature `(object: THREE.Object3D, state: AnimState, dt: number, now: number) => void`, where `dt` is the delta in seconds and `now` is the elapsed time.

```vue
<script setup lang="ts">
import { pulse } from 'vhree.js'
</script>

<template>
  <VMesh
    :geometry="geometry"
    :material="material"
    :animations="[
      'spin',
      { name: 'bounce', options: { amplitude: 0.2 } },
      pulse({ frequency: 2 }),
    ]"
  />
</template>
```

The library registers four built-in factories:

| Name     | Options                                                                                 | Effect                                                                  |
| -------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `spin`   | `{ axis?: 'x' \| 'y' \| 'z'; speed?: number }`                                          | Adds `speed * dt` to the chosen rotation axis.                          |
| `rotate` | `{ x?: number; y?: number; z?: number }`                                                | Adds per-axis angular velocity in radians per second.                   |
| `bounce` | `{ axis?: 'x' \| 'y' \| 'z'; amplitude?: number; frequency?: number; center?: number }` | Oscillates the selected position axis with `sin(now * 2π * frequency)`. |
| `pulse`  | `{ amplitude?: number; frequency?: number; base?: number }`                             | Applies uniform scale: `base + sin(now * 2π * frequency) * amplitude`.  |

Custom animations can be registered globally and then referenced by name:

```ts
import { registerAnimation } from 'vhree.js'

registerAnimation('wiggle', () => (object, state, dt, now) => {
  if (state.paused)
    return
  object.rotation.z = Math.sin(now * Math.PI * 4) * 0.25
})
```

You can also pass factories or ready-made callbacks directly in the `animations` prop. Animations run every frame, so avoid allocations or heavy work inside the callbacks to keep frame times stable.

## Local Development

- `bun run dev` – Vite playground with interactive knobs for `Vhree`, `VCamera`, and `VMesh`.
- `bun run story:dev` – Histoire catalogue for component variants.
- `bun run docs:dev` – VitePress documentation site.

When adding or modifying components/composables:

1. Update this README (usage + props).
2. Sync the VitePress docs under `docs/`.
3. Refresh the matching Histoire stories under `/stories`.

## File Structure

```
/src
  /components
    VCamera.vue
    Vhree.vue
    VMesh.vue
  /core
    context.ts
  index.ts
/docs
/stories
```

Consult `AGENTS.md` for the architectural playbook and contribution checklist.
