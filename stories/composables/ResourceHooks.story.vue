<script lang="ts" setup>
import * as THREE from 'three'
import { computed, reactive, watchEffect } from 'vue'
import { VCamera, VMesh, Vhree, useBoxGeometry, useDirectionalLight, useEnvMap, useGLTF, useOrbitControls, useScene, useStandardMaterial, useTexture } from '../../src'

const SAMPLE_GLTF_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Triangle/glTF/Triangle.gltf'
const BROKEN_GLTF_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/NonExistent/glTF/model.gltf'
const SAMPLE_TEXTURE_URL = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
const SAMPLE_ENV_URL = 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr'

const state = reactive({
  textureSource: SAMPLE_TEXTURE_URL,
  envSource: SAMPLE_ENV_URL,
  gltfSource: SAMPLE_GLTF_URL,
  baseColor: '#f97316',
  lightColor: '#facc15',
  lightIntensity: 1.6,
  lightX: 2,
  lightY: 3,
  lightZ: 4,
  boxWidth: 1.2,
  boxHeight: 0.8,
  boxDepth: 1.2,
  autoRotate: true,
})

const textureSource = computed(() => state.textureSource)
const envSource = computed(() => state.envSource)
const gltfSource = computed(() => state.gltfSource)

const { texture, isLoading: textureLoading, error: textureError, reload: reloadTexture } = useTexture(textureSource, {
  colorSpace: THREE.SRGBColorSpace,
  minFilter: THREE.LinearMipmapLinearFilter,
  magFilter: THREE.LinearFilter,
  generateMipmaps: true,
})

const { envMap, isLoading: envLoading, error: envError, reload: reloadEnv } = useEnvMap(envSource, {
  colorSpace: THREE.SRGBColorSpace,
  usePmrem: true,
})

const { geometry } = useBoxGeometry(() => ({
  width: state.boxWidth,
  height: state.boxHeight,
  depth: state.boxDepth,
}))

const { material } = useStandardMaterial(() => ({
  color: state.baseColor,
  map: texture.value,
  envMap: envMap.value,
  metalness: 0.2,
  roughness: 0.45,
}))

const meshGeometry = computed(() => geometry.value ?? undefined)
const meshMaterial = computed(() => material.value ?? undefined)

const { light } = useDirectionalLight(() => ({
  color: state.lightColor,
  intensity: state.lightIntensity,
  position: [state.lightX, state.lightY, state.lightZ] as const,
}))

watchEffect(() => {
  if (!light.value)
    return
  light.value.castShadow = true
})

const { controls } = useOrbitControls(() => ({
  enableDamping: true,
  dampingFactor: 0.12,
  autoRotate: state.autoRotate,
  autoRotateSpeed: 1.2,
  target: [0, 0, 0] as const,
}))

watchEffect(() => {
  controls.value
})

const { gltf, isLoading: gltfLoading, error: gltfError, reload: reloadGltf } = useGLTF(gltfSource)
const { scene } = useScene()

watchEffect((onCleanup) => {
  const targetScene = scene.value
  const model = gltf.value?.scene ?? null
  if (!targetScene || !model)
    return

  model.position.set(0, -0.1, 0)
  targetScene.add(model)

  onCleanup(() => {
    targetScene.remove(model)
  })
})
</script>

<template>
  <Story title="Resource composables" auto-props-disabled>
    <template #controls>
      <div class="control-grid">
        <HstColor v-model="state.baseColor" title="Base colour" />
        <HstColor v-model="state.lightColor" title="Light colour" />
        <HstSlider v-model="state.lightIntensity" title="Light intensity" :min="0" :max="5" :step="0.1" />
        <HstSlider v-model="state.boxWidth" title="Box width" :min="0.2" :max="2" :step="0.1" />
        <HstSlider v-model="state.boxHeight" title="Box height" :min="0.2" :max="2" :step="0.1" />
        <HstSlider v-model="state.boxDepth" title="Box depth" :min="0.2" :max="2" :step="0.1" />
        <HstToggle v-model="state.autoRotate" title="Orbit auto rotate" />
        <div class="control-row">
          <HstButton @click="reloadTexture">Reload texture</HstButton>
          <small v-if="textureLoading">Loading…</small>
          <small v-else-if="textureError" class="error">Failed</small>
        </div>
        <HstInput v-model="state.textureSource" title="Texture URL" placeholder="https://…" />
        <div class="control-row">
          <HstButton @click="state.textureSource = SAMPLE_TEXTURE_URL">Use sample texture</HstButton>
        </div>
        <div class="control-row">
          <HstButton @click="reloadEnv">Reload env map</HstButton>
          <small v-if="envLoading">Loading…</small>
          <small v-else-if="envError" class="error">Failed</small>
        </div>
        <HstInput v-model="state.envSource" title="Env map URL" placeholder="https://…" />
        <div class="control-row">
          <HstButton @click="state.envSource = SAMPLE_ENV_URL">Use sample env map</HstButton>
        </div>
        <div class="control-row">
          <HstButton @click="reloadGltf">Reload GLTF</HstButton>
          <small v-if="gltfLoading">Loading…</small>
          <small v-else-if="gltfError" class="error">{{ gltfError.message }}</small>
        </div>
        <HstInput v-model="state.gltfSource" title="GLTF URL" placeholder="https://…" />
        <div class="control-row">
          <HstButton @click="state.gltfSource = SAMPLE_GLTF_URL">Use sample GLTF</HstButton>
          <HstButton @click="state.gltfSource = BROKEN_GLTF_URL">Load missing GLTF</HstButton>
        </div>
      </div>
    </template>

    <Variant title="Textured box">
      <div class="story-canvas">
        <Vhree :background="'#0f172a'">
          <VCamera :position="[0, 0.8, 3.2]" :look-at="[0, 0, 0]" />
          <VMesh :geometry="meshGeometry" :material="meshMaterial" />
        </Vhree>
      </div>
      <template #description>
        `useTexture`, `useEnvMap`, `useBoxGeometry`, and `useStandardMaterial` build a textured mesh while `useDirectionalLight` and `useOrbitControls` keep lighting and interaction in sync.
      </template>
    </Variant>

    <Variant title="GLTF injection">
      <div class="story-canvas">
        <Vhree :background="'#0b1120'">
          <VCamera :position="[0, 0.6, 2.2]" :look-at="[0, 0, 0]" />
        </Vhree>
      </div>
      <template #description>
        The triangle GLTF is fetched from the Khronos sample repository with `useGLTF` and attached to the shared scene with `useScene`.
        Try the controls to point the loader at an invalid URL and inspect the surfaced error message.
      </template>
    </Variant>
  </Story>
</template>

<style scoped>
.story-canvas {
  flex: 1;
  min-height: 320px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #020617;
  border: 1px solid #1f2937;
}

.story-canvas :deep(canvas) {
  border-radius: 0.75rem;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  color: #e2e8f0;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error {
  color: #f87171;
}
</style>
