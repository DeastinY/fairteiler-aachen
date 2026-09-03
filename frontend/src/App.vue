<script setup lang="ts">
import AppToast from './components/AppToast.vue'
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <RouterView />
  <BottomNav />
  <AppToast />
</template>
