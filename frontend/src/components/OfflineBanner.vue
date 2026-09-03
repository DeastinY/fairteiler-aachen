<script setup lang="ts">
import { t } from '../i18n'
</script>

<template>
  <p class="offline" role="status">{{ t('common.offline') }}</p>
</template>

<style scoped>
.offline {
  margin: 12px 16px 0 16px;
  padding: 9px 14px;
  background: var(--gray-soft);
  color: var(--gray-ink);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}
</style>
