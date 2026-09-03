<script setup lang="ts">
// Text verbatim from docs/legal/impressum.md – placeholders stay visibly
// marked until they are filled in before launch.
import LegalPage from '../components/LegalPage.vue'
</script>

<template>
  <LegalPage title="Impressum">
    <p>Angaben gemäß § 5 DDG:</p>

    <address>
      <strong>Richard Polzin</strong><br />
      Dammstraße 43<br />
      52066 Aachen
    </address>

    <p>E-Mail: richard.polzin@posteo.de</p>

    <p>
      Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:<br />
      Richard Polzin, Anschrift wie oben.
    </p>

    <h2>Hinweis</h2>
    <p>
      Diese App ist ein ehrenamtliches, nicht-kommerzielles Community-Projekt rund
      um die Fairteiler (Lebensmittel-Verteilstationen) in Aachen. Sie steht in
      keiner offiziellen Verbindung zu foodsharing e.V. oder foodsharing.de; die
      Stammdaten der Fairteiler (Name, Adresse, Beschreibung) stammen von der
      öffentlichen foodsharing-Plattform.
    </p>

    <h2>Haftung für Inhalte</h2>
    <p>
      Die Statusmeldungen in dieser App („etwas da", „leer") werden anonym von
      Nutzerinnen und Nutzern gemeldet und ungeprüft angezeigt. Sie sind eine
      Momentaufnahme ohne Gewähr. Offensichtlich missbräuchliche Meldungen werden
      nach Kenntnis entfernt.
    </p>

    <h2>Dank &amp; beteiligte Projekte</h2>
    <p>Diese App steht auf den Schultern anderer Projekte:</p>
    <ul>
      <li>
        <a href="https://foodsharing.de" target="_blank" rel="noopener noreferrer">foodsharing.de</a>
        – die Plattform und Community, die die Fairteiler überhaupt erst
        möglich macht; von dort stammen die Stammdaten der Standorte.
      </li>
      <li>
        <a href="https://uberspace.de" target="_blank" rel="noopener noreferrer">Uberspace</a>
        – „Hosting on Asteroids": faires Pay-what-you-want-Hosting aus
        Deutschland, auf dem diese App läuft.
      </li>
      <li>
        <a href="https://basemap.de" target="_blank" rel="noopener noreferrer">basemap.de</a>
        / BKG – die amtliche Webkarte der deutschen Vermessungsverwaltungen
        liefert die Kartendaten (Open Data, dl-de/by-2-0).
      </li>
      <li>
        Freie Software: <a href="https://vuejs.org" target="_blank" rel="noopener noreferrer">Vue.js</a>,
        <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>,
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">Vite</a>,
        <a href="https://fastapi.tiangolo.com" target="_blank" rel="noopener noreferrer">FastAPI</a>,
        <a href="https://www.sqlalchemy.org" target="_blank" rel="noopener noreferrer">SQLAlchemy</a>
        und <a href="https://developer.chrome.com/docs/workbox" target="_blank" rel="noopener noreferrer">Workbox</a>;
        die Schriften Bricolage Grotesque und Instrument Sans (SIL Open Font License).
      </li>
    </ul>
    <p>
      Der Quellcode dieser App ist frei verfügbar (AGPL-3.0).
    </p>
  </LegalPage>
</template>
