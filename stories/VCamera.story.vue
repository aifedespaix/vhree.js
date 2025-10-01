<script setup lang="ts">
import { ref, watch } from 'vue'
import * as THREE from 'three'
import { Vhree, VCamera, VMesh } from '../src'

const active = ref(true)
const fov = ref(60)
const near = ref(0.1)
const far = ref(100)
const cameraX = ref(0)
const cameraY = ref(0.4)
const cameraZ = ref(3.2)

const lookAtX = ref(0)
const lookAtY = ref(0.15)
const lookAtZ = ref(0)

const meshMaterial = new THREE.MeshStandardMaterial({ color: '#22d3ee', metalness: 0.1 })
const meshGeometry = new THREE.CapsuleGeometry(0.35, 1.1, 32, 16)

const lookAt = ref<[number, number, number]>([lookAtX.value, lookAtY.value, lookAtZ.value])

watch([lookAtX, lookAtY, lookAtZ], ([x, y, z]) => {
  lookAt.value = [x, y, z]
})
</script>

<template>
  <Story title="VCamera" layout="wide">
    <Variant title="Perspective controls">
      <div class="story-playground">
        <header class="control-panel">
          <label>
            Active
            <input v-model="active" type="checkbox" />
          </label>
          <label>
            FOV
            <input v-model.number="fov" type="range" min="20" max="100" step="1" />
          </label>
          <label>
            Near plane
            <input v-model.number="near" type="range" min="0.05" max="1" step="0.01" />
          </label>
          <label>
            Far plane
            <input v-model.number="far" type="range" min="2" max="50" step="0.5" />
          </label>
        </header>

        <section class="control-grid">
          <label>
            Cam X
            <input v-model.number="cameraX" type="range" min="-3" max="3" step="0.1" />
          </label>
          <label>
            Cam Y
            <input v-model.number="cameraY" type="range" min="-3" max="3" step="0.1" />
          </label>
          <label>
            Cam Z
            <input v-model.number="cameraZ" type="range" min="1" max="12" step="0.1" />
          </label>
          <label>
            LookAt X
            <input v-model.number="lookAtX" type="range" min="-2" max="2" step="0.05" />
          </label>
          <label>
            LookAt Y
            <input v-model.number="lookAtY" type="range" min="-2" max="2" step="0.05" />
          </label>
          <label>
            LookAt Z
            <input v-model.number="lookAtZ" type="range" min="-2" max="2" step="0.05" />
          </label>
        </section>

        <div class="story-canvas">
          <Vhree background="#0b1120">
            <VCamera
              :active="active"
              :fov="fov"
              :near="near"
              :far="far"
              :position="[cameraX, cameraY, cameraZ]"
              :look-at="lookAt"
            />
            <VMesh :geometry="meshGeometry" :material="meshMaterial" />
          </Vhree>
        </div>
      </div>
    </Variant>
  </Story>
</template>

<style scoped>
.story-playground {
  width: 100%;
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
