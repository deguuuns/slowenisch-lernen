# Phase 26 – UI/UX-Polish

Phase 26 konzentriert sich bewusst auf Bedienqualität statt auf neue Lernlogik. Lernstand, Synchronisation, SRS, lokale Speicherung, Curriculum-Gating und bestehende Mastery-Strukturen bleiben unverändert.

## Ziele

- Übungen auf kleinen und niedrigen Mobil-Displays mit möglichst wenig Seitenscrollen nutzbar halten.
- Touch- und Tastaturbedienung robuster und klarer machen.
- Sichtbaren Fokus, reduzierte Bewegung und semantisches Feedback für Barrierefreiheit absichern.
- Wortbaustein-Aufgaben schneller korrigierbar machen, ohne den Übungszustand zu verlieren.
- Interaktive Flächen visuell konsistenter machen, ohne das bestehende Design neu aufzubauen.

## Umsetzung

- kompaktere ExerciseDeck-Höhen für normale und besonders niedrige Mobile-Viewports
- sichtbarer `:focus-visible`-Ring und größere Touch-Ziele
- `prefers-reduced-motion` wird global respektiert
- semantischer Fortschrittsbalken und `aria-live`-Feedback im ExerciseDeck
- fokussierte Texteingabe beim Aufgabenwechsel ohne Scroll-Sprung
- Zurücksetzen-Aktion für Satzbau/Wortbausteine
- konsistentere Hover-/Active-Zustände für Buttons und Antwortflächen
- zusätzliche Regressionstests für die UX-Sicherungen

## Nächste Phase

Phase 27 ist der große Qualitäts- und Sprachaudit: reale Lernpfade durchspielen, sprachliche Inhalte und Antwortbewertung systematisch prüfen, verbleibende Layout-/Mobile-Probleme erfassen und nur reproduzierbare Fehler gezielt beheben.
