<script setup lang="ts">
import { computed, reactive } from 'vue'
import { VCamera, Vhree, VMesh } from '../src'

type Vec3 = [number, number, number]

const state = reactive({
  // Camera toggles & frustum
  active: true,
  fov: 60, // 10–120 conseillé
  near: 0.1,
  far: 100,

  // Camera position
  cameraX: 0,
  cameraY: 0.4,
  cameraZ: 3.2,

  // Look-at target
  lookAtX: 0,
  lookAtY: 0.15,
  lookAtZ: 0,
})

// Derived tuples (toujours des nombres, jamais de Ref[])
const position = computed<Vec3>(() => [state.cameraX, state.cameraY, state.cameraZ])
const lookAt = computed<Vec3>(() => [state.lookAtX, state.lookAtY, state.lookAtZ])
</script>

<template>
  <Story title="VCamera" auto-props-disabled>
    <!-- Panneau de contrôles typé -->
    <template #controls>
      <div class="control-grid">
        <HstCheckbox v-model="state.active" title="Active" />

        <HstSlider v-model="state.fov" title="FOV" :min="10" :max="120" :step="1" />
        <HstNumber v-model="state.near" title="Near" :min="0.001" :step="0.001" />
        <HstNumber v-model="state.far" title="Far" :min="1" :step="1" />

        <HstNumber v-model="state.cameraX" title="Camera X" :step="0.1" />
        <HstNumber v-model="state.cameraY" title="Camera Y" :step="0.1" />
        <HstNumber v-model="state.cameraZ" title="Camera Z" :step="0.1" />

        <HstNumber v-model="state.lookAtX" title="LookAt X" :step="0.01" />
        <HstNumber v-model="state.lookAtY" title="LookAt Y" :step="0.01" />
        <HstNumber v-model="state.lookAtZ" title="LookAt Z" :step="0.01" />
      </div>
    </template>

    <!-- Variante interactive par défaut -->
    <Variant title="Perspective — interactive">
      <div class="story-canvas">
        <Vhree background="#0b1120">
          <VCamera
            :active="state.active" :fov="state.fov" :near="state.near" :far="state.far" :position="position"
            :look-at="lookAt"
          />
          <VMesh />
        </Vhree>
      </div>
    </Variant>

    <!-- Variante baseline (pratique pour visuels de régression) -->
    <Variant title="Defaults — snapshot">
      <div class="story-canvas">
        <Vhree background="#0b1120">
          <VCamera />
          <VMesh />
        </Vhree>
      </div>
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

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  color: #e2e8f0;
}

.story-canvas :deep(canvas) {
  border-radius: 0.75rem;
}
</style>
