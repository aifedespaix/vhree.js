export { default as Vhree } from './components/Vhree.vue'
export { default as VMesh } from './components/VMesh.vue'
export { default as VCamera } from './components/VCamera.vue'

export { useFrame } from './composables/useFrame'

export { useAnimation } from './animations/useAnimation'
export { registerAnimation } from './animations/registry'
export { spin, rotate, bounce, pulse } from './animations/builtins'

export type {
  AnimState,
  Animation,
  AnimationFactory,
  AnimationSpec
} from './animations/types'
