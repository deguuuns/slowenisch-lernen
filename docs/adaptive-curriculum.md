# Adaptive Curriculum – Entscheidungsregeln

Die App behält den linearen Kurs als sicheren Lernpfad, legt darüber aber eine adaptive Priorisierung.

## Priorität

1. Fällige Spaced-Repetition-Aufgaben
2. Verfügbare Grammatik-Transferaufgaben nach Fehlern
3. Schwache Mastery-Werte mit mindestens zwei Versuchen
4. Aktive Produktion, wenn Erkennen deutlich stärker ist
5. Neuer Stoff aus der aktuellen Lektion

## Learner Model

Mastery wird getrennt gespeichert für:

- `vocab:<id>`
- `grammar:<id>`
- `skill:recognition`
- `skill:production`
- `skill:grammar-application`

Die Curriculum-Engine liest diese Werte nur. Die Aktualisierung erfolgt weiterhin zentral in der Progress-/Mastery-Logik.

Zusätzliche Lernsignale sind Antwortzeit und Hilfenutzung. Eine richtige, aber sehr langsame oder stark unterstützte Antwort wird daher schwächer gewichtet als eine sichere, schnelle Antwort ohne Hilfe.

## Sicherheitsregeln für den Lernfluss

- Adaptiv bedeutet nicht zufällig.
- Der Nutzer kann jederzeit manuell Lektionen, Wiederholung, Sprechen und Vokabeln öffnen.
- Neuer Stoff wird nicht bevorzugt, solange fällige oder klar schwache Inhalte existieren.
- Ein einzelner Fehler reicht nicht, um einen Inhalt dauerhaft als schwach zu klassifizieren.
- Das Curriculum darf die Answer-Evaluation nicht umgehen.
- Bereits eingeführte Wörter werden nicht erneut als Einführungskarte gezeigt.
- Transferaufgaben verwenden nach Möglichkeit einen anderen Satz mit derselben Grammatikregel und werden nach erfolgreichem Transfer entfernt.

## Deployment-Validierung

Preview-Builds müssen immer vom aktuellen Branch-Head erzeugt werden. Das erneute Deployen eines älteren fehlgeschlagenen Deployments baut denselben alten Commit erneut und validiert neue Fixes nicht.

Der aktuelle Teststand wurde vor dem Preview über GitHub Actions mit Typecheck, Regressionstests und Production-Build validiert. Ein neuer Branch-Commit darf als Trigger für einen frischen Preview-Build verwendet werden, wenn Vercel zuvor noch einen veralteten Commit gebaut hat.

Der iPhone-/Lernabstand-Teststand wurde erneut über GitHub Actions validiert und darf als frischer Preview-Trigger verwendet werden.

## Nächste Ausbaustufe

- skill-spezifische Hör- und Sprech-Mastery
- adaptive Sitzungsdauer anhand Tagesziel und Belastung
- Ausbau der Übungsvielfalt vor dem größeren Wortschatzimport
