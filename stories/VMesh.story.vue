<script setup lang="ts">
import type { AnimationSpec } from '../src'
import * as THREE from 'three'
import { computed, defineComponent, h, inject, reactive, ref, watch } from 'vue'
import { pulse, useFrame, VCamera, Vhree, VMesh } from '../src'
import { VHREE_CTX } from '../src/core/context'

type Vec3 = [number, number, number]
type EulerTuple = [number, number, number]

// ---- State (contrôles UI) ----
const state = reactive({
  // Ressources
  useCustomResources: true,
  meshColor: '#38bdf8',
  wireframe: false,

  // Transforms
  posX: 0,
  posY: 0,
  posZ: 0.4,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  uniformScale: 1,

  // Animations toggles & params
  enableSpin: true,
  spinSpeed: 1,
  enableBounce: false,
  bounceAxis: 'y' as 'x' | 'y' | 'z',
  bounceAmplitude: 0.25,
  bounceFrequency: 1,
  enablePulse: false,
  pulseFrequency: 1.5,
  pulseAmplitude: 0.15,
})

// ---- Tuples dérivés (toujours des nombres, jamais de Ref[]) ----
const position = computed<Vec3>(() => [state.posX, state.posY, state.posZ])
const rotation = computed<EulerTuple>(() => [state.rotX, state.rotY, state.rotZ])
const scale = computed<Vec3>(() => [state.uniformScale, state.uniformScale, state.uniformScale])

// ---- Animations (résolues par le Mesh via props.animations) ----
const animations = computed<AnimationSpec[]>(() => {
  const list: AnimationSpec[] = []
  if (state.enableSpin) {
    list.push({ name: 'spin', options: { axis: 'y', speed: state.spinSpeed } })
  }
  if (state.enableBounce) {
    list.push({
      name: 'bounce',
      options: {
        axis: state.bounceAxis,
        amplitude: state.bounceAmplitude,
        frequency: state.bounceFrequency,
      },
    })
  }
  if (state.enablePulse) {
    list.push(pulse({ frequency: state.pulseFrequency, amplitude: state.pulseAmplitude }))
  }
  return list
})

// ---- Ressources custom (créées une seule fois) ----
const geometry = new THREE.TorusKnotGeometry(0.45, 0.16, 128, 24)
const material = new THREE.MeshBasicMaterial({ color: state.meshColor, wireframe: state.wireframe })

// Watchers “cheap” (aucune alloc per-frame)
watch(() => state.meshColor, v => material.color.set(v))
watch(() => state.wireframe, v => (material.wireframe = v))

const showLifecycleMesh = ref(true)
const lifecycleToggleCount = ref(0)

const toggleLifecycleMesh = () => {
  showLifecycleMesh.value = !showLifecycleMesh.value
  if (!showLifecycleMesh.value)
    lifecycleToggleCount.value += 1
}

const MemoryStats = defineComponent({
  name: 'VMeshLifecycleStats',
  setup() {
    const ctx = inject(VHREE_CTX, null)
    const geometryCount = ref(0)
    const materialCount = ref(0)

    if (ctx) {
      useFrame(() => {
        const renderer = ctx.renderer.value
        geometryCount.value = renderer?.info.memory.geometries ?? 0
        materialCount.value = renderer?.info.memory.materials ?? 0
      })
    }

    return () =>
      h('div', { class: 'lifecycle-stats' }, [
        h('span', `Geometries: ${geometryCount.value}`),
        h('span', `Materials: ${materialCount.value}`),
      ])
  },
})
</script>

