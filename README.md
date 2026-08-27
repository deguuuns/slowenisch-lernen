# Slovensko – Slowenisch lernen

Mobile-first Slowenisch-Lern-App für deutschsprachige Lernende. Der aktive Lernflow baut Sprache atomar auf: einzelne Lexeme und Formen werden zuerst verstanden, dann erkannt und produziert, bevor daraus Satzmuster, Variationen und freie Anwendung entstehen.

## Lokal starten

```bash
npm install
npm run dev
```

Danach im Browser `http://localhost:3000` öffnen.

## Content-Architektur

### Source of Truth

- `data/vocabulary-catalog.ts` – kanonischer freigegebener Wortschatz. Die UI importiert nicht mehrere konkurrierende Vokabelversionen.
- `data/vocabulary-lessons-6-8.ts` – nicht überlappender Katalogabschnitt für die späteren A1-Lektionen; wird ausschließlich durch den kanonischen Katalog freigegeben.
- `data/curriculum.ts` – einziger öffentlicher Einstieg für freigegebene Lektionen, Vokabeln, Sätze, Übungen und Dialoge.
- `lib/content-registry.ts` – kanonische Verbmorphologie. Vollständige Tabellen dienen als Nachschlagewerk; der Lernflow führt nur benötigte Formen ein.
- `data/content-version.ts` – Content-Schema-Version und einmalige Migration alter, doppelt angelegter IDs.

### Voraussetzungen

Vokabeln, Formen, Sätze und Übungen können `prerequisites` als kanonische Content-Keys besitzen, z. B. `vocab:v181` oder `verb:biti:singular:2`. Die Session darf einen komplexeren Inhalt erst aktiv abfragen, wenn die benötigten Bausteine freigeschaltet sind.

Beispiel der Zielprogression:

`živjo` → `kako` → `biti` → `ti` → `si` → `Kako si?` → `Živjo! Kako si?`

Ein Beispielsatz ist kein Pflichtfeld der Einführung. `introExample` ist opt-in, damit neue Wörter nicht versehentlich mehrere unbekannte Inhalte gleichzeitig zeigen.

### Lektionen und Session-Auswahl

Eine Lektion besitzt einen großen gemeinsamen Content-/Aufgabenpool. Kleine Batches steuern nur, wie viele neue Atome gleichzeitig eingeführt werden. `lib/learning-flow.ts` führt eine lektionenweite semantische Aufgabenhistorie, sodass ein neuer Batch nicht wieder dieselbe Aufgabe hervorholt.

Die Progression folgt grob:

1. verstehen
2. wiedererkennen
3. geführt bilden
4. aktiv bilden
5. variieren
6. transferieren
7. später per Spaced Repetition wiederholen

`lib/learning-targets.ts` erzeugt semantische Fingerprints aus Lernziel, Wortschatz, Grammatik, Prompt und Antwort. Unterschiedliche Exercise-IDs oder Kartentypen gelten dadurch nicht automatisch als neue Aufgabe.

### Mastery und Migration

`UserProgress` speichert getrennte Kompetenzdimensionen für Wiedererkennen, Produktion, Hören, Sprechen und Grammatik. `lib/storage.ts` migriert ältere Content-IDs beim Laden auf die aktuelle `contentVersion`; eindeutiger alter Fortschritt bleibt erhalten.

### Neue Inhalte hinzufügen

1. Lexem/Form im kanonischen Katalog ergänzen und gegebenenfalls `parentId`, `prerequisites`, `sequence` und `usageNote` setzen.
2. Verbformen ausschließlich in `lib/content-registry.ts` pflegen.
3. Satz/Pattern erst ergänzen, wenn seine Kernbausteine referenzierbar sind.
4. Übungen mit `vocabularyIds`, `grammarRuleIds`, `targetContentKeys` und bei Bedarf `prerequisites` versehen.
5. `npm run validate` ausführen.
6. Mobile Zero-Scroll-QA ausführen, bevor eine Version deployed wird.

## Qualitätsprüfungen

- TypeScript und ESLint
- Curriculum- und Content-Integrität
- doppelte IDs und verwaiste Referenzen
- Voraussetzung-Zyklen
- semantische Übungsduplikate
- Migrationsregressionen
- Antwortbewertung und slowenische Morphologie
- Zero-Scroll-Browser-QA auf mehreren Smartphone-Größen
- explizites `Auswahl/Eingabe → Prüfen → Feedback → Weiter`

## Weitere Technik

- Next.js / TypeScript
- Browser-TTS für `sl-SI`
- Spracheingabe über Web Speech API, soweit vom Browser unterstützt
- LocalStorage plus optionale Cloud-Synchronisation
- Spaced Repetition, Fehlertracking und adaptive Sessions
- Dark Mode und mobile Fokusansichten

## Optionaler KI-Tutor

Ohne Konfiguration arbeitet der Tutor lokal mit typischen Anfängerfehlern. Für ein externes LLM kann `.env.example` nach `.env.local` kopiert und `AI_TUTOR_ENDPOINT` sowie optional `AI_TUTOR_KEY` gesetzt werden.
