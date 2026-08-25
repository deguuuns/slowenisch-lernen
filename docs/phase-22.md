# Phase 22 – Speaking Engine V2

## Ziel

Die bestehende Sprechpraxis trennt künftig klar zwischen inhaltlicher Korrektheit und der Zuverlässigkeit der gesprochen erkannten Form. Bestehende Lernstands-, Sync-, Review- und LocalStorage-Strukturen bleiben unverändert.

## Umfang

- eigene Speaking-Feedbacklogik auf Basis von Transkriptähnlichkeit und – sofern verfügbar – Recognition-Confidence
- getrennte Rückmeldung für Inhalt und gesprochene Erkennung
- keine falsche Behauptung einer phonetischen Akustikmessung: Browser-Spracherkennung wird transparent als Erkennungssignal ausgewiesen
- klarerer Aufnahmezustand und kompaktere mobile Rückmeldung
- Dark-Mode-kompatible Sprechoberfläche
- getippte Antworten bleiben vollständig nutzbar, erhalten aber bewusst kein Ausspracheurteil
- Regressionstests für starke, unsichere und grammatisch falsche gesprochene Antworten

## Schutz bestehender Daten

Die Phase verändert keine `UserProgress`-Struktur, keine Synchronisationsfelder, keine bestehenden IDs und keine lokale Persistenz. Die zusätzlichen Rückmeldungen werden ausschließlich aus der aktuellen Antwort berechnet.

## Validierung

Vor Merge müssen TypeScript, Curriculum-Audit, vollständige Regressionstests, Lint und Production-Build erfolgreich sein.

## Nächste Ausbaustufe

Phase 23 fokussiert adaptive Dialoge und aktive Sprachproduktion: situative Gesprächsrunden, Transferfragen und passend zum Lernstand ausgewählte freie Antworten.
