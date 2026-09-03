<script setup lang="ts">
// Text verbatim from docs/legal/impressum.md – placeholders stay visibly
// marked until they are filled in before launch.
import LegalPage from '../components/LegalPage.vue'
</script>

<template>
  <LegalPage title="Impressum">
    <p>Angaben gemäß § 5 DDG:</p>

    <address>
      <strong><mark class="ph">[VOR- UND NACHNAME]</mark></strong><br />
      <mark class="ph">[STRASSE UND HAUSNUMMER]</mark><br />
      <mark class="ph">[PLZ]</mark> Aachen
    </address>

    <p>E-Mail: <mark class="ph">[KONTAKT-E-MAIL]</mark></p>

    <p>
      Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:<br />
      <mark class="ph">[VOR- UND NACHNAME]</mark>, Anschrift wie oben.
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
  </LegalPage>
</template>
