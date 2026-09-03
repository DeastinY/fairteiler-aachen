<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInstallPrompt } from '../composables/useInstallPrompt'
import {
  isWelcomeDone,
  markWelcomeDone,
  shouldShowWelcome,
} from '../composables/welcome'

const router = useRouter()
const { mode, prompt } = useInstallPrompt()

function entryPath(): string {
  const base = import.meta.env.BASE_URL
  const path = window.location.pathname
  return path.startsWith(base) ? `/${path.slice(base.length)}` : path
}

const visible = ref(shouldShowWelcome(entryPath(), isWelcomeDone()))
const installing = ref(false)

function close() {
  markWelcomeDone()
  visible.value = false
}

function openRegeln() {
  close()
  router.push('/regeln')
}

async function onInstall() {
  if (installing.value) return
  installing.value = true
  try {
    await prompt()
  } finally {
    installing.value = false
  }
}
</script>

<template>
  <div v-if="visible" class="welcome" role="dialog" aria-modal="true" aria-label="Willkommen">
    <div class="inner">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 20 C5 11 10 5 20 4 C21 14 15 19 8 19"></path>
        <path d="M5 20 C8 15 12 12 16 10"></path>
      </svg>
      <h1 class="disp title">Schön, dass du da bist!</h1>
      <p class="lead">
        Diese App lebt von uns allen: Wer kurz meldet, was im Fairteiler los
        ist, hilft allen anderen – und rettet Lebensmittel.
      </p>

      <ul class="points">
        <li>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 3"></path>
          </svg>
          <span>Melden in 10 Sekunden – ohne Konto, anonym.</span>
        </li>
        <li>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M8.5 12.5l2.5 2.5 5-5.5"></path>
          </svg>
          <span>Sauber &amp; fair: Hinterlasse den Fairteiler, wie du ihn vorfinden möchtest.</span>
        </li>
        <li>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 21s-7-4.4-9-8.5C1.5 9 3.5 6 6.5 6c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3 0 5 3 3.5 6.5-2 4.1-9 8.5-9 8.5z"></path>
          </svg>
          <span>Respekt: keine Fotos von Essen oder Menschen, Rücksicht auf die Nachbarschaft.</span>
        </li>
      </ul>

      <p class="regeln">
        Alle Hinweise unter
        <button type="button" class="regelnbtn" data-test="welcome-regeln" @click="openRegeln">
          Gut zu wissen
        </button>.
      </p>

      <div v-if="mode === 'promptable'" class="installblock">
        <button type="button" class="installbtn" :disabled="installing" @click="onInstall">
          Installieren
        </button>
      </div>
      <p v-else-if="mode === 'ios'" class="iosline">
        Tipp: Über das Teilen-Symbol → „Zum Home-Bildschirm" wird daraus eine
        richtige App.
      </p>

      <button type="button" class="startbtn" data-test="welcome-start" @click="close">
        Los geht's
      </button>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--bg);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.inner {
  margin: 0 auto;
  max-width: 480px;
  min-height: 100%;
  padding: 48px 28px calc(28px + env(safe-area-inset-bottom)) 28px;
  display: flex;
  flex-direction: column;
}

.title {
  font-weight: 750;
  font-size: 28px;
  letter-spacing: -0.02em;
  margin: 18px 0 0 0;
}

.lead {
  font-size: 15px;
  line-height: 1.55;
  color: var(--ink);
  margin: 10px 0 0 0;
}

.points {
  list-style: none;
  margin: 22px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.points li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.points svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.regeln {
  font-size: 14px;
  color: var(--muted);
  margin: 18px 0 0 0;
}

.regelnbtn {
  color: var(--green);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  min-height: 24px;
}

.installblock {
  margin-top: auto;
  padding-top: 26px;
}

.installbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  border: 1.5px solid var(--green);
  color: var(--green);
  border-radius: 999px;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 600;
}

.installbtn:disabled {
  opacity: 0.6;
}

.iosline {
  margin-top: auto;
  padding-top: 26px;
  font-size: 13px;
  color: var(--muted);
}

.startbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 12px;
  min-height: 48px;
  background: var(--green);
  color: var(--surface);
  border-radius: 999px;
  padding: 14px 0;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 5px 14px rgba(47, 125, 84, 0.35);
}

.iosline + .startbtn,
.installblock + .startbtn {
  margin-top: 12px;
}

.points + .regeln + .startbtn {
  margin-top: auto;
}

.regeln + .startbtn {
  margin-top: auto;
}
</style>
