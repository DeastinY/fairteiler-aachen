<script setup lang="ts">
// The interactive map (MapLibre + OSM) comes in the next stage.
// Until then this tab is an honest placeholder that points to the list.
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">Karte</h1>
      <p class="page-sub">Fairteiler in Aachen auf einen Blick</p>
    </header>

    <div class="card placeholder">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"></path>
        <path d="M9 4v14 M15 6v14"></path>
      </svg>
      <p class="title disp">Die Karte kommt im nächsten Schritt</p>
      <p class="text">
        Hier entsteht die Stadtkarte mit allen Fairteilern und ihrem gemeldeten
        Status. Bis dahin findest du alle Standorte in der Liste.
      </p>
      <RouterLink to="/liste" class="listbtn">Zur Liste</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.placeholder {
  margin: 16px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.title {
  font-weight: 650;
  font-size: 17px;
  margin: 10px 0 0 0;
}

.text {
  font-size: 14px;
  color: var(--muted);
  margin: 0;
  max-width: 34ch;
}

.listbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
  min-height: 44px;
  padding: 10px 26px;
  background: var(--green);
  color: var(--surface);
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 5px 14px rgba(47, 125, 84, 0.35);
}

.listbtn:hover {
  color: var(--surface);
}
</style>
