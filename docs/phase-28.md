# Phase 28 – Zero-Scroll-Lernmodus und Curriculum V2

## Ziel

Der aktive Lernschritt wird technisch von normalen Übersichtsseiten getrennt. Start, Vokabelliste, Fortschritt und Einstellungen dürfen scrollen. Eine konkrete Lernaufgabe darf dagegen nicht als lange Webseite wachsen.

## Fokusmodus

- Aktive Übungen werden in `LearningFocusPortal` gerendert.
- Der normale `main`-App-Rahmen wird während des Fokusmodus aus dem Layout genommen.
- Die Fokusansicht besitzt drei feste Funktionszonen: kompakter Fortschritt, flexibler Aufgabenbereich, primäre Aktion.
- Feedback ersetzt die Aufgabe, statt unter ihr angehängt zu werden.
- Hinweise und ausführliche Erklärungen werden als eigene Overlay-Zustände geöffnet.
- Bei Texteingabe darf die Aufgabenbeschriftung gegenüber Satz, Eingabe und Hauptaktion nachrangig werden.

## Lernzyklus V2

Jeder neue Inhalt folgt grundsätzlich dieser Progression:

1. Verstehen
2. Wiedererkennen
3. Geführte Produktion
4. Aktive Produktion
5. Variation
6. Transfer

`lib/learning-cycle.ts` bestimmt aus Lernstand und Aufgabe, welche Phase für einen Zielinhalt angemessen ist. Die Übungsauswahl erhält einen Bonus, wenn sie zur nächsten sinnvollen Phase passt.

Fehler erzeugen fachlich passende Reparaturpfade. Dual-, Genus-, Kasus-, Wortstellungs- und Konjugationsfehler erhalten unterschiedliche Sequenzen statt einer bloßen Wiederholung derselben Aufgabe.

## Wortschatz V2

Bestehende Vokabel-IDs bleiben erhalten, damit lokaler und synchronisierter Nutzerfortschritt nicht ungültig wird. Der vollständige Bestand läuft jedoch durch `buildVocabularyV2` und erhält systematisch:

- CEFR-Stufe
- Lemma
- Priorität
- Thema
- didaktische Curriculum-Einheit
- normalisierte Tags
- optionale Morphologie-Metadaten

Zusätzlich wurden zentrale A1-Lücken geschlossen: Fragewörter, Konjunktionen, Sprache/Herkunft, Eltern/Freunde, Wochentage, Tageszeit, Grundnahrungsmittel, Restaurantwörter, Kleidung, Reisebegriffe und elementare Gesundheitswörter.

## Curriculum-Struktur

- A1.1 Grundlagen
- A1.2 Personen und Herkunft
- A1.3 Familie und Beziehungen
- A1.4 Zeit und Alltag
- A1.5 Essen und Trinken
- A1.6 Einkaufen und Kleidung
- A1.7 Unterwegs
- A1.8 Wohnen, Wetter und Hilfe

## Qualitätsregel

Ein grüner Build reicht nicht. Für den aktiven Lernmodus gilt als Zielgröße bei 375 × 667: keine notwendige vertikale Seitenbewegung. Inhalte werden bei Platzmangel reduziert oder in einen eigenen Lernschritt verschoben, nicht unterhalb der sichtbaren Aufgabe angehängt.
