<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const active = computed<string>(() => {
  if (route.path === '/') return 'karte'
  if (route.path.startsWith('/liste') || route.path.startsWith('/fairteiler')) return 'liste'
  if (route.path.startsWith('/aktivitaet')) return 'aktivitaet'
  if (route.path.startsWith('/melden')) return 'melden'
  if (
    route.path.startsWith('/mehr') ||
    route.path.startsWith('/impressum') ||
    route.path.startsWith('/datenschutz')
  ) {
    return 'mehr'
  }
  return ''
})
</script>

<template>
  <nav id="bottomnav" aria-label="Hauptnavigation">
    <RouterLink to="/" class="navbtn" :class="{ active: active === 'karte' }">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11z"></path>
        <circle cx="12" cy="10" r="2.5"></circle>
      </svg>
      <span>Karte</span>
    </RouterLink>
    <RouterLink to="/liste" class="navbtn" :class="{ active: active === 'liste' }">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01"></path>
      </svg>
      <span>Liste</span>
    </RouterLink>
    <RouterLink to="/melden" class="navplus" aria-label="Meldung erstellen">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fdfcf8" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14 M5 12h14"></path>
      </svg>
    </RouterLink>
    <RouterLink to="/aktivitaet" class="navbtn" :class="{ active: active === 'aktivitaet' }">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 12h4l2.5-6 4 12 2.5-6h5"></path>
      </svg>
      <span>Aktivität</span>
    </RouterLink>
    <RouterLink to="/mehr" class="navbtn" :class="{ active: active === 'mehr' }">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="5" cy="12" r="1.4" fill="currentColor"></circle>
        <circle cx="12" cy="12" r="1.4" fill="currentColor"></circle>
        <circle cx="19" cy="12" r="1.4" fill="currentColor"></circle>
      </svg>
      <span>Mehr</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
#bottomnav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 480px;
  z-index: 40;
  background: var(--surface);
  border-top: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 8px calc(12px + env(safe-area-inset-bottom)) 8px;
}

.navbtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 56px;
  min-height: 44px;
  justify-content: center;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
}

.navbtn:hover {
  color: var(--muted);
}

.navbtn.active {
  color: var(--green);
  font-weight: 600;
}

.navplus {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--green);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -26px;
  box-shadow: 0 6px 16px rgba(47, 125, 84, 0.4);
  flex-shrink: 0;
}
</style>
