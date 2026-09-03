<script setup lang="ts">
import SkeletonBlock from './SkeletonBlock.vue'

defineProps<{ announce?: boolean }>()
</script>

<template>
  <!-- mirrors .listecard geometry so content arrives without layout shift -->
  <div class="card sk-card" data-test="skeleton-card">
    <div class="sk-top">
      <SkeletonBlock width="45%" height="18px" :announce="announce" />
      <SkeletonBlock width="72px" height="22px" rounded />
    </div>
    <SkeletonBlock width="65%" height="13px" />
    <div class="sk-bottom">
      <SkeletonBlock width="40%" height="13px" />
      <SkeletonBlock width="60px" height="26px" />
    </div>
  </div>
</template>

<style scoped>
.sk-card {
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sk-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}
</style>
