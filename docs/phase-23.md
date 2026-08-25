# Phase 23 – Adaptive Dialoge

Phase 23 macht die bestehenden A1-Rollenspiele adaptiv, ohne Lernstand, Synchronisation oder Persistenz zu verändern.

## Neu

- Dialogschritte reagieren auf Antwortlänge und Hilfebedarf.
- Sehr kurze bzw. stark unterstützte Antworten werden einmal gezielt gefestigt, statt sofort weiterzuspringen.
- Nach einem zweiten passenden Versuch geht der Dialog weiter, damit kein Nutzer in einer Schleife hängen bleibt.
- Grammatikfehler, deutsche Antworten und unpassende Antworten halten den aktuellen Dialogschritt fest und bieten passende Hilfe.
- Fortschritt pro Szenario wird sichtbar angezeigt.
- Gesprächsabschluss wird explizit erkannt; danach kann das Szenario neu gestartet oder gewechselt werden.
- UI ist für Hell- und Dunkelmodus ausgelegt und auf Mobilgeräten kompakter.
- Neue Regressionstests sichern Antwortqualitäts-Klassifikation, Verstärkung, Fortschritt und Abschluss.

## Nächste Phase

Phase 24: Tageslernflow V2 – Wiederholen, neue Inhalte, Hören, Sprechen und Transfer in einer zusammenhängenden adaptiven Sitzung verbinden.
