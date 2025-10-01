<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as THREE from 'three'
import { Vhree, VCamera, VMesh } from '../src'

const background = ref('#0f172a')
const devicePixelRatio = ref(2)

const cameraZ = ref(3)
const cameraFov = ref(60)
const cameraLookAtZ = ref(0)

const meshColor = ref('#f97316')
const meshY = ref(0.1)

const material = new THREE.MeshStandardMaterial({ color: meshColor.value, roughness: 0.25 })
const geometry = new THREE.IcosahedronGeometry(0.6, 0)

watch(meshColor, (value) => {
  material.color.set(value)
})

const cameraPosition = computed<[number, number, number]>(() => [0, 0, cameraZ.value])
const lookAt = computed<[number, number, number]>(() => [0, 0, cameraLookAtZ.value])
</script>

<template>
  <Story title="Vhree" layout="fullscreen">
    <Variant title="Provider controls">
      <div class="story-playground">
        <header class="control-panel">
          <label>
            Background
            <input v-model="background" type="color" />
          </label>
          <label>
            DPR cap
            <input v-model.number="devicePixelRatio" type="range" min="0.5" max="3" step="0.1" />
          </label>
        </header>

        <section class="control-grid">
          <label>
            Camera Z
            <input v-model.number="cameraZ" type="range" min="1" max="6" step="0.1" />
          </label>
          <label>
            Camera FOV
            <input v-model.number="cameraFov" type="range" min="20" max="100" step="1" />
          </label>
          <label>
            Camera lookAt Z
            <input v-model.number="cameraLookAtZ" type="range" min="-1" max="1" step="0.05" />
          </label>
          <label>
            Mesh colour
            <input v-model="meshColor" type="color" />
          </label>
          <label>
            Mesh Y offset
            <input v-model.number="meshY" type="range" min="-1" max="1" step="0.05" />
          </label>
        </section>

        <div class="story-canvas">
          <Vhree :background="background" :dpr="devicePixelRatio">
            <VCamera :fov="cameraFov" :position="cameraPosition" :look-at="lookAt" />
            <VMesh :geometry="geometry" :material="material" :position="[0, meshY, 0]" />
          </Vhree>
        </div>
      </div>
    </Variant>
  </Story>
</template>

<style scoped>
.story-playground {
  position: relative;
  width: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #020617;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid #1f2937;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #e2e8f0;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  color: #e2e8f0;
}

.control-panel label,
.control-grid label {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.control-grid input[type='range'] {
  width: 100%;
}

.story-canvas {
  flex: 1;
  min-height: 320px;
  border-radius: 0.75rem;
  overflow: hidden;
}

.story-canvas :deep(canvas) {
  border-radius: 0.75rem;
}
</style>
