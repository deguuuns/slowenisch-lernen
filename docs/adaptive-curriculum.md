# Adaptive Curriculum – Entscheidungsregeln

Die App behält den linearen Kurs als sicheren Lernpfad, legt darüber aber eine adaptive Priorisierung.

## Priorität

1. Fällige Spaced-Repetition-Aufgaben
2. Schwache Mastery-Werte mit mindestens zwei Versuchen
3. Aktive Produktion, wenn Erkennen deutlich stärker ist
4. Neuer Stoff aus der aktuellen Lektion

## Learner Model

Mastery wird getrennt gespeichert für:

- `vocab:<id>`
- `grammar:<id>`
- `skill:recognition`
- `skill:production`
- `skill:grammar-application`

Die Curriculum-Engine liest diese Werte nur. Die Aktualisierung erfolgt weiterhin zentral in der Progress-/Mastery-Logik.

## Sicherheitsregeln für den Lernfluss

- Adaptiv bedeutet nicht zufällig.
- Der Nutzer kann jederzeit manuell Lektionen, Wiederholung, Sprechen und Vokabeln öffnen.
- Neuer Stoff wird nicht bevorzugt, solange fällige oder klar schwache Inhalte existieren.
- Ein einzelner Fehler reicht nicht, um einen Inhalt dauerhaft als schwach zu klassifizieren.
- Das Curriculum darf die Answer-Evaluation nicht umgehen.
- Bereits eingeführte Wörter werden nicht erneut als Einführungskarte gezeigt.

## Nächste Ausbaustufe

- Antwortzeit und Hilfenutzung als zusätzliche Signale
- verzögerte Transferaufgaben nach Grammatikfehlern
- skill-spezifische Hör- und Sprech-Mastery
- adaptive Sitzungsdauer anhand Tagesziel und Belastung
