<script setup lang="ts">
import LegalPage from '../components/LegalPage.vue'
</script>

<template>
  <LegalPage title="Gut zu wissen">
    <p>
      Fairteiler funktionieren, weil alle ein bisschen mitdenken. Die
      wichtigsten Punkte:
    </p>

    <h2>Das gehört nicht hinein</h2>
    <ul>
      <li>rohes Fleisch, roher Fisch und Speisen mit rohem Ei</li>
      <li>Lebensmittel mit überschrittenem Verbrauchsdatum („zu verbrauchen bis …")</li>
      <li>Verdorbenes oder Angeschimmeltes</li>
      <li>Hochprozentiger Alkohol</li>
    </ul>
    <p>
      Beachte außerdem die Aushänge an deinem Fairteiler – manche Standorte
      haben eigene Regeln.
    </p>

    <h2>Das ist okay</h2>
    <ul>
      <li>
        Überschrittenes Mindesthaltbarkeitsdatum (MHD) ist meist kein Problem –
        prüfe mit Augen, Nase und Verstand.
      </li>
      <li>Selbstgekochtes nur mit Zettel: Zutaten und Datum.</li>
    </ul>

    <h2>Vor Ort mitdenken</h2>
    <ul>
      <li>
        Hinterlasse den Fairteiler so, wie du ihn vorfinden möchtest – sauber
        und ordentlich.
      </li>
      <li>Nimm Verdorbenes gleich mit heraus und entsorge es.</li>
      <li>Kühlschranktüren gut schließen.</li>
      <li>
        Fotografiere keine anderen Menschen am Fairteiler – nicht alle möchten
        gesehen werden.
      </li>
      <li>
        Nimm, was du brauchst – und melde es kurz in der App, damit andere
        Bescheid wissen.
      </li>
    </ul>

    <p class="footer">
      Diese Hinweise fassen die Community-Praxis zusammen, ohne Gewähr.
      Verbindlich sind die Aushänge vor Ort und die Hygieneregeln von
      foodsharing.de.
    </p>
  </LegalPage>
</template>

<style scoped>
ul {
  margin: 10px 0 0 0;
  padding: 0 0 0 20px;
  font-size: 14px;
  line-height: 1.6;
}

li + li {
  margin-top: 4px;
}

.footer {
  color: var(--muted);
  font-size: 13px;
  margin-top: 22px;
}
</style>
