# Phase 18 – Lektion 6 „Nakupovanje“

## Ziel

Die in Phase 16 vorbereiteten Einkaufswörter werden erstmals über eine echte Lektion in den linearen und adaptiven Lernpfad freigeschaltet. Bestehende Nutzerstände bleiben unverändert; neue Wörter werden weiterhin erst beim Durchlaufen des Lernflows eingeführt.

## Umfang

- Lektion 6 mit Schwerpunkt Einkaufen, Preise, Farben, Größen und Bezahlen
- 20 curriculumgebundene Wörter `v121`–`v140`
- mindestens zehn kuratierte Beispielsätze
- gemischte Produktions-, Erkennungs- und Transferübungen
- Wiederverwendung bereits eingeführter Grammatik wie Akkusativ feminin und höfliche Bitte mit `lahko`
- eigener Einkauf-Dialog
- kombinierter Curriculum-Katalog als schrittweise Ablösung direkter Seed-Imports
- Regressionstest für Freischaltung, IDs, Zukunftswortschatz und Übungsintegrität

## Schutz bestehender Daten

Die Phase verändert keine gespeicherten `UserProgress`-Strukturen, keine Sync-Felder, keine Review-IDs und keine bisherigen Vokabel-IDs. Wörter aus Lektion 7 und 8 bleiben vorbereitet, aber werden nicht als eingeführt markiert.

## Noch vor Merge

Die Haupt-UI und `LessonFlow` müssen vollständig auf den kombinierten Curriculum-Katalog umgestellt werden. Anschließend werden TypeScript, Curriculum-Audit, Regressionstests, Lint und Production-Build validiert.
