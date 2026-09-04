<script setup lang="ts">
// Text verbatim from docs/legal/datenschutz.md – placeholders stay visibly
// marked until they are filled in before launch.
import LegalPage from '../components/LegalPage.vue'
</script>

<template>
  <LegalPage title="Datenschutzerklärung" german-only>
    <p>Stand: 3. September 2026</p>

    <h2>1. Verantwortlicher</h2>
    <address>
      Richard Polzin<br />
      Dammstraße 43, 52066 Aachen<br />
      E-Mail: richard.polzin@posteo.de
    </address>

    <h2>2. Grundsatz</h2>
    <p>
      Diese App ist bewusst datensparsam: Sie funktioniert ohne Konto, ohne
      Cookies und ohne Tracking. Schriften und alle Inhalte werden von unserem
      eigenen Server geladen; einzige Ausnahmen sind die Kartenkacheln des
      staatlichen Dienstes basemap.de (Punkt 6a) und der Push-Dienst deines
      Browsers (Punkt 7).
    </p>

    <h2>3. Server-Logdateien</h2>
    <p>
      Beim Aufruf der App verarbeitet unser Server technisch notwendige Daten
      (IP-Adresse, Zeitpunkt, aufgerufene Adresse, User-Agent) in Logdateien.
      Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (sicherer Betrieb). Die Logs
      werden nach spätestens 7 Tagen gelöscht und nicht mit anderen Daten
      zusammengeführt.
    </p>

    <h2>4. Geräte-Kennung (Local Storage)</h2>
    <p>
      Zum Schutz vor Spam speichert die App eine zufällig erzeugte Kennung im
      Local Storage deines Browsers. Sie enthält keine personenbezogenen Angaben,
      wird bei Meldungen mitgesendet und auf dem Server nur als gehashter Wert
      gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Missbrauchsschutz);
      § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich für den gewünschten Dienst).
      Du kannst die Kennung jederzeit über die Website-Daten deines Browsers
      löschen.
    </p>

    <h2>5. Meldungen</h2>
    <p>
      Meldungen („gebracht", „mitgenommen", „leer", Lebensmittel-Kategorien) werden
      anonym gespeichert: Zeitpunkt, Kategorie, betroffener Fairteiler und die
      gehashte Geräte-Kennung. Es werden keine Namen, Konten oder Standortdaten
      gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Zweck der App —
      aktuelle Verfügbarkeit anzeigen). Eigene Meldungen können innerhalb von 15 Minuten in der App zurückgenommen werden.
    </p>

    <h2>6. Standort (optional)</h2>
    <p>
      Die Entfernungsanzeige nutzt den Standort deines Geräts nur, wenn du sie
      aktiv über „Standort verwenden" freigibst (Art. 6 Abs. 1 lit. a DSGVO).
      Der Standort wird ausschließlich lokal in deinem Browser verwendet und
      niemals an unseren Server übertragen.
    </p>

    <h2>6a. Kartendarstellung (OpenStreetMap)</h2>
    <p>
      Die Karte lädt Kartenkacheln von tile.openstreetmap.de, betrieben vom
      FOSSGIS e.V. (Deutschland) auf Basis von OpenStreetMap. Dabei erhält
      der Betreiber technisch bedingt deine IP-Adresse und den abgerufenen
      Kartenausschnitt; wir übermitteln keine weiteren Daten. Rechtsgrundlage:
      Art. 6 Abs. 1 lit. f DSGVO (verständliche Darstellung der Standorte,
      auch der Fairteiler jenseits der Grenze). Bereits geladene Kacheln
      werden lokal zwischengespeichert.
    </p>

    <h2>7. Push-Benachrichtigungen (optional)</h2>
    <p>
      Benachrichtigungen („wenn etwas gebracht wird") gibt es nur nach deiner
      ausdrücklichen Einwilligung über den Browser (Art. 6 Abs. 1 lit. a DSGVO).
      Dabei speichert unser Server die von deinem Browser erzeugte
      Push-Adresse (Endpoint samt kryptografischer Schlüssel), deine ausgewählten
      Fairteiler und ggf. Ruhezeiten. Die Zustellung erfolgt technisch bedingt
      über den Push-Dienst deines Browser-Anbieters (z. B. Mozilla, Google,
      Apple); Nachrichteninhalte sind Ende-zu-Ende verschlüsselt und für den
      Push-Dienst nicht lesbar. Wir setzen kein Firebase-SDK und keine
      Analyse-Dienste ein. Du kannst die Einwilligung jederzeit widerrufen, indem
      du die Benachrichtigungen in der App oder im Browser deaktivierst; die
      gespeicherte Push-Adresse wird dann gelöscht. Nicht mehr erreichbare
      Push-Adressen werden automatisch gelöscht.
    </p>

    <h2>8. Empfänger und Drittländer</h2>
    <p>
      Es findet keine Weitergabe an Dritte statt, mit Ausnahme des unter Punkt 7
      beschriebenen Push-Dienstes deines Browser-Anbieters. Gehostet wird die App
      bei Uberspace (uberspace.de) in Deutschland; mit dem Anbieter besteht ein
      Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.
    </p>

    <h2>9. Speicherdauer</h2>
    <p>
      Meldungen werden nach 90 Tagen gelöscht oder
      anonymisiert aggregiert. Push-Abonnements bestehen bis zum Widerruf.
    </p>

    <h2>10. Deine Rechte</h2>
    <p>
      Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
      (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und
      Widerspruch (Art. 21 DSGVO). Wende dich dazu formlos an die oben genannte
      E-Mail-Adresse. Beschwerden richtest du an die Landesbeauftragte für
      Datenschutz und Informationsfreiheit Nordrhein-Westfalen (ldi.nrw.de).
    </p>
    <p>
      Da Meldungen anonym gespeichert werden, können wir einzelne Meldungen
      nachträglich keiner Person zuordnen; Auskunfts- und Löschansprüche laufen
      insoweit ins Leere (Art. 11 DSGVO).
    </p>
  </LegalPage>
</template>
