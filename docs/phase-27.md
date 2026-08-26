# Phase 27 – großer Qualitäts- und Sprachaudit

Phase 27 schließt die vereinbarte Qualitätsroadmap ab. Ziel ist nicht ein weiterer Funktionsausbau, sondern eine belastbare Endkontrolle des freigegebenen A1-Curriculums und der wichtigsten sprachlichen Integritätsregeln.

## Enthalten

- Der zentrale Curriculum-Audit prüft jetzt den vollständigen freigegebenen Katalog statt nur den historischen Seed-Bestand.
- Zusätzlicher Qualitäts-/Sprachaudit über Lektionen, Wortschatz, Übungen, Beispielsätze und Dialoge.
- Prüfung auf doppelte IDs, leere Inhalte, unbekannte Lektionsreferenzen und leere akzeptierte Antworten.
- Sicherung, dass alle vorhandenen Curriculum-Wörter tatsächlich einer freigegebenen Lektion angehören.
- Schutz der kritischen slowenischen Unterscheidung `dva brata` vs. `dve brata` gegen versehentliche Aufnahme falscher akzeptierter Antworten.
- Der neue Audit ist Teil der regulären Regression-Suite und läuft damit bei jedem Validierungsworkflow mit.

## Unverändert

Lernstand, Synchronisation, Benutzerstatus, lokale Speicherung, SRS, Mastery-Werte, Curriculum-Gating und bestehende IDs werden nicht migriert oder zurückgesetzt.

## Abschlusskriterium

Die Qualitätsroadmap gilt als abgeschlossen, wenn TypeScript, vollständiger Curriculum-Audit, Regressionstests inklusive Qualitäts-/Sprachaudit, Lint, Production-Build und Security-Audit auf dem Phase-27-Head erfolgreich sind und der Pull Request mergebar ist.
