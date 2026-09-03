<script setup lang="ts">
import AppToast from './components/AppToast.vue'
import BottomNav from './components/BottomNav.vue'
import WelcomeOverlay from './components/WelcomeOverlay.vue'
import { welcomeVisible } from './composables/welcome'
</script>

<template>
  <div class="app-shell" :inert="welcomeVisible" data-test="app-shell">
    <main>
      <RouterView />
    </main>
    <BottomNav />
  </div>
  <AppToast />
  <WelcomeOverlay />
</template>
