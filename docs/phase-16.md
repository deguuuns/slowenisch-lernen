# Phase 16 – Curriculumgebundener A1-Wortschatzimport

Phase 16 erweitert die vorbereitete A1-Sprachdatenbasis um 60 kuratierte Einträge mit stabilen IDs `v121` bis `v180`.

Die neuen Wörter sind in drei geplante Curriculum-Einheiten gebunden:

- Lektion 6: Einkaufen – Preise, Farben, Größen und Bezahlen
- Lektion 7: Unterwegs – Verkehrsmittel, Fahrkarten, Wege und Reisezeiten
- Lektion 8: Zuhause und Hilfe – Wohnung, Wetter und grundlegende Hilfesituationen

Jeder Eintrag besitzt deutsche Bedeutung, slowenisches Beispiel, deutsche Beispielübersetzung, A1-Kennzeichnung und Curriculum-Tags. Substantive erhalten soweit sinnvoll ein Genus, Verben ein Lemma.

Wichtig: Der Import verändert keinen bestehenden Lernstand. Die neuen Einträge werden nicht automatisch als eingeführt markiert und ersetzen keine vorhandenen IDs. Ihre Freischaltung erfolgt erst in den folgenden Phasen über Lektionen und Übungen.

Regressionstests sichern Anzahl, ID-Bereich, Eindeutigkeit, A1-Level, Lektion-Zuordnung, Beispiele, Tags und die Trennung vom bestehenden `v001`–`v120`-Katalog ab.
