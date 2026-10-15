# ISV-Klassifizierungsvorschläge GT-0001 bis GT-0100

Diese 100 YAML-Dateien enthalten die bestehenden Fallannotationstexte sowie einen neuen Block `isv_expected_classification_proposal`.

**Wichtig:** Das sind **keine validierten Ground-Truth-Einstufungen**, sondern vorläufige, aus den Dokumenten abgeleitete Prüfvorschläge. Die BIT- und BV-Kataloge wurden nicht bereitgestellt. Die Formulierung eines Falles oder das Vorkommen von Personendaten genügt nicht zur Bestimmung einer ISV-Stufe.

- `classification: not_classified`: nur bei als öffentliche Medienmitteilung eindeutig veröffentlicht gedachten Fällen (unter Vorbehalt zusätzlicher Inhalte).
- `classification: insufficient_context`: keine belastbare Einstufung möglich; die Kandidaten unter `candidate_levels_for_review` sind **keine** alternativen Ground-Truth-Labels.
- `evidence_excerpts`: echte Auszüge aus dem Dokument. `locator: full_text_search` ist ein Suchhinweis, **keine geprüfte Seiten- oder Absatzkoordinate**.
- `legal_references`: allgemeine Rechtsgrundlagen, keine geprüfte Subsumtion auf einzelne Tatbestände.
- Die bisherigen YAML-Anmerkungen werden unverändert mitgeführt.

Vor Verwendung als Evaluation-Ground-Truth sind fachlicher Review und Katalogabgleich erforderlich.

`isv_manifest.yaml` enthält alle Fälle und die SHA-256-Hashes ihrer **unveränderten Originaldokumente**.
