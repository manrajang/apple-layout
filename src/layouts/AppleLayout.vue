<template>
  <div ref="layout" class="layout">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AppleLayout, { Scene } from '@/AppleLayout';
import '@/assets/global.scss';

export default Vue.extend({
  name: 'AppleLayout',
  props: { sceneList: { type: Array, required: true } },
  data(): { appleLayout: AppleLayout | null } {
    return {
      appleLayout: null,
    };
  },
  watch: {
    sceneList: {
      handler: function (newSceneList: Scene[]): void {
        this.appleLayout?.resetLayout(newSceneList);
        this.appleLayout?.playAnimation();
      },
      deep: true,
    },
  },
  mounted(): void {
    this.appleLayout ??= new AppleLayout(this.$refs.layout as HTMLDivElement, this.sceneList as Scene[]);
  },
  beforeDestroy(): void {
    this.appleLayout?.destoryEvents();
  },
});
</script>

<style lang="scss" scoped>
.layout {
  overflow-x: hidden;
}
</style>