<template>
  <Story title="VMesh" auto-props-disabled>
    <!-- Panneau de contrôles global (comme VCamera story) -->
    <template #controls>
      <div class="control-grid">
        <HstCheckbox v-model="state.useCustomResources" title="Use custom geometry & material" />
        <HstColor v-model="state.meshColor" title="Mesh color" />
        <HstCheckbox v-model="state.wireframe" title="Wireframe" />

        <HstSlider v-model="state.posX" title="Position X" :min="-1.5" :max="1.5" :step="0.05" />
        <HstSlider v-model="state.posY" title="Position Y" :min="-1.5" :max="1.5" :step="0.05" />
        <HstSlider v-model="state.posZ" title="Position Z" :min="-1.5" :max="1.5" :step="0.05" />

        <HstSlider v-model="state.rotX" title="Rotation X (rad)" :min="-3.141" :max="3.141" :step="0.05" />
        <HstSlider v-model="state.rotY" title="Rotation Y (rad)" :min="-3.141" :max="3.141" :step="0.05" />
        <HstSlider v-model="state.rotZ" title="Rotation Z (rad)" :min="-3.141" :max="3.141" :step="0.05" />

        <HstSlider v-model="state.uniformScale" title="Uniform scale" :min="0.2" :max="2" :step="0.05" />

        <HstCheckbox v-model="state.enableSpin" title="Spin" />
        <HstSlider
          v-model="state.spinSpeed"
          title="Spin speed"
          :min="-6"
          :max="6"
          :step="0.1"
          :disabled="!state.enableSpin"
        />

        <HstCheckbox v-model="state.enableBounce" title="Bounce" />
        <HstSelect
          v-model="state.bounceAxis"
          title="Bounce axis"
          :options="[{ label: 'X', value: 'x' }, { label: 'Y', value: 'y' }, { label: 'Z', value: 'z' }]"
          :disabled="!state.enableBounce"
        />
        <HstSlider
          v-model="state.bounceAmplitude"
          title="Bounce amplitude"
          :min="0" :max="1" :step="0.05"
          :disabled="!state.enableBounce"
        />
        <HstSlider
          v-model="state.bounceFrequency"
          title="Bounce frequency"
          :min="0.5" :max="3" :step="0.05"
          :disabled="!state.enableBounce"
        />

        <HstCheckbox v-model="state.enablePulse" title="Pulse" />
        <HstSlider
          v-model="state.pulseFrequency"
          title="Pulse frequency"
          :min="0.5" :max="4" :step="0.1"
          :disabled="!state.enablePulse"
        />
        <HstSlider
          v-model="state.pulseAmplitude"
          title="Pulse amplitude"
          :min="0" :max="0.5" :step="0.01"
          :disabled="!state.enablePulse"
        />
      </div>
    </template>

    <!-- Variante interactive (utilise l'UI ci-dessus) -->
    <Variant title="Interactive">
      <div class="story-canvas">
        <Vhree background="#0b1120" :dpr="2.5">
          <VCamera :position="[0, 0, 4]" :look-at="[0, 0, 0]" />
          <VMesh
            :geometry="state.useCustomResources ? geometry : null"
            :material="state.useCustomResources ? material : null"
            :position="position"
            :rotation="rotation"
            :scale="scale"
            :animations="animations"
          />
        </Vhree>
      </div>
    </Variant>

    <!-- Variante baseline (snapshot) -->
    <Variant title="Defaults — snapshot">
      <div class="story-canvas">
        <Vhree background="#020617" :dpr="2">
          <VCamera :position="[0, 0, 3.2]" :look-at="[0, 0, 0]" />
          <VMesh />
        </Vhree>
      </div>
    </Variant>

    <Variant title="Lifecycle — fallback cleanup">
      <div class="lifecycle-section">
        <div class="lifecycle-controls">
          <HstButton class="lifecycle-button" @click="toggleLifecycleMesh">
            {{ showLifecycleMesh ? 'Unmount fallback mesh' : 'Mount fallback mesh' }}
          </HstButton>
          <p class="lifecycle-caption">
            Unmounts triggered: {{ lifecycleToggleCount }}. The counters below mirror
            <code>renderer.info.memory</code> and return to zero when the fallback mesh is removed.
          </p>
        </div>
        <div class="story-canvas">
          <Vhree background="#020617" :dpr="2">
            <VCamera :position="[0, 0, 3.2]" :look-at="[0, 0, 0]" />
            <VMesh v-if="showLifecycleMesh" />
            <MemoryStats />
          </Vhree>
        </div>
      </div>
    </Variant>
  </Story>
</template>

<style scoped>
.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  color: #e2e8f0;
}

.story-canvas {
  flex: 1;
  min-height: 320px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #020617;
  border: 1px solid #1f2937;
  position: relative;
}

.story-canvas :deep(canvas) {
  border-radius: 0.75rem;
}

.lifecycle-section {
  display: grid;
  gap: 1.25rem;
}

.lifecycle-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #e2e8f0;
}

.lifecycle-button {
  width: fit-content;
}

.lifecycle-caption {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.lifecycle-stats {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.88);
  color: #f8fafc;
  font-size: 0.75rem;
  pointer-events: none;
  backdrop-filter: blur(6px);
}
</style>
