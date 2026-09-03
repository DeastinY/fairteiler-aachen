<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FairteilerCard from '../components/FairteilerCard.vue'
import FilterChips from '../components/FilterChips.vue'
import OfflineBanner from '../components/OfflineBanner.vue'
import { fetchFairteilerList } from '../composables/api'
import { useFilters } from '../composables/useFilters'
import { offlineBannerVisible, useOnline } from '../composables/useOnline'
import { applyFilter } from '../lib/filters'
import { sortFairteiler } from '../lib/sort'
import type { FairteilerListItem } from '../types'

const online = useOnline()
const items = ref<FairteilerListItem[] | null>(null)
const error = ref<string | null>(null)

const showOffline = computed(() =>
  offlineBannerVisible(online.value, items.value !== null, error.value !== null),
)

const filter = useFilters()
const sorted = computed(() =>
  items.value ? sortFairteiler(applyFilter(items.value, filter)) : [],
)
const reported = computed(
  () => sorted.value.filter((f) => f.status.state !== 'keine_meldung').length,
)

async function load() {
  error.value = null
  items.value = null
  try {
    items.value = await fetchFairteilerList()
  } catch {
    error.value = 'Die Fairteiler konnten nicht geladen werden. Bist du online?'
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">Alle Fairteiler</h1>
      <p v-if="items" class="page-sub">
        {{ items.length }} Standorte in Aachen und Umgebung ·
        {{ reported }} mit aktueller Meldung
      </p>
      <p v-else class="page-sub">Standorte in Aachen und Umgebung</p>
      <FilterChips class="listchips" />
    </header>

    <OfflineBanner v-if="showOffline" />

    <p v-if="!items && !error" class="hint">Lade Fairteiler …</p>

    <div v-else-if="error" class="hint error">
      <p>{{ error }}</p>
      <button type="button" class="retrybtn" @click="load">Erneut versuchen</button>
    </div>

    <div v-else class="cards">
      <p v-if="sorted.length === 0" class="hint">
        Keine Fairteiler entsprechen den gewählten Filtern.
      </p>
      <FairteilerCard v-for="item in sorted" :key="item.id" :fairteiler="item" />
    </div>
  </div>
</template>

<style scoped>
.listchips {
  margin-top: 12px;
}

.cards {
  padding: 16px 16px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
