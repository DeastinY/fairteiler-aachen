<script setup lang="ts">
import { t } from '../i18n'
import InstallCard from '../components/InstallCard.vue'
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">{{ t('mehr.title') }}</h1>
      <p class="page-sub">{{ t('mehr.subtitle') }}</p>
    </header>

    <InstallCard />

    <nav class="card linklist" aria-label="Einstellungen">
      <RouterLink to="/einstellungen" class="linkrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span class="linkname">{{ t('mehr.settings') }}</span>
        <svg class="dir-flip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </RouterLink>
    </nav>

    <section class="card about" aria-label="Über diese App">
      <h2 class="disp abouttitle">{{ t('mehr.aboutTitle') }}</h2>
      <p class="abouttext">{{ t('mehr.aboutText') }}</p>
      <a
        class="extlink"
        href="https://foodsharing.de/region/aachen"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('mehr.fsRegion') }}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 17L17 7 M9 7h8v8"></path>
        </svg>
      </a>
    </section>

    <section class="card support">
      <a
        href="https://paypal.me/DeastinY"
        target="_blank"
        rel="noopener noreferrer"
        class="linkrow"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11z"></path>
        </svg>
        <span class="linkname">{{ t('mehr.support') }}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 17L17 7M9 7h8v8"></path>
        </svg>
      </a>
      <p class="supportnote">{{ t('mehr.supportNote') }}</p>
    </section>

    <nav class="card linklist" aria-label="Rechtliches">
      <RouterLink to="/regeln" class="linkrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 8v.01 M12 11v6"></path>
        </svg>
        <span class="linkname">{{ t('mehr.rules') }}</span>
        <svg class="dir-flip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </RouterLink>
      <RouterLink to="/statistik" class="linkrow" data-test="statistik-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 20V10 M10 20V4 M16 20v-7 M22 20H2"></path>
        </svg>
        <span class="linkname">{{ t('mehr.statistik') }}</span>
        <svg class="dir-flip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </RouterLink>
      <RouterLink to="/impressum" class="linkrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 3h9l5 5v13H6z"></path>
          <path d="M14 3v6h6"></path>
        </svg>
        <span class="linkname">{{ t('mehr.impressum') }}</span>
        <svg class="dir-flip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </RouterLink>
      <RouterLink to="/datenschutz" class="linkrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path>
        </svg>
        <span class="linkname">{{ t('mehr.datenschutz') }}</span>
        <svg class="dir-flip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.about {
  margin: 16px 16px 0 16px;
  padding: 16px;
}

.support {
  margin: 12px 16px 0 16px;
  padding: 4px 16px 12px 16px;
}

.supportnote {
  margin: 0;
  padding: 0 0 0 30px;
  font-size: 12px;
  color: var(--muted);
}

.abouttitle {
  font-weight: 650;
  font-size: 16px;
  margin: 0 0 8px 0;
}

.abouttext {
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0;
}

.extlink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  min-height: 44px;
  font-size: 14px;
  font-weight: 600;
}

.linklist {
  margin: 12px 16px 0 16px;
  padding: 4px 16px;
}

.linkrow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  min-height: 44px;
  border-bottom: 1px solid var(--border-soft);
  color: inherit;
}

.linkrow:hover {
  color: inherit;
}

.linkrow:last-child {
  border-bottom: none;
}

.linkname {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
}
</style>
