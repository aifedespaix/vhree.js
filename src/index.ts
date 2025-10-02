export { bounce, pulse, rotate, spin } from './animations/builtins'
export { registerAnimation } from './animations/registry'
export type {
  Animation,
  AnimationFactory,
  AnimationSpec,
  AnimState,
} from './animations/types'

export { useAnimation } from './animations/useAnimation'

export { default as VCamera } from './components/VCamera.vue'
export { default as Vhree } from './components/Vhree.vue'
export { default as VMesh } from './components/VMesh.vue'

export { useFrame } from './composables/useFrame'
export { useVhree } from './composables/core/useVhree'
export { useRenderLoop } from './composables/core/useRenderLoop'
export { useCamera } from './composables/core/useCamera'

export { useScene } from './composables/geom/useScene'
export { useBoxGeometry } from './composables/geom/useBoxGeometry'
export { useSphereGeometry } from './composables/geom/useSphereGeometry'

export { useStandardMaterial } from './composables/mat/useStandardMaterial'

export { useDirectionalLight } from './composables/light/useDirectionalLight'

export { useOrbitControls } from './composables/controls/useOrbitControls'

export { useTexture } from './composables/load/useTexture'
export { useEnvMap } from './composables/load/useEnvMap'
export { useGLTF } from './composables/load/useGLTF'

export type { Vec3, EulerTuple, ColorLike, Disposable } from './types/common'
