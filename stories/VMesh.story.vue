<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as THREE from 'three'
import { Vhree, VCamera, VMesh, pulse } from '../src'
import type { AnimationSpec } from '../src'

const useCustomResources = ref(true)
const meshColor = ref('#38bdf8')
const wireframe = ref(false)

const posX = ref(0)
const posY = ref(0)
const posZ = ref(0.4)
const rotX = ref(0)
const rotY = ref(0)
const rotZ = ref(0)
const uniformScale = ref(1)
const enableSpin = ref(true)
const spinSpeed = ref(1)
const enableBounce = ref(false)
const bounceAxis = ref<'x' | 'y' | 'z'>('y')
const bounceAmplitude = ref(0.25)
const bounceFrequency = ref(1)
const enablePulse = ref(false)
const pulseFrequency = ref(1.5)
const pulseAmplitude = ref(0.15)

const animations = computed(() => {
  const list: AnimationSpec[] = []

  if (enableSpin.value) {
    list.push({ name: 'spin', options: { axis: 'y', speed: spinSpeed.value } })
  }

  if (enableBounce.value) {
    list.push({
      name: 'bounce',
      options: {
        axis: bounceAxis.value,
        amplitude: bounceAmplitude.value,
        frequency: bounceFrequency.value
      }
    })
  }

  if (enablePulse.value) {
    list.push(pulse({ frequency: pulseFrequency.value, amplitude: pulseAmplitude.value }))
  }

  return list
})

const position = computed(() => [posX.value, posY.value, posZ.value] as [number, number, number])
const rotation = computed(() => [rotX.value, rotY.value, rotZ.value] as [number, number, number])
const scale = computed(() => [uniformScale.value, uniformScale.value, uniformScale.value] as [number, number, number])

const geometry = new THREE.TorusKnotGeometry(0.45, 0.16, 128, 24)
const material = new THREE.MeshBasicMaterial({ color: meshColor.value, wireframe: wireframe.value })

watch(meshColor, (value) => {
  material.color.set(value)
})

watch(wireframe, (value) => {
  material.wireframe = value
})
</script>

<template>
  <Story title="VMesh" layout="fullscreen">
    <Variant title="Defaults">
      <div class="story-playground">
        <p class="story-note">
          Default geometry (cube) and `MeshBasicMaterial` keep the mesh visible even with lights disabled.
        </p>
        <div class="story-canvas">
          <Vhree background="#020617" :dpr="2">
            <VCamera :position="[0, 0, 3.2]" :look-at="[0, 0, 0]" />
            <VMesh />
          </Vhree>
        </div>
      </div>
    </Variant>

    <Variant title="Custom resources">
      <div class="story-playground">
        <header class="control-panel">
          <label>
            Use custom geometry & material
            <input v-model="useCustomResources" type="checkbox" />
          </label>
          <label>
            Mesh colour
            <input v-model="meshColor" type="color" />
          </label>
          <label>
            Wireframe
            <input v-model="wireframe" type="checkbox" />
          </label>
        </header>

        <section class="control-grid">
          <label>
            Position X
            <input v-model.number="posX" type="range" min="-1.5" max="1.5" step="0.05" />
          </label>
          <label>
            Position Y
            <input v-model.number="posY" type="range" min="-1.5" max="1.5" step="0.05" />
          </label>
          <label>
            Position Z
            <input v-model.number="posZ" type="range" min="-1.5" max="1.5" step="0.05" />
          </label>
          <label>
            Rotation X
            <input v-model.number="rotX" type="range" min="-3.141" max="3.141" step="0.05" />
          </label>
          <label>
            Rotation Y
            <input v-model.number="rotY" type="range" min="-3.141" max="3.141" step="0.05" />
          </label>
          <label>
            Rotation Z
            <input v-model.number="rotZ" type="range" min="-3.141" max="3.141" step="0.05" />
          </label>
          <label>
            Uniform scale
            <input v-model.number="uniformScale" type="range" min="0.2" max="2" step="0.05" />
          </label>
        </section>

        <div class="story-canvas">
          <Vhree background="#0b1120" :dpr="2.5">
            <VCamera :position="[0, 0, 4]" :look-at="[0, 0, 0]" />
            <VMesh
              :geometry="useCustomResources ? geometry : null"
              :material="useCustomResources ? material : null"
              :position="position"
              :rotation="rotation"
              :scale="scale"
            />
          </Vhree>
        </div>
      </div>
    </Variant>

    <Variant title="Animations">
      <div class="story-playground">
        <p class="story-note">
          Toggle built-in animations and tweak their options. Callbacks run inside the shared render loop.
        </p>

        <header class="control-panel">
          <label>
            Spin
            <input v-model="enableSpin" type="checkbox" />
          </label>
          <label>
            Bounce
            <input v-model="enableBounce" type="checkbox" />
          </label>
          <label>
            Pulse
            <input v-model="enablePulse" type="checkbox" />
          </label>
        </header>

        <section class="control-grid">
          <label>
            Spin speed
            <input
              v-model.number="spinSpeed"
              type="range"
              min="-6"
              max="6"
              step="0.1"
              :disabled="!enableSpin"
            />
          </label>
          <label>
            Bounce axis
            <select v-model="bounceAxis" :disabled="!enableBounce">
              <option value="x">X</option>
              <option value="y">Y</option>
              <option value="z">Z</option>
            </select>
          </label>
          <label>
            Bounce amplitude
            <input
              v-model.number="bounceAmplitude"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :disabled="!enableBounce"
            />
          </label>
          <label>
            Bounce frequency
            <input
              v-model.number="bounceFrequency"
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              :disabled="!enableBounce"
            />
          </label>
          <label>
            Pulse frequency
            <input
              v-model.number="pulseFrequency"
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              :disabled="!enablePulse"
            />
          </label>
          <label>
            Pulse amplitude
            <input
              v-model.number="pulseAmplitude"
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              :disabled="!enablePulse"
            />
          </label>
        </section>

        <div class="story-canvas">
          <Vhree background="#0f172a" :dpr="2">
            <VCamera :position="[0, 0, 4]" :look-at="[0, 0, 0]" />
            <VMesh :geometry="geometry" :material="material" :animations="animations" />
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

.story-note {
  margin: 0;
  font-size: 0.875rem;
  color: #cbd5f5;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
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
