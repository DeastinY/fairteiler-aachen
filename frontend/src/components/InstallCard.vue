<script setup lang="ts">
import { ref } from 'vue'
import { useInstallPrompt } from '../composables/useInstallPrompt'

const { mode, prompt } = useInstallPrompt()

const busy = ref(false)

async function onInstall() {
  if (busy.value) return
  busy.value = true
  try {
    await prompt()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section
    v-if="mode === 'promptable' || mode === 'ios'"
    class="card installcard"
    aria-label="Als App installieren"
  >
    <div class="head">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3v12 M7 10l5 5 5-5"></path>
        <path d="M4 19h16"></path>
      </svg>
      <span class="disp title">Als App installieren</span>
    </div>
    <p class="caption">
      Offline nutzbar, eigenes Icon – und auf iOS gibt es Push-Benachrichtigungen
      nur in der installierten App.
    </p>

    <button
      v-if="mode === 'promptable'"
      type="button"
      class="installbtn"
      :disabled="busy"
      @click="onInstall"
    >
      Installieren
    </button>

    <ol v-else class="steps">
      <li>
        Tippe auf das Teilen-Symbol
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3v12 M8 6l4-4 4 4"></path>
          <path d="M5 11v9h14v-9"></path>
        </svg>
        in Safari
      </li>
      <li>Wähle „Zum Home-Bildschirm"</li>
    </ol>
  </section>
</template>

<style scoped>
.installcard {
  margin: 16px 16px 0 16px;
  padding: 16px;
}

.head {
  display: flex;
  align-items: center;
  gap: 9px;
}

.title {
  font-weight: 650;
  font-size: 16px;
}

.caption {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
  margin: 8px 0 0 0;
}

.installbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 12px;
  min-height: 44px;
  background: var(--green);
  color: var(--surface);
  border-radius: 999px;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 5px 14px rgba(47, 125, 84, 0.35);
}

.installbtn:disabled {
  opacity: 0.6;
}

.steps {
  margin: 10px 0 0 0;
  padding: 0 0 0 20px;
  font-size: 14px;
  line-height: 1.7;
}

.steps svg {
  vertical-align: -2px;
}
</style>
