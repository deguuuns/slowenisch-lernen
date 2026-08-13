# Slovensko – Slowenisch lernen

Mobile-first MVP für deutschsprachige Slowenisch-Anfänger. Fokus: aktives Sprechen, langsames Audio, kurze Grammatik, Fehlertracking und Spaced Repetition.

## Enthalten

- 5 vollständige Startlektionen
- 120 Seed-Vokabeln
- 55 Beispielsätze
- 32 Übungen
- 5 Dialoge
- Browser-TTS mit `sl-SI`, vier Geschwindigkeiten und Wort-für-Wort-Modus
- Mikrofon-Transkription über Web Speech API, wenn der Browser Slowenisch unterstützt
- LocalStorage für Fortschritt, Fehler und Wiederholungen
- Spaced-Repetition-Intervalle: 10 Min, 1, 3, 7, 14 und 30 Tage
- responsives Mobile-first UI

## Lokal starten

```bash
npm install
npm run dev
```

Danach im Browser `http://localhost:3000` öffnen.

Für die Mikrofonfunktion eignet sich ein Chromium-basierter Browser am besten. Welche slowenische Stimme bei Text-to-Speech verfügbar ist, hängt vom Betriebssystem und Browser ab.

## Architektur

- `app/` – Next.js App Router und UI
- `components/` – Audio- und Sprechkomponenten
- `data/seed.ts` – Vokabeln, Sätze, Übungen, Lektionen und Dialoge
- `lib/storage.ts` – LocalStorage + Spaced Repetition + Fehlertracking
- `lib/text.ts` – Antwortvergleich
- `types/` – Datenmodelle

## Späterer Backend-Ausbau

Das lokale `UserProgress`-Modell kann auf Supabase/Postgres gemappt werden. Der aktuelle Tutor ist lokal/regelorientiert; ein LLM-Tutor kann später als eigener Service hinter derselben UI ergänzt werden.

## Optionaler KI-Tutor

Ohne Konfiguration arbeitet der Tutor lokal mit typischen Anfängerfehlern. Für ein echtes LLM kopiere `.env.example` nach `.env.local` und setze `AI_TUTOR_ENDPOINT` sowie optional `AI_TUTOR_KEY`. Der Endpunkt erhält `{ system, message, history }` und sollte JSON mit `reply`, `output` oder `message` zurückgeben.
