# AGENTS.md — Vhree.js (Vue 3 + Three.js)

> A minimal, explicit, SSR-friendly Vue 3 layer over Three.js. TS-first, zero-magic, opt-in features.  
> Component prefix (target): **`VX`** (e.g., `VXCanvas`, `VXMesh`). Current code ships prototype components named `Vhree` (canvas), `VCamera`, and `VMesh` until the VX suite is ready.

## 0) Core Principles

1. **Keep Three explicit**  
   Expose real Three primitives (Scene, Camera, Mesh, Materials). Minimal “sugar”; easy escape hatch to raw Three.

2. **Vue idioms, not gymnastics**  
   Composition API, `provide/inject` for context, **composables** for logic, **components** for structure. Do not over-reactify Three objects.

3. **SSR-friendly by design**  
   No DOM/WebGL at module scope; side effects only in `onMounted`. Guard browser-only code.

4. **Type safety is API safety**  
   Narrow TS types for props/slots/emits. Ship `.d.ts` for everything. JSDoc on public items.

5. **Dispose everything**  
   GPU/DOM resources must be disposed on unmount or when replaced.

6. **Performance is opt-in**  
   Defaults favor clarity; provide knobs (DPR cap, invalidate-on-demand, instancing helpers).

7. **Minimal surface**  
   Ship a small set of primitives well; advanced features are opt-in.

8. **Use VueUse when helpful**  
   Prefer **VueUse** utilities for timers, RAF, resize, events, debouncing/throttling, window.xxxx, etc. (e.g. `useRafFn`, `useResizeObserver`, `useEventListener`, `useIntervalFn`, `useTimeoutFn`, `useElementSize`).

---

## 1) Repository Structure

```
/src
  /core        # loop, injection, disposables, helpers (only what VueUse doesn’t cover)
  /composables # useVhree, useScene, useCamera, useFrame, useRaycaster (opt)
  /components  # Vhree (current placeholder), VCamera (prototype), VMesh (prototype), VXCanvas, VXPerspectiveCamera, VXMesh, VXOrbitControls
  /types       # public types
  index.ts     # public exports (components + composables + types)
/docs          # VitePress site (guides + API reference)
/stories       # Histoire stories (component/composable showcases)
histoire.config.ts
README.md
AGENTS.md
```

**Rule:** internal utilities live in `/core` and are **not** exported. Public API goes through `src/index.ts` only; anything user-facing must be re-exported there.

---

## 2) Public API Design

### 2.1 Components (prefix `VX`)

- **`<VXCanvas>`** – provider  
  Creates renderer, scene, (optional) default camera, a RAF loop, and resize handling.
  - Props:
    - `background?: ColorRepresentation`
    - `dpr?: number` (default `Math.min(2, devicePixelRatio||1)`)
    - `cameraZ?: number` (if default camera is created)
    - `renderMode?: 'always' | 'invalidate'` (default `'always'`)
  - Uses **VueUse**: `useResizeObserver` for responsive sizing, `useRafFn` if appropriate.
  - Effects only in `onMounted`; full cleanup in `onUnmounted`.

- **`<VXPerspectiveCamera>`**  
  Installs a `PerspectiveCamera` into context; replaces default if present.
  - Props: `{ fov?: number; near?: number; far?: number; position?: [x,y,z]; lookAt?: [x,y,z] }`
  - On container resize, update `aspect` + `updateProjectionMatrix()`.

- **`<VXMesh>`**  
  Declarative `THREE.Mesh` mount/unmount.
  - Props: `{ geometry: BufferGeometry; material: Material|Material[]; position?: [x,y,z]; rotation?: [x,y,z]; scale?: [x,y,z] }`
  - Watch transforms with minimal churn; dispose geometry/material(s) on unmount or replacement.

- **`<VXOrbitControls>`**  
  Attaches OrbitControls to current camera/renderer.
  - Props (minimal): `enableDamping?: boolean`, `dampingFactor?: number`, etc.
  - If damping is enabled, ensure `controls.update()` is tied to the loop.

> Design: keep components small & predictable; push complex logic to composables.

> Prototype mapping (current code): `Vhree` ~ `VXCanvas`, `VCamera` ~ `VXPerspectiveCamera`, `VMesh` ~ `VXMesh`.

### 2.2 Composables

- **`useVhree()`** → `{ scene, camera, renderer, loop }` via inject.
- **`useScene()`** → ensure/get Scene in context (create if missing).
- **`useCamera(fov?: number)`** → get/set camera ref (create if missing).
- **`useFrame(cb)`** → subscribe to RAF loop; returns disposer.
- **`useRaycaster(options)`** (opt-in) → stable Raycaster, pointer NDC computation; one instance reused.
- **VueUse integration:** leverage `useRafFn` for render loops (when not conflicting with our central loop), `useResizeObserver` for sizes, `useEventListener` for pointer events, `useDebounceFn` / `useThrottleFn` where relevant.

**Consistency rules**

- Composables return **Refs** and **disposers**.
- Props accept **tuple primitives** for vectors (SSR friendly).
- Naming: `VX*` for components (with `Vhree` as the current stop-gap), `use*` for composables, `VHREE_CTX` for injection key.

---

## 3) Vue Best Practices

