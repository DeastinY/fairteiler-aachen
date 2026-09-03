<script setup lang="ts">
import AppToast from './components/AppToast.vue'
import BottomNav from './components/BottomNav.vue'
import WelcomeOverlay from './components/WelcomeOverlay.vue'
</script>

<template>
  <RouterView />
  <BottomNav />
  <AppToast />
  <WelcomeOverlay />
</template>
