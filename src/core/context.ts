import type * as THREE from 'three'
import type { InjectionKey, ShallowRef } from 'vue'
import type { RenderLoop } from './loop'

export interface CameraSetOptions {
  owner: symbol
  disposePrev?: boolean
}

export interface CameraReleaseOptions {
  owner: symbol
  camera: THREE.PerspectiveCamera
  dispose?: boolean
}

export interface VhreeContextValue {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.PerspectiveCamera | null>
  renderer: ShallowRef<THREE.WebGLRenderer | null>
  sizeEl: ShallowRef<HTMLElement | null>
  loop: RenderLoop
  registerCameraOwner: () => symbol
  setCamera: (camera: THREE.PerspectiveCamera, options: CameraSetOptions) => void
  releaseCamera: (options: CameraReleaseOptions) => void
}

export const VHREE_CTX: InjectionKey<VhreeContextValue> = Symbol('VHREE_CTX')
