<script setup lang="ts">
import { ref } from 'vue'
import { t, useI18n, type LocaleCode } from '../i18n'
import {
  clearLocalData,
  loadAutoLocate,
  saveAutoLocate,
} from '../composables/settings'
import { resetFilters } from '../composables/useFilters'
import { showToast } from '../composables/useToast'

const appVersion = __APP_VERSION__

const { locale, setLocale, locales } = useI18n()

function onLanguageChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as LocaleCode
  void setLocale(value)
}

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
  showToast(t('einstellungen.cleared'))
}

function cancelClear() {
  confirmClear.value = false
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">{{ t('einstellungen.title') }}</h1>
      <p class="page-sub">{{ t('einstellungen.subtitle') }}</p>
    </header>

    <div class="card list">
      <div class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3 12h18 M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">{{ t('einstellungen.language') }}</span>
        </div>
        <select
          class="langselect"
          :value="locale"
          :aria-label="t('einstellungen.languageAria')"
          data-test="language-select"
          @change="onLanguageChange"
        >
          <option v-for="entry in locales" :key="entry.code" :value="entry.code">
            {{ entry.name }}
          </option>
        </select>
      </div>

      <div class="row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="7"></circle>
          <path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3"></path>
        </svg>
        <div class="rowbody">
          <span class="rowname">{{ t('einstellungen.distances') }}</span>
          <span class="rownote">{{ t('einstellungen.distancesNote') }}</span>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="autoLocate"
          :aria-label="t('einstellungen.distances')"
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
          <span class="rowname">{{ t('einstellungen.notifications') }}</span>
          <span class="rownote">{{ t('einstellungen.notificationsNote') }}</span>
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
            {{ t('einstellungen.clear') }}
          </button>
        </template>
        <template v-else>
          <p class="confirmtext" data-test="clear-confirm-text">{{ t('einstellungen.clearConfirm') }}</p>
          <div class="confirmrow">
            <button type="button" class="confirmbtn danger" data-test="clear-confirm" @click="onClearTap">
              {{ t('einstellungen.clearYes') }}
            </button>
            <button type="button" class="confirmbtn" data-test="clear-cancel" @click="cancelClear">
              {{ t('einstellungen.clearNo') }}
            </button>
          </div>
        </template>
        <p class="caption">{{ t('einstellungen.clearCaption') }}</p>
      </div>
    </div>

    <p class="footer">{{ t('einstellungen.version', { version: appVersion }) }}</p>
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

.langselect {
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  min-height: 44px;
  max-width: 50%;
}

.footer {
  font-size: 12px;
  color: var(--faint);
  text-align: center;
  padding: 18px 16px 8px 16px;
  margin: 0;
}
</style>