1. **No DOM at module scope**; guard with `onMounted` and `typeof window !== 'undefined'`.
2. **Reactive boundaries**: don’t make Three objects reactive; mutate them inside watchers/frames.
3. **Cleanup**: centralized helpers.
4. **Typed props + runtime guards** (DEV-only warnings for foot-guns).
5. **Slots over hidden wiring**: compose via slots; avoid tight implicit coupling.
6. **Use VueUse** instead of hand-rolled hooks for timers, raf, resize, events, etc.
7. **High-frequency updates**: use `useFrame` instead of reactivity for animation.

---

## 4) Three.js Best Practices

1. **Allocate once, reuse** (geometries, materials, textures).
2. **Dispose on replacement/unmount**; remove from scene before disposal.
3. **Color spaces**: set `renderer.outputColorSpace = SRGBColorSpace` (Three r152+); ensure textures use correct `encoding`.
4. **Renderer**: antialias default on; cap DPR; `setSize(w,h,false)` on resize.
5. **Controls**: enable damping sensibly; call `update()` in loop; dispose on unmount.
6. **Raycasting**: reuse a single `Raycaster`; maintain a registry of interactive objects to reduce test set size.
7. **Animation loop**: one central loop in `VXCanvas`; `useFrame` to subscribe; optionally support invalidate-only mode.

---

## 5) Performance Playbook

- **DPR cap**: default `Math.min(2, devicePixelRatio||1)`, expose prop.
- **Invalidate-only**: if scene is static and controls have no damping, render on demand.
- **Instancing**: provide (later) `VInstancedMesh` or docs for native `InstancedMesh`.
- **Raycaster**: centralize listeners with `useEventListener`; reuse vectors; no per-frame allocations.
- **Textures**: prefer POT or accept WebGL2; set `generateMipmaps` appropriately.
- **Avoid GC churn**: reuse `Vector3/Euler` objects; don’t allocate in RAF.
- **Transforms**: set directly; batch updates on prop changes when possible.

---

## 6) Maintainability & Readability

- **Small, single-responsibility files** (<200 LOC by default). Extract shared logic into composables.
- **Consistent naming**: `V*` components, `use*` composables, `VHREE_CTX` key, `dispose*` helpers.
- **JSDoc** on all public APIs: what/when/how + perf caveats.
- **Dev-only warnings**: `import.meta.env.DEV` to hint misuses; no prod bloat.
- **Public vs internal**: export only stable APIs from `src/index.ts`; mark internals `/** @internal */`.
- **Histoire coverage**: ensure each public component/composable has an up-to-date story variant demonstrating core usage and recent changes.
- **Camera contract**: keep `Vhree`’s `setCamera`/`releaseCamera` behaviour in sync with `VCamera` expectations (resize sync, fallback restoration, DEV warnings).

---

## 7) Error Handling & DX

- **Fail fast, clear messages** (e.g., missing provider).
- **Graceful no-WebGL**: renderer creation failure → concise error and abort; leave context consistent.
- **Invariant checks**: for common pitfalls (e.g., controls without camera), include remediation in message.

---

## 8) SSR & Nuxt Notes

- **Side-effect-free imports**: no `window`/DOM at top level.
- **Guards**: `const isClient = typeof window !== 'undefined'`
- **Nuxt module (later)**: optional `@vhree/nuxt` to auto-import and enforce SSR guards; keep core lean.

---

## 9) Documentation Policy (README is the source of truth)

Every new feature **must** update the README, the VitePress docs under `docs/`, **and** the Histoire catalogue (`/stories`):

1. **Components list** (with `V*` names)
2. **Composables list** (`use*`)
3. **VueUse usage** mention if relevant
4. **Changelog snippet** for new APIs
5. **Troubleshooting** additions if needed
6. **VitePress API page** entry covering props, emits, and usage; mirror README highlights where relevant
7. **Histoire story** showcasing usage (components via `.story.vue`, composables via `.story.ts`); keep controls/examples current with the latest API

Modifying an existing component/composable follows the same checklist: update README, VitePress, and the matching Histoire story so the surface stays in lockstep.

---

## 10) Parity vs Other Libraries

- **Similarities**: Conceptually adjacent to **TresJS** (Vue+Three) and **React Three Fiber**: declarative scene, shared render loop, small hooks.
- **Differences**: Thinner API, explicit lifecycles, VueUse-first for utilities, stricter README-as-truth doc policy.
- **Quality**: predictable, typed, SSR-safe, lean.

---

## 11) PR Checklist

- [ ] SSR-safe: no DOM/WebGL at module scope.
- [ ] Proper disposal on unmount and on resource replacement.
- [ ] Props: narrow TS types, sensible defaults, DEV warnings.
- [ ] High-frequency work via `useFrame` (no reactive churn).
- [ ] No per-frame allocations; reuse vectors/materials.
- [ ] **README updated**: new components/composables documented.
- [ ] **Docs updated**: VitePress pages sectioned by components/composables kept in sync.
- [ ] **Histoire updated**: story variants added or refreshed under `/stories`; run `bun run story:dev` locally to verify.
- [ ] **Exports audited**: new public symbols re-exported from `src/index.ts`.
- [ ] `bun run build` outputs ESM, CJS, `.d.ts`, sourcemaps.
- [ ] Public exports only via `src/index.ts`.

---
