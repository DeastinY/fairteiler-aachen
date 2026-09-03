<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchFairteilerList } from '../composables/api'
import { sortFairteiler } from '../lib/sort'
import type { FairteilerListItem } from '../types'

const items = ref<FairteilerListItem[] | null>(null)
const error = ref<string | null>(null)

async function load() {
  error.value = null
  try {
    items.value = sortFairteiler(await fetchFairteilerList())
  } catch {
    error.value = 'Die Fairteiler konnten nicht geladen werden. Bist du online?'
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">Aktivität</h1>
      <p class="page-sub">Deine Fairteiler und Benachrichtigungen</p>
    </header>

    <div class="card note">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a6516" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 8v4 M12 16h.01"></path>
      </svg>
      <span>Benachrichtigungen kommen in M2 – die Schalter hier sind noch ohne Funktion.</span>
    </div>

    <p v-if="!items && !error" class="hint">Lade Fairteiler …</p>
    <p v-else-if="error" class="hint error">{{ error }}</p>

    <div v-else-if="items" class="card list">
      <div v-for="item in items" :key="item.id" class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"></path>
          <path d="M10.3 20a2 2 0 0 0 3.4 0"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">{{ item.name }}</span>
          <span class="rownote">Benachrichtigungen kommen in M2</span>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          aria-checked="false"
          disabled
          :aria-label="`Benachrichtigungen für ${item.name} (noch nicht verfügbar)`"
        >
          <span class="knob"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note {
  margin: 16px 16px 0 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--amber-ink);
  background: var(--amber-soft);
  border-color: #e8dcbb;
}

.note svg {
  flex-shrink: 0;
}

.list {
  margin: 12px 16px 0 16px;
  padding: 6px 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-soft);
  min-height: 44px;
}

.row:last-child {
  border-bottom: none;
}

.row svg {
  flex-shrink: 0;
}

.rowbody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.rowname {
  font-size: 15px;
  font-weight: 600;
}

.rownote {
  font-size: 12px;
  color: var(--faint);
}

.switch {
  width: 46px;
  height: 28px;
  border-radius: 999px;
  background: #d9d5c7;
  position: relative;
  flex-shrink: 0;
  cursor: default;
  opacity: 0.7;
}

.switch .knob {
  position: absolute;
  left: 3px;
  top: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface);
}
</style>
