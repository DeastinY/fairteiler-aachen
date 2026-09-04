<script setup lang="ts">
import AppToast from './components/AppToast.vue'
import BottomNav from './components/BottomNav.vue'
import WelcomeOverlay from './components/WelcomeOverlay.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { welcomeVisible } from './composables/welcome'

const route = useRoute()
/** The map runs edge-to-edge under the status bar; everywhere else the bar
 * sits on the brand green so iOS' white glyphs stay readable. */
const overMap = computed(() => route.path === '/')
</script>

<template>
  <div class="statusbar" :class="{ overmap: overMap }" aria-hidden="true"></div>
  <div class="app-shell" :inert="welcomeVisible" data-test="app-shell">
    <main>
      <RouterView />
    </main>
    <BottomNav />
  </div>
  <AppToast />
  <WelcomeOverlay />
</template>

<style scoped>
.statusbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: env(safe-area-inset-top);
  background: var(--green);
  z-index: 300;
  pointer-events: none;
}

/* over the map: a scrim instead of a band, so the map stays edge-to-edge */
.statusbar.overmap {
  background: linear-gradient(
    to bottom,
    rgba(29, 82, 54, 0.82),
    rgba(29, 82, 54, 0.35) 70%,
    rgba(29, 82, 54, 0)
  );
  height: calc(env(safe-area-inset-top) + 10px);
}
</style>
