<script setup lang="ts">
import { t } from '../i18n'
import type { FairteilerCare } from '../types'

defineProps<{ care: FairteilerCare }>()
</script>

<template>
  <span v-if="care.needsCleaning" class="badge-amber">{{ t('care.needsCleaning') }}</span>
  <span v-if="care.needsMaintenance" class="badge-warn">{{ t('care.needsMaintenance') }}</span>
</template>
