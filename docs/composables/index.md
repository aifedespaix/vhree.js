# Composables

vhree.js exposes a typed Composition API layer mirroring the underlying Three.js objects. Each helper returns a `shallowRef` pointing at the lazily created instance plus a disposer to eagerly release GPU resources when you are done. The helpers never hide the Three.js objects from you—mutating them directly remains the recommended approach.

## Core accessors

| Hook | Description |
| ---- | ----------- |
| `useVhree()` | Inject the nearest `<Vhree>` provider. Useful when a composable needs access to the shared scene, renderer, or render loop. |
| `useRenderLoop()` | Obtain the shared render loop handle exposed by `<Vhree>`. You can subscribe via `useFrame` or call `loop.step()` manually in headless contexts. |
| `useCamera(options)` | Lazily create a `PerspectiveCamera`. When a provider is present the camera can register itself as the active camera; pass `{ active: false }` to opt out. |
| `useScene(options)` | Resolve the provider’s `THREE.Scene`. Set `createLocal: true` to spin up a standalone scene when working outside `<Vhree>`. |

## Geometry helpers

| Hook | Notes |
| ---- | ----- |
| `useBoxGeometry(options)` | Generates a parametrised `BoxGeometry`. Previous instances are disposed when options change. |
| `useSphereGeometry(options)` | Equivalent helper for `SphereGeometry` with the usual latitude/longitude controls. |

## Materials and lighting

| Hook | Notes |
| ---- | ----- |
| `useStandardMaterial(options)` | Creates a `MeshStandardMaterial` and mutates it in-place as options change. Supports colour, emissive, roughness/metalness, and texture bindings. |
| `useDirectionalLight(options)` | Instantiates a `DirectionalLight`, adds it to the active scene, and keeps transforms, intensity, and shadow settings reactive. |

## Controls

`useOrbitControls(options)` lazily imports `OrbitControls`, wiring it to the current camera and renderer. Damping and auto-rotation automatically subscribe to the shared render loop so the control updates run exactly when needed. The hook exposes the raw `OrbitControls` instance through a `shallowRef` plus an `isActive` computed flag.

```ts
import { ref } from 'vue'
import { useOrbitControls } from 'vhree.js'

const enableDamping = ref(true)
const { controls, isActive } = useOrbitControls(() => ({
  enableDamping: enableDamping.value,
  dampingFactor: 0.1,
  autoRotate: false,
}))
```

## Loader utilities

All loader helpers expose the same contract: `resource` (`texture`/`envMap`/`gltf`), `isLoading`, `error`, `reload()`, and `dispose()`. They cancel obsolete requests, dispose superseded textures or scenes, and remain SSR-safe by short-circuiting when no `window` is available.

| Hook | Highlights |
| ---- | ---------- |
| `useTexture(source, options)` | Wraps `THREE.TextureLoader`, exposes loading state, and supports colour space, filtering, mipmap, and wrapping configuration. |
| `useEnvMap(source, options)` | Loads cube or equirectangular sources, optionally processes them through `PMREMGenerator`, and reuses the renderer from context when available. |
| `useGLTF(url, options)` | Loads `.gltf`/`.glb` assets, enabling DRACO, KTX2, or Meshopt decoders on demand. Previous scenes, geometries, and materials are disposed before the new asset is exposed, and failures include the requested URL for clarity. |

Example texture binding:

```ts
import * as THREE from 'three'
import { ref, watchEffect } from 'vue'
import { useTexture } from 'vhree.js'

const source = ref('https://threejs.org/examples/textures/uv_grid_opengl.jpg')
const { texture, isLoading, error, reload } = useTexture(source, {
  colorSpace: THREE.SRGBColorSpace,
  generateMipmaps: true,
})

watchEffect(() => {
  if (error.value)
    console.error('Texture load failed', error.value)
})
```

## Types

The `src/types/common.ts` module centralises shared tuples and helper types:

- `Vec3` — `[number, number, number]` tuples used for positions, targets, and scales.
- `EulerTuple` — `[number, number, number, EulerOrder?]` tuples for rotations.
- `ColorLike` — alias to `THREE.ColorRepresentation` used across props and composables.
- `Disposable` — function signature for cleanup handlers returned by composables.

Re-exported via `vhree.js`, these types help keep application code precise without importing Three.js internals in multiple places.
