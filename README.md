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

> ℹ️ Setting `:dpr="0"` re-enables the automatic cap (`Math.min(window.devicePixelRatio || 1, 2)`). Provide a positive number to override the cap. Passing the legacy `devicePixelRatio` prop will continue to work during the transition but logs a development warning.

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
| `geometry`   | `THREE.BufferGeometry \| null`               | `null` (creates `BoxGeometry`)       | Geometry applied to the mesh. The fallback geometry is disposed when unmounted or replaced; custom geometries are left untouched. |
| `material`   | `THREE.Material \| THREE.Material[] \| null` | `null` (creates `MeshBasicMaterial`) | Default material is visible without lights. The fallback material is disposed when unmounted or replaced; custom materials remain under caller control. |
| `position`   | `[number, number, number]`                   | `[0, 0, 0]`                          | Mesh world position.                                                                         |
| `rotation`   | `[number, number, number]`                   | `[0, 0, 0]`                          | Euler rotation in radians (XYZ order).                                                       |
| `scale`      | `[number, number, number]`                   | `[1, 1, 1]`                          | Non-uniform scale per axis.                                                                  |
| `animations` | `AnimationSpec \| AnimationSpec[] \| null`   | `null`                               | One or more animations applied each frame.                                                   |

### Behaviour highlights

- `Vhree` owns renderer/scene lifecycles, caps DPR, observes container resize, and shares `{ scene, camera, renderer, sizeEl }` through context.
- `VCamera` registers itself with `Vhree`, keeps aspect ratios synced via `ResizeObserver`, and restores the provider’s fallback camera when unmounted.
- `VMesh` mounts lazily once the scene is available, removes itself on unmount, and only disposes of geometry/material it created. DEV builds log a warning if a disposal attempt fails so leaks surface immediately during development.

## Composables

vhree.js ships a small set of typed composables that expose the underlying Three.js resources without hiding their lifecycles. Every helper returns a `shallowRef` pointing at the lazily created asset and, when relevant, a disposer to eagerly release GPU memory.

| Hook | Description |
| ---- | ----------- |
| `useVhree()` | Access the nearest `<Vhree>` provider. Returns a computed context so consumers can react to provider swaps. |
| `useRenderLoop()` | Retrieve the shared render loop handle. Useful for imperative stepping or custom scheduling. |
| `useFrame(cb)` | Subscribe a callback to the shared RAF loop. Returns a disposer. |
| `useCamera(options)` | Create a managed `PerspectiveCamera` that can optionally register itself as the active camera on the provider. |
| `useScene(options)` | Read the shared scene or lazily create a standalone `THREE.Scene` when no provider is present. |
| `useBoxGeometry(options)` / `useSphereGeometry(options)` | Generate parametrised buffer geometries that dispose previous instances when options change. |
| `useStandardMaterial(options)` | Maintain a `MeshStandardMaterial` instance in-place while reacting to option updates. |
| `useDirectionalLight(options)` | Spawn a directional light, attach it to the active scene, and keep transforms/intensity in sync with reactive options. |
| `useOrbitControls(options)` | Attach `OrbitControls` to the active camera/renderer pair, automatically managing RAF subscriptions when damping or auto-rotation is enabled. |
| `useTexture(source, options)` | Load textures reactively with explicit loading/error state and automatic disposal when the source changes. |
| `useEnvMap(source, options)` | Load cube or equirectangular environment maps, optionally run them through PMREM, and expose SSR-safe loading/error signals. |
| `useGLTF(url, options)` | Fetch GLTF/GLB assets with DRACO/KTX2 support, surface descriptive errors when the resource cannot be retrieved, and dispose of geometries/materials on replacement. |

### Loader helpers

The three loader helpers share a common contract:

- `texture`/`envMap`/`gltf` — a `shallowRef` resolving to the loaded resource (or `null` while pending).
- `isLoading` — a computed boolean toggled while the latest request is in flight.
- `error` — a `shallowRef<Error | null>` capturing the most recent failure, annotated with the requested URL for quicker debugging.
- `reload()` — explicit trigger to retry the current source.
- `dispose()` — dispose of the currently held resource and cancel any inflight requests.

Each helper deduplicates requests: when the source changes mid-flight, the obsolete result is disposed immediately. The loaders guard against SSR by short-circuiting when `window` is unavailable.

```ts
import * as THREE from 'three'
import { computed, ref, watchEffect } from 'vue'
import { useDirectionalLight, useOrbitControls, useStandardMaterial, useTexture, useBoxGeometry } from 'vhree.js'

const textureUrl = ref('https://threejs.org/examples/textures/uv_grid_opengl.jpg')
const { texture, isLoading: textureIsLoading } = useTexture(textureUrl, {
  colorSpace: THREE.SRGBColorSpace,
  minFilter: THREE.LinearMipmapLinearFilter,
  magFilter: THREE.LinearFilter,
})

const { geometry } = useBoxGeometry({ width: 1.2, height: 0.8 })
const { material } = useStandardMaterial({ color: '#f97316', map: computed(() => texture.value) ?? null })
const { light } = useDirectionalLight({ color: '#facc15', intensity: 1.8, position: [2, 3, 4] })
const { controls } = useOrbitControls({ enableDamping: true, dampingFactor: 0.12 })

watchEffect(() => {
  if (!light.value)
    return
  light.value.castShadow = true
})
```

The helpers deliberately expose the raw Three.js instances, making it straightforward to opt into advanced workflows (tuning anisotropy, cloning geometries, or wiring custom animation systems).

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
  /composables
    /controls
    /core
    /geom
    /light
    /load
    /mat
  /core
    context.ts
    loop.ts
  /types
    common.ts
  /core
    context.ts
  index.ts
/docs
/stories
```

Consult `AGENTS.md` for the architectural playbook and contribution checklist.
