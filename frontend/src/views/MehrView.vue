<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">Mehr</h1>
      <p class="page-sub">Über diese App und Rechtliches</p>
    </header>

    <section class="card about" aria-label="Über diese App">
      <h2 class="disp abouttitle">Über diese App</h2>
      <p class="abouttext">
        Fairteiler Aachen ist ein ehrenamtliches, nicht-kommerzielles
        Community-Projekt. Es ergänzt foodsharing.de um einen Live-Status der
        Aachener Fairteiler – anonym gemeldet von Menschen vor Ort. Der
        Quellcode ist offen und kann von der Community weiterentwickelt werden.
      </p>
      <a
        class="extlink"
        href="https://foodsharing.de/region/aachen"
        target="_blank"
        rel="noopener noreferrer"
      >
        foodsharing Aachen auf foodsharing.de
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 17L17 7 M9 7h8v8"></path>
        </svg>
      </a>
    </section>

    <nav class="card linklist" aria-label="Rechtliches">
      <RouterLink to="/impressum" class="linkrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 3h9l5 5v13H6z"></path>
          <path d="M14 3v6h6"></path>
        </svg>
        <span class="linkname">Impressum</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </RouterLink>
      <RouterLink to="/datenschutz" class="linkrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7570" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path>
        </svg>
        <span class="linkname">Datenschutz</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
