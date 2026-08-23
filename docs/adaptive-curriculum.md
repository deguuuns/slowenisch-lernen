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
- skill-spezifische Hörstufen und Sprechmodi

Die Curriculum-Engine liest diese Werte nur. Die Aktualisierung erfolgt weiterhin zentral in der Progress-/Mastery-Logik.

Zusätzliche Lernsignale sind Antwortzeit und Hilfenutzung. Eine richtige, aber sehr langsame oder stark unterstützte Antwort wird daher schwächer gewichtet als eine sichere, schnelle Antwort ohne Hilfe.

## Adaptive Sitzungsdauer

Das eingestellte Tagesziel bleibt die persönliche Referenz. Die konkrete Tagesempfehlung darf davon kontrolliert abweichen, wenn die letzten Antworten eine klare Belastung oder besonders hohe Sicherheit zeigen.

Ausgewertet werden die letzten bis zu zwölf Versuche anhand von Trefferquote, durchschnittlicher Antwortzeit, Hilfenutzung und einer Häufung jüngster Fehler. Bei hoher Belastung wird die Einheit deutlich kompakter, bei erhöhter Belastung leicht verkürzt. Bei sehr sicherem, schnellem Lernen ohne Hilfen darf sie moderat verlängert werden. Ohne genügend aktuelle Daten bleibt die eingestellte Tagesdauer unverändert.

Die adaptive Dauer verändert nur die Menge der geplanten Aufgaben. Fällige Wiederholungen und andere inhaltliche Prioritäten bleiben erhalten.

## Übungsvielfalt

Kuratiertes Lernmaterial bleibt die fachliche Quelle. Für adaptive Übungssitzungen darf die Practice Engine daraus zusätzliche Präsentationsvarianten erzeugen, ohne Lernziele oder erwartete korrekte Antworten zu verändern.

Aktuell werden drei sichere Varianten genutzt:

- Satzbau aus deterministisch gemischten Wortbausteinen für mehr aktive Grammatik- und Produktionsarbeit.
- Erkennungsaufgaben als Multiple Choice mit Antworten aus bereits verfügbaren, geeigneten Aufgaben als Distraktoren.
- Aktiver Abruf ohne Auswahl für bestehende Multiple-Choice-Aufgaben.

Automatisch erzeugte Varianten behalten die Vokabel-, Grammatik- und Ziel-Metadaten ihrer Ursprungsaufgabe und verweisen explizit auf diese. Sie werden von derselben Answer-Evaluation und denselben Integritätsprüfungen verarbeitet. Persönlich offene Antworten sowie spezielle Hör- und Sprechaufgaben werden nicht automatisch in generische Varianten umgebaut.

Die adaptive Auswahl berücksichtigt außerdem die zuletzt verwendeten Darstellungsformen. Dadurch soll nicht nur das richtige Lernziel, sondern nach Möglichkeit auch eine abwechslungsreiche Form gewählt werden, ohne fällige oder schwache Inhalte zu verdrängen.

## Sicherheitsregeln für den Lernfluss

- Adaptiv bedeutet nicht zufällig.
- Der Nutzer kann jederzeit manuell Lektionen, Wiederholung, Sprechen und Vokabeln öffnen.
- Neuer Stoff wird nicht bevorzugt, solange fällige oder klar schwache Inhalte existieren.
- Ein einzelner Fehler reicht nicht, um einen Inhalt dauerhaft als schwach zu klassifizieren.
- Das Curriculum darf die Answer-Evaluation nicht umgehen.
- Bereits eingeführte Wörter werden nicht erneut als Einführungskarte gezeigt.
- Transferaufgaben verwenden nach Möglichkeit einen anderen Satz mit derselben Grammatikregel und werden nach erfolgreichem Transfer entfernt.
- Die Sitzungsdauer wird nie unter fünf Minuten empfohlen und höchstens moderat über das Tagesziel hinaus verlängert.
- Generierte Übungsvarianten dürfen keine neuen fachlichen Lösungen erfinden; Antwort und Zielbindung stammen aus einer bereits validierten Ursprungsaufgabe.

## Deployment-Validierung

Preview-Builds müssen immer vom aktuellen Branch-Head erzeugt werden. Das erneute Deployen eines älteren fehlgeschlagenen Deployments baut denselben alten Commit erneut und validiert neue Fixes nicht.

Der aktuelle Teststand wurde vor dem Preview über GitHub Actions mit Typecheck, Regressionstests und Production-Build validiert. Ein neuer Branch-Commit darf als Trigger für einen frischen Preview-Build verwendet werden, wenn Vercel zuvor noch einen veralteten Commit gebaut hat.

Der iPhone-/Lernabstand-Teststand wurde erneut über GitHub Actions validiert und darf als frischer Preview-Trigger verwendet werden.

## Nächste Ausbaustufe

- größerer, curriculumgebundener Wortschatzimport auf Basis der jetzt abgesicherten Übungsvielfalt
