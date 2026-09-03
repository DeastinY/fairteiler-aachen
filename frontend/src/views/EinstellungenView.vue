<script setup lang="ts">
import { ref } from 'vue'
import {
  clearLocalData,
  loadAutoLocate,
  saveAutoLocate,
} from '../composables/settings'
import { resetFilters } from '../composables/useFilters'
import { showToast } from '../composables/useToast'

const appVersion = __APP_VERSION__

const autoLocate = ref(loadAutoLocate())
const confirmClear = ref(false)

function toggleAutoLocate() {
  autoLocate.value = !autoLocate.value
  saveAutoLocate(autoLocate.value)
}

function onClearTap() {
  if (!confirmClear.value) {
    confirmClear.value = true
    return
  }
  clearLocalData()
  resetFilters()
  autoLocate.value = false
  confirmClear.value = false
  showToast('Lokale Daten gelöscht.')
}

function cancelClear() {
  confirmClear.value = false
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">Einstellungen</h1>
      <p class="page-sub">Alles lokal auf deinem Gerät</p>
    </header>

    <div class="card list">
      <div class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="7"></circle>
          <path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">Entfernungen anzeigen</span>
          <span class="rownote">Karte fragt beim Öffnen automatisch nach deinem Standort</span>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="autoLocate"
          aria-label="Entfernungen anzeigen"
          data-test="auto-locate"
          @click="toggleAutoLocate"
        >
          <span class="knob"></span>
        </button>
      </div>

      <RouterLink to="/aktivitaet" class="row rowlink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"></path>
          <path d="M10.3 20a2 2 0 0 0 3.4 0"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">Benachrichtigungen &amp; Ruhezeiten</span>
          <span class="rownote">Im Tab „Aktivität" einstellen</span>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </RouterLink>
    </div>

    <div class="card list">
      <div class="clearblock">
        <template v-if="!confirmClear">
          <button type="button" class="clearbtn" data-test="clear-data" @click="onClearTap">
            Lokale Daten löschen
          </button>
        </template>
        <template v-else>
          <p class="confirmtext" data-test="clear-confirm-text">Wirklich alle lokalen Daten löschen?</p>
          <div class="confirmrow">
            <button type="button" class="confirmbtn danger" data-test="clear-confirm" @click="onClearTap">
              Ja, löschen
            </button>
            <button type="button" class="confirmbtn" data-test="clear-cancel" @click="cancelClear">
              Abbrechen
            </button>
          </div>
        </template>
        <p class="caption">
          Entfernt Geräte-Kennung, Filter, Einstellungen und die lokale
          Benachrichtigungs-Auswahl aus diesem Browser.
        </p>
      </div>
    </div>

    <p class="footer">
      Fairteiler Aachen v{{ appVersion }} · Quellcode: AGPL-3.0
    </p>
  </div>
</template>

<style scoped>
.list {
  margin: 16px 16px 0 16px;
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

.rowlink {
  color: inherit;
  width: 100%;
}

.rowlink:hover {
  color: inherit;
}

.row > svg {
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
  color: var(--muted);
}

.switch {
  width: 46px;
  height: 28px;
  border-radius: 999px;
  background: #d9d5c7;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.switch[aria-checked='true'] {
  background: var(--green);
}

.switch .knob {
  position: absolute;
  left: 3px;
  top: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface);
  transition: transform 0.2s;
}

.switch[aria-checked='true'] .knob {
  transform: translateX(18px);
}

.clearblock {
  padding: 12px 0;
}

.clearbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  border: 1.5px solid #d9a08c;
  color: #8a3b2a;
  border-radius: 999px;
  padding: 11px 0;
  font-size: 14px;
  font-weight: 600;
}

.confirmtext {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px 0;
  text-align: center;
}

.confirmrow {
  display: flex;
  gap: 10px;
}

.confirmbtn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1.5px solid #cfcaba;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
}

.confirmbtn.danger {
  background: #8a3b2a;
  border-color: #8a3b2a;
  color: var(--surface);
}

.caption {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: 10px 0 0 0;
}

.footer {
  font-size: 12px;
  color: var(--faint);
  text-align: center;
  padding: 18px 16px 8px 16px;
  margin: 0;
}
</style>
