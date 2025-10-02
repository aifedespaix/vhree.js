<script lang="ts" setup>
import { ref } from 'vue';
import Vhree from '../src/components/Vhree.vue';
import VMesh from '../src/components/VMesh.vue';

const background = ref('#0f172a')
const devicePixelRatio = ref(1)
</script>

<template>
    <Story title="Vhree" order="1" class="story-playground">
        <Vhree :background="background" :devicePixelRatio="devicePixelRatio">
            <VMesh animations="spin" />
        </Vhree>
    </Story>
</template>

<style scoped>
.story-playground {
    width: 100%;
    height: 400px;
    background-color: #000;
}
</style>
