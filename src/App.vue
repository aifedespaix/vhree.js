<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as THREE from 'three'
import { Vhree, VCamera, VMesh } from './index'

const background = ref('#0f172a')
const devicePixelRatio = ref(2)

const cameraFov = ref(60)
const cameraZ = ref(3)
const cameraZLabel = computed(() => cameraZ.value.toFixed(1))
const lookAtZ = ref(0)

const meshColor = ref('#f97316')
const meshZ = ref(0.45)
const meshMaterial = new THREE.MeshStandardMaterial({ color: meshColor.value, roughness: 0.25 })
const meshGeometry = new THREE.OctahedronGeometry(0.6)

watch(meshColor, (value) => {
  meshMaterial.color.set(value)
})

const cameraPosition = computed<[number, number, number]>(() => [0, 0, cameraZ.value])
const cameraLookAt = computed<[number, number, number]>(() => [0, 0, lookAtZ.value])
const meshPosition = computed<[number, number, number]>(() => [0, 0, meshZ.value])
</script>

<template>
  <main class="app">
    <section class="preview">
      <Vhree :background="background" :dpr="devicePixelRatio">
        <VCamera :fov="cameraFov" :position="cameraPosition" :look-at="cameraLookAt" />
        <VMesh :geometry="meshGeometry" :material="meshMaterial" :position="meshPosition" />
      </Vhree>
    </section>
    <section class="controls">
      <h1>Vhree playground</h1>
      <p>
        Ajuste les paramètres du canvas, de la caméra ou du mesh pour valider le comportement de la
        librairie sans quitter ce repo.
      </p>
      <label class="control">
        <span>Couleur de fond</span>
        <input v-model="background" type="color" />
      </label>
      <label class="control">
        <span>DPR max : {{ devicePixelRatio.toFixed(2) }}</span>
        <input v-model.number="devicePixelRatio" type="range" min="0.5" max="3" step="0.05" />
      </label>
      <label class="control">
        <span>Caméra — FOV : {{ cameraFov }}°</span>
        <input v-model.number="cameraFov" type="range" min="20" max="100" step="1" />
      </label>
      <label class="control">
        <span>Caméra — position Z : {{ cameraZLabel }}</span>
        <input v-model.number="cameraZ" type="range" min="1" max="6" step="0.1" />
      </label>
      <label class="control">
        <span>Caméra — lookAt Z : {{ lookAtZ.toFixed(2) }}</span>
        <input v-model.number="lookAtZ" type="range" min="-1" max="1" step="0.05" />
      </label>
      <label class="control">
        <span>Couleur du mesh</span>
        <input v-model="meshColor" type="color" />
      </label>
      <label class="control">
        <span>Décalage Z du mesh : {{ meshZ.toFixed(2) }}</span>
        <input v-model.number="meshZ" type="range" min="-1" max="1" step="0.05" />
      </label>
    </section>
  </main>
</template>

<style scoped>
.app {
  display: grid;
  align-items: stretch;
  gap: 2rem;
  padding: 3rem clamp(1.5rem, 5vw, 4rem);
  min-height: 100vh;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.preview {
  background: #02061780;
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid #1f2937;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #e2e8f0;
}

.controls h1 {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  margin: 0;
}

.controls p {
  margin: 0;
  line-height: 1.6;
  color: #cbd5f5;
}

.control {
  display: grid;
  gap: 0.5rem;
  font-weight: 500;
}

.control input[type='color'] {
  width: 100%;
  appearance: none;
  border: none;
  padding: 0;
  height: 3rem;
  border-radius: 0.75rem;
  cursor: pointer;
  background: transparent;
}

.control input[type='range'] {
  width: 100%;
}

@media (max-width: 960px) {
  .app {
    grid-template-columns: 1fr;
    padding-block: 2rem;
  }

  .preview {
    min-height: 320px;
  }
}
</style>
