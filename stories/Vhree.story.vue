<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { Vhree, VMesh } from '../src'

const state = reactive({
  background: '#0f172a',
  manualDpr: 1.5,
})

const manualDpr = computed(() => Math.max(0.5, state.manualDpr))
</script>

<template>
  <Story title="Vhree" auto-props-disabled>
    <template #controls>
      <div class="control-grid">
        <HstColor v-model="state.background" title="Background" />
        <HstSlider v-model="state.manualDpr" title="Manual DPR" :min="0.5" :max="3" :step="0.1" />
      </div>
    </template>

    <Variant title="Manual DPR (passthrough)">
      <div class="story-canvas">
        <Vhree :background="state.background" :dpr="manualDpr">
          <VMesh animations="spin" />
        </Vhree>
      </div>
    </Variant>

    <Variant title="Auto cap (dpr = 0)">
      <div class="story-canvas">
        <Vhree :background="state.background" :dpr="0">
          <VMesh animations="spin" />
        </Vhree>
      </div>
      <template #description>
        Uses `Math.min(window.devicePixelRatio || 1, 2)` to keep GPU load predictable.
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
</style>
