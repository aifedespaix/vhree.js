# VCamera

`VCamera` creates and manages a Three.js `PerspectiveCamera`, wiring it into the active `Vhree` provider. Use it to override the default camera or to swap between multiple viewpoints.

## Usage

```vue
<script setup lang="ts">
import { Vhree, VCamera } from 'vhree.js'

const fov = 55
const position: [number, number, number] = [1.2, 0.8, 3.4]
const target: [number, number, number] = [0, 0.2, 0]
</script>

<template>
  <Vhree background="#020617">
    <VCamera :fov="fov" :position="position" :look-at="target" />
  </Vhree>
</template>
```

The component emits `ready(camera)` once it mounts and calls `ctx.setCamera`. You can capture the raw camera for advanced tweaks or animation systems:

```vue
<VCamera @ready="(camera) => controls.attach(camera)" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `active` | `boolean` | `true` | Registers the camera with the provider. Toggle to `false` to release ownership. |
| `fov` | `number` | `60` | Field of view in degrees. Triggers `updateProjectionMatrix()` when altered. |
| `near` | `number` | `0.1` | Near clipping plane (`> 0`). DEV mode warns if invalid. |
| `far` | `number` | `100` | Far clipping plane (`> near`). DEV mode warns if invalid. |
| `position` | `[number, number, number]` | `[0, 0, 5]` | Camera world position. |
| `up` | `[number, number, number]` | `[0, 1, 0]` | Up vector used to compute roll. |
| `lookAt` | `[number, number, number] \| null` | `null` | Optional look-at target. Leave `null` to manage orientation manually. |
| `matrixAutoUpdate` | `boolean` | `true` | Mirrors Three's `matrixAutoUpdate` flag. |

## Behaviour

- Creates the `PerspectiveCamera` lazily on `onMounted` (SSR-safe).
- Computes aspect ratio from the provider’s size element and keeps it in sync with `ResizeObserver`.
- Registers itself with `Vhree` when `active` and restores the fallback camera on unmount.
- Emits DEV warnings for invalid clip planes, conflicting owners, or when the scene is left without an active camera.
- Exposes the raw camera through `defineExpose({ camera })`.

## Histoire Story

Variants covering multiple camera positions and activation toggles live under `/stories/VCamera.story.vue`. Launch `bun run story:dev` to try them interactively.

