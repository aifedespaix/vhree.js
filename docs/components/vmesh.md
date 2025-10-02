# VMesh

`VMesh` attaches a `THREE.Mesh` to the nearest `Vhree` provider. It accepts geometry, material, and transform props so you can declaratively describe scene content without leaving Vue.

::: warning Requires provider
`VMesh` must be rendered as a descendant of `Vhree` (or any future canvas provider). In dev mode the component logs a warning if the context is missing.
:::

## Usage

```vue
<script setup lang="ts">
import * as THREE from 'three'
import { VCamera, Vhree, VMesh } from 'vhree.js'

const geometry = new THREE.SphereGeometry(0.5, 32, 16)
const material = new THREE.MeshStandardMaterial({ color: '#22d3ee', metalness: 0.1, roughness: 0.5 })
</script>

<template>
  <Vhree background="#020617">
    <VCamera :position="[0, 0, 3]" :look-at="[0, 0, 0]" />
    <VMesh :geometry="geometry" :material="material" :position="[0, 0.25, 0]" />
  </Vhree>
</template>
```

If you omit the geometry or material props, `VMesh` falls back to a unit cube paired with `MeshBasicMaterial`, which is visible even without lights.

## Props

| Prop         | Type                                         | Default     | Notes                                                                                                                                   |
| ------------ | -------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `geometry`   | `THREE.BufferGeometry \| null`               | `null`      | When `null`, the component creates and owns a `BoxGeometry`. Custom geometries are not disposed automatically.                          |
| `material`   | `THREE.Material \| THREE.Material[] \| null` | `null`      | When `null`, the component instantiates a `MeshBasicMaterial` so the mesh is lit-free. Custom materials are not disposed automatically. |
| `position`   | `[number, number, number]`                   | `[0, 0, 0]` | Applied as `mesh.position`. Pass a new tuple to trigger updates.                                                                        |
| `rotation`   | `[number, number, number]`                   | `[0, 0, 0]` | Applied as Euler XYZ rotation in radians.                                                                                               |
| `scale`      | `[number, number, number]`                   | `[1, 1, 1]` | Applied as `mesh.scale`.                                                                                                                |
| `animations` | `AnimationSpec \| AnimationSpec[] \| null`   | `null`      | One or more animation specs resolved against the global registry.                                                                       |

## Lifecycle

- A mesh is lazily created when the provider exposes a scene.
- The mesh is removed from the scene on unmount, and any default geometry/material instances owned by `VMesh` are disposed.
- Updating `geometry` or `material` props swaps the underlying Three.js references without re-creating the mesh.

## Animations

Set the `animations` prop to a string, object, function, or array to run callbacks on the shared render loop. An animation receives `(object, state, dt, now)` where `object` is the target mesh, `state` exposes `{ t, paused }`, `dt` is the delta in seconds, and `now` is elapsed time.

```vue
<script setup lang="ts">
import { pulse } from 'vhree.js'
</script>

<template>
  <VMesh :geometry="geometry" :material="material" :animations="['spin', pulse()]" />
</template>
```

Built-in factories register automatically:

| Name     | Options                                                                                 |
| -------- | --------------------------------------------------------------------------------------- |
| `spin`   | `{ axis?: 'x' \| 'y' \| 'z'; speed?: number }`                                          |
| `rotate` | `{ x?: number; y?: number; z?: number }`                                                |
| `bounce` | `{ axis?: 'x' \| 'y' \| 'z'; amplitude?: number; frequency?: number; center?: number }` |
| `pulse`  | `{ amplitude?: number; frequency?: number; base?: number }`                             |

Provide custom behaviour by registering factories:

```ts
import { registerAnimation } from 'vhree.js'

registerAnimation('flash', (opts?: { rate?: number }) => {
  const rate = opts?.rate ?? 4
  return (mesh, state, _dt, now) => {
    if (state.paused)
      return
    const intensity = (Math.sin(now * Math.PI * rate) + 1) * 0.5
    mesh.visible = intensity > 0.2
  }
})
```

Keep callbacks lean—avoid allocations and heavy computation inside the render loop to maintain frame stability.

## Histoire Story

Variants covering default, custom resources, and animation usage live under `/stories/VMesh.story.vue`. Run `bun run story:dev` to explore the controls before shipping changes.
