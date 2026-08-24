# Phase 21 – Vokabel- und Konjugationstraining V2

## Ziel

Der bestehende Vokabelbereich wird zu einem klareren adaptiven Trainingsarbeitsplatz ausgebaut. Bereits funktionierende Lernstands-, Sync-, Review- und LocalStorage-Strukturen bleiben unverändert.

## Umfang

- Vokabelliste mit Statusfiltern für neu, eingeführt, lernen, gelernt und sicher
- sichtbare Statuszählung zur schnellen Orientierung
- Vokabeltest weiterhin ausschließlich mit curriculumseitig bereits bekanntem Wortschatz
- adaptives Konjugationstraining: fällige, schwache und fehleranfällige bereits eingeführte Verbformen werden priorisiert
- keine Freischaltung unbekannter Wörter oder Verbformen
- Dark-Mode-kompatible Bedienelemente im Vokabelbereich
- Regressionstests für Curriculum-Gating und adaptive Reihenfolge

## Schutz bestehender Daten

Die Phase verändert keine `UserProgress`-Struktur, keine Synchronisationsfelder, keine bestehenden Vokabel-/Review-IDs und keine lokale Persistenz. Alle neuen Priorisierungen werden ausschließlich aus bestehenden Lernsignalen berechnet.

## Validierung

Vor Merge müssen TypeScript, Curriculum-Audit, vollständige Regressionstests, Lint und Production-Build erfolgreich sein.

## Nächste Ausbaustufe

Phase 22 fokussiert die Speaking Engine: klareres Aussprachefeedback, robustere Trennung von inhaltlicher Korrektheit und gesprochener Produktion sowie bessere mobile Rückmeldung.
