/**
 * German catalog – the source of truth. Every other locale must provide
 * exactly this key set (enforced by types and a completeness test).
 * "Fairteiler" stays untranslated everywhere: it is a proper noun.
 */
const de = {
  // shared
  'common.appName': 'Fairteiler Aachen',
  'common.loading': 'Lade Fairteiler …',
  'common.loadError': 'Die Fairteiler konnten nicht geladen werden. Bist du online?',
  'common.retry': 'Erneut versuchen',
  'common.back': 'Zurück',
  'common.close': 'Schließen',
  'common.offline': 'Offline – letzter bekannter Stand',
  'common.noFilterMatch': 'Keine Fairteiler entsprechen den gewählten Filtern.',

  // bottom navigation
  'common.listSeparator': ', ',

  'nav.karte': 'Karte',
  'nav.liste': 'Liste',
  'nav.aktivitaet': 'Aktivität',
  'nav.mehr': 'Mehr',
  'nav.melden': 'Meldung erstellen',

  // status
  'status.etwas_da': 'Etwas da',
  'status.leer': 'Leer gemeldet',
  'status.keine_meldung': 'Keine aktuelle Meldung',

  // food tags
  'tags.brot_backwaren': 'Brot & Backwaren',
  'tags.obst': 'Obst',
  'tags.gemuese': 'Gemüse',
  'tags.gekuehltes': 'Gekühltes',
  'tags.konserven': 'Konserven',
  'tags.zubereitetes': 'Zubereitetes',
  'tags.sonstiges': 'Sonstiges',

  // report types (detail rows)
  'report.brought': 'Etwas gebracht',
  'report.taken': 'Etwas mitgenommen',
  'report.empty': 'Leer gemeldet',
  'report.cleaned': 'Gereinigt / in Ordnung gebracht',
  'report.needs_cleaning': 'Reinigung nötig gemeldet',
  'report.needs_maintenance': 'Defekt gemeldet',

  // care badges
  'care.needsCleaning': 'Reinigung nötig',
  'care.needsMaintenance': 'Defekt gemeldet',

  // relative time
  'time.justNow': 'gerade eben',
  'time.minutes': 'vor {n} Min',
  'time.hours': 'vor {n} Std',
  'time.yesterday': 'gestern',
  'time.day': 'vor 1 Tag',
  'time.days': 'vor {n} Tagen',
  'time.none': 'noch keine Meldung',

  // opening hours
  'hours.title': 'Öffnungszeiten',
  'hours.closed': 'Geschlossen',
  'hours.openNow': 'Jetzt geöffnet',
  'hours.range': '{from}–{to} Uhr',
  'hours.join': 'und',
  'hours.mo': 'Mo',
  'hours.tu': 'Di',
  'hours.we': 'Mi',
  'hours.th': 'Do',
  'hours.fr': 'Fr',
  'hours.sa': 'Sa',
  'hours.su': 'So',

  // filter chips
  'filters.etwasDa': 'Etwas da',
  'filters.openNow': 'Jetzt offen',
  'filters.openNowShort': 'Offen',
  'filters.aroundTheClockShort': '24/7',
  'filters.aroundTheClock': 'Rund um die Uhr',
  'filters.cooled': 'Gekühlt',
  'filters.aria': 'Filter',

  // Karte
  'karte.mapAria': 'Karte der Fairteiler in Aachen',
  'karte.locate': 'Standort verwenden',
  'karte.locating': 'Suche …',
  'karte.nearby': 'In deiner Nähe',
  'karte.showAll': 'Alle {n} anzeigen',
  'karte.summary': '{reported} von {total} mit aktueller Meldung',
  'karte.geoUnsupported': 'Standort ist in diesem Browser nicht verfügbar.',
  'karte.geoDenied': 'Standort nicht verfügbar – Sortierung ohne Entfernung.',

  // Liste
  'karte.osmContributors': '-Mitwirkende',
  'karte.details': 'Details',
  'karte.deselect': 'Auswahl schließen',
  'karte.farAway': 'Du scheinst weiter weg zu sein – Karte bleibt bei den Fairteilern.',

  'filters.baskets': 'Essenskörbe',
  'karte.basket': 'Essenskorb',
  'karte.basketTitle': 'Essenskorb in der Nähe',
  'karte.basketCaption': 'Privates Lebensmittel-Angebot – Details und Anfrage auf foodsharing.de.',
  'karte.basketStale': 'Stand: {time}',

  'karte.basketsEmpty': 'Gerade keine Essenskörbe in der Nähe.',
  'aktivitaet.baskets': 'Neue Essenskörbe',
  'aktivitaet.basketsNote': 'Wird höchstens alle 30 Minuten geprüft – Benachrichtigungen können sich entsprechend verzögern.',

  'liste.title': 'Alle Fairteiler',
  'liste.subtitle': 'Standorte in Aachen und Umgebung',
  'liste.summary': '{total} Standorte in Aachen und Umgebung · {reported} mit aktueller Meldung',
  'liste.chartCaption': 'Meldungen · 7 Tage',

  // Detail
  'detail.notFound': 'Dieser Fairteiler wurde nicht gefunden.',
  'detail.loadError': 'Der Fairteiler konnte nicht geladen werden. Bist du online?',
  'detail.lastReported': 'Zuletzt gemeldet {time}',
  'detail.noCurrentReport': 'Noch keine aktuelle Meldung',
  'detail.aroundTheClock': 'Rund um die Uhr',
  'detail.cooled': 'Gekühlt',
  'detail.activity': 'Aktivität',
  'detail.activityCaption': 'Meldungen pro Tag · letzte 7 Tage',
  'detail.today': 'Heute',
  'detail.about': 'Über diesen Fairteiler',
  'detail.descriptionSource': 'Beschreibung von foodsharing.de (auf Deutsch)',
  'detail.fsLink': 'Auf foodsharing.de ansehen',
  'detail.reports': 'Letzte Meldungen',
  'detail.noReports': 'Noch keine Meldungen – sei die erste Person!',
  'detail.undo': 'Zurücknehmen',
  'detail.undone': 'Meldung zurückgenommen.',
  'detail.undoFailed': 'Konnte nicht zurückgenommen werden – bitte versuch es später noch einmal.',
  'detail.route': 'Route',
  'detail.reportNow': 'Jetzt melden',

  // Melden
  'melden.title': 'Meldung',
  'melden.fairteilerLabel': 'Fairteiler',
  'melden.selectAria': 'Fairteiler auswählen',
  'melden.what': 'Was möchtest du melden?',
  'melden.brought': 'Ich habe etwas gebracht',
  'melden.broughtNote': 'Andere sehen sofort, dass es sich lohnt',
  'melden.taken': 'Ich habe etwas mitgenommen',
  'melden.empty': 'Der Fairteiler ist leer',
  'melden.condition': 'Zustand melden',
  'melden.cleaned': 'Gereinigt / in Ordnung gebracht',
  'melden.needsCleaning': 'Reinigung nötig',
  'melden.defect': 'Etwas ist defekt',
  'melden.tagsTitle': 'Was ist jetzt da?',
  'melden.tagsNote': 'Mehrfachauswahl · optional',
  'melden.rulesLink': 'Was darf in den Fairteiler?',
  'melden.submit': 'Meldung senden',
  'melden.submitting': 'Wird gesendet …',
  'melden.footer': 'Ohne Anmeldung möglich · für alle sichtbar · in 10 Sekunden erledigt',
  'melden.success': 'Danke! Deine Meldung ist online.',
  'melden.undoAction': 'Rückgängig',
  'melden.networkError': 'Keine Verbindung – bitte versuch es gleich noch einmal.',

  // Aktivität
  'aktivitaet.title': 'Aktivität',
  'aktivitaet.subtitle': 'Deine Fairteiler und Benachrichtigungen',
  'aktivitaet.statsOne': 'Diese Woche: 1 Meldung · gerade {withFood} von {total} mit Essen',
  'aktivitaet.statsMany': 'Diese Woche: {n} Meldungen · gerade {withFood} von {total} mit Essen',
  'aktivitaet.statsLink': 'Mehr unter Statistik',
  'aktivitaet.serverDisabled': 'Benachrichtigungen sind auf diesem Server (noch) nicht aktiviert.',
  'aktivitaet.unsupported': 'Dein Browser unterstützt keine Push-Benachrichtigungen.',
  'aktivitaet.followOn': 'Sofort, wenn etwas gebracht wird',
  'aktivitaet.followOff': 'Stumm',
  'aktivitaet.followAria': 'Benachrichtigungen für {name}',
  'aktivitaet.quietTitle': 'Ruhezeiten',
  'aktivitaet.quietNote': 'Keine Benachrichtigungen von 21 bis 8 Uhr',
  'aktivitaet.permissionBlocked':
    'Benachrichtigungen sind im Browser blockiert – du kannst sie in den Browser-Einstellungen wieder erlauben.',
  'aktivitaet.subscribeFailed': 'Das Push-Abo konnte nicht eingerichtet werden.',
  'aktivitaet.saveFailed': 'Konnte nicht gespeichert werden – bitte versuch es später noch einmal.',

  // Mehr
  'mehr.title': 'Mehr',
  'mehr.subtitle': 'Über diese App und Rechtliches',
  'mehr.settings': 'Einstellungen',
  'mehr.rules': 'Gut zu wissen – Regeln & Hygiene',
  'mehr.statistik': 'Nutzung & Transparenz',
  'mehr.impressum': 'Impressum',
  'mehr.datenschutz': 'Datenschutz',
  'mehr.aboutTitle': 'Über diese App',
  'mehr.aboutText':
    'Fairteiler Aachen ist ein unabhängiges, privates und nichtkommerzielles Community-Projekt. Es besteht keine Verbindung zum foodsharing e.V. oder zur Plattform foodsharing.de – ‚Fairteiler’ wird hier rein beschreibend für öffentliche Lebensmittel-Verteilstationen verwendet. Die Stammdaten der Standorte stammen von der öffentlichen foodsharing-Plattform; offizielle Informationen: foodsharing.de. Der Quellcode ist offen (AGPL-3.0).',
  'mehr.fsRegion': 'foodsharing Aachen auf foodsharing.de',

  // install
  'install.title': 'Als App installieren',
  'install.caption':
    'Offline nutzbar, eigenes Icon – und auf iOS gibt es Push-Benachrichtigungen nur in der installierten App.',
  'install.button': 'Installieren',
  'install.ios1': 'Tippe auf das Teilen-Symbol',
  'install.ios1b': 'in Safari',
  'install.ios2': 'Wähle „Zum Home-Bildschirm”',

  // Einstellungen
  'einstellungen.title': 'Einstellungen',
  'einstellungen.subtitle': 'Alles lokal auf deinem Gerät',
  'einstellungen.language': 'Sprache / Language',
  'einstellungen.languageAria': 'Sprache wählen',
  'einstellungen.distances': 'Entfernungen anzeigen',
  'einstellungen.distancesNote': 'Karte fragt beim Öffnen automatisch nach deinem Standort',
  'einstellungen.notifications': 'Benachrichtigungen & Ruhezeiten',
  'einstellungen.notificationsNote': 'Im Tab „Aktivität” einstellen',
  'einstellungen.clear': 'Lokale Daten löschen',
  'einstellungen.clearConfirm': 'Wirklich alle lokalen Daten löschen?',
  'einstellungen.clearYes': 'Ja, löschen',
  'einstellungen.clearNo': 'Abbrechen',
  'einstellungen.clearCaption':
    'Entfernt Geräte-Kennung, Filter, Einstellungen und die lokale Benachrichtigungs-Auswahl aus diesem Browser.',
  'einstellungen.cleared': 'Lokale Daten gelöscht.',
  'einstellungen.version': 'Fairteiler Aachen v{version} · Quellcode: AGPL-3.0',

  // Regeln ("Gut zu wissen")
  'regeln.title': 'Gut zu wissen',
  'regeln.intro':
    'Fairteiler funktionieren, weil alle ein bisschen mitdenken. Die wichtigsten Punkte:',
  'regeln.notTitle': 'Das gehört nicht hinein',
  'regeln.not1': 'rohes Fleisch, roher Fisch und Speisen mit rohem Ei',
  'regeln.not2': 'Lebensmittel mit überschrittenem Verbrauchsdatum („zu verbrauchen bis …”)',
  'regeln.not3': 'Verdorbenes oder Angeschimmeltes',
  'regeln.not4': 'Hochprozentiger Alkohol',
  'regeln.notice':
    'Beachte außerdem die Aushänge an deinem Fairteiler – manche Standorte haben eigene Regeln.',
  'regeln.okTitle': 'Das ist okay',
  'regeln.ok1':
    'Überschrittenes Mindesthaltbarkeitsdatum (MHD) ist meist kein Problem – prüfe mit Augen, Nase und Verstand.',
  'regeln.ok2': 'Selbstgekochtes nur mit Zettel: Zutaten und Datum.',
  'regeln.careTitle': 'Vor Ort mitdenken',
  'regeln.care1':
    'Hinterlasse den Fairteiler so, wie du ihn vorfinden möchtest – sauber und ordentlich.',
  'regeln.care2': 'Nimm Verdorbenes gleich mit heraus und entsorge es.',
  'regeln.care3': 'Kühlschranktüren gut schließen.',
  'regeln.care4':
    'Mache keine Fotos von den Lebensmitteln und teile keine Bilder vom Inhalt – das kann die Kooperationen mit den Betrieben gefährden, aus denen die geretteten Lebensmittel stammen.',
  'regeln.care5': 'Fotografiere keine anderen Menschen am Fairteiler – nicht alle möchten gesehen werden.',
  'regeln.care6':
    'Nimm Rücksicht auf die Nachbarschaft – besonders abends leise ankommen, Türen nicht knallen und keine größeren Gruppen bilden.',
  'regeln.care7': 'Nimm, was du brauchst – und melde es kurz in der App, damit andere Bescheid wissen.',
  'regeln.footer':
    'Diese Hinweise fassen die Community-Praxis zusammen, ohne Gewähr. Verbindlich sind die Aushänge vor Ort und die Hygieneregeln von foodsharing.de.',

  // Welcome
  'welcome.title': 'Schön, dass du da bist!',
  'welcome.lead':
    'Diese App lebt von uns allen: Wer kurz meldet, was im Fairteiler los ist, hilft allen anderen – und rettet Lebensmittel.',
  'welcome.point1': 'Melden in 10 Sekunden – ohne Konto, anonym.',
  'welcome.point2': 'Sauber & fair: Hinterlasse den Fairteiler, wie du ihn vorfinden möchtest.',
  'welcome.point3': 'Respekt: keine Fotos von Essen oder Menschen, Rücksicht auf die Nachbarschaft.',
  'welcome.rulesPre': 'Alle Hinweise unter',
  'welcome.rulesLink': 'Gut zu wissen',
  'welcome.iosTip':
    'Tipp: Über das Teilen-Symbol → „Zum Home-Bildschirm” wird daraus eine richtige App.',
  'welcome.start': "Los geht's",
  'welcome.aria': 'Willkommen',

  // legal
  'legal.germanOnly': 'Rechtstexte sind nur auf Deutsch verfügbar.',

  // Statistik (transparency)
  'statistik.title': 'Statistik',
  'statistik.intro':
    'Diese App zählt Nutzung nur als anonyme Tagessummen – ohne IP-Adressen, ohne Kennungen.',
  'statistik.privacyLink': 'Details im Datenschutz',
  'statistik.reports7d': 'Meldungen (7 Tage)',
  'statistik.pushSubs': 'Push-Abos',
  'statistik.withFood': 'Fairteiler mit Essen',
  'statistik.viewsChart': 'App-Aufrufe pro Tag',
  'statistik.reportsChart': 'Meldungen pro Tag',
  'statistik.footer':
    'Die Daten aktualisieren sich laufend; Aufrufe aus dem Cache oder offline werden nicht gezählt.',
  'statistik.unavailable': 'Gerade nicht verfügbar.',

  // api
  'common.activityAria': 'Meldungen der letzten 7 Tage',
  'mehr.support': 'Projekt unterstützen',
  'mehr.supportNote': 'Freiwillig via PayPal · hilft, die Serverkosten zu decken · keine Spendenbescheinigung möglich',
  'aktivitaet.noServiceWorker': 'Push ist gerade nicht verfügbar (kein aktiver Service Worker) – bitte lade die App neu.',
  'liste.sortActivity': 'Aktivität',
  'liste.sortDistance': 'Entfernung',
  'liste.sortLastReported': 'Zuletzt gemeldet',
  'liste.sortAria': 'Sortierung',
  'liste.empty': 'Noch keine Fairteiler eingetragen.',
  'detail.bestTimeMorning': 'Meist wird vormittags etwas gebracht.',
  'detail.bestTimeAfternoon': 'Meist wird nachmittags etwas gebracht.',
  'detail.bestTimeEvening': 'Meist wird abends etwas gebracht.',
  'detail.share': 'Teilen',
  'detail.linkCopied': 'Link kopiert.',
  'api.genericError': 'Da ist etwas schiefgelaufen. Bitte versuch es später noch einmal.',
}

export default de
