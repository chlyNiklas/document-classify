# Regelwerk ISG-Klassifizierung – KOBY Classify

> Referenzdokument für das Modell. Es enthält die Entscheidungsregeln, das Output-Format und die massgebenden Gesetzestexte im Wortlaut.
> Rechtsstand: ISG (SR 128) und ISV (SR 128.1), jeweils Stand 1. Januar 2024.
> Quellen: https://www.fedlex.admin.ch/eli/cc/2022/232/de (ISG) · https://www.fedlex.admin.ch/eli/cc/2023/735/de (ISV)

---

## 1. Aufgabe

Analysiere das Dokument und schlage **eine** Klassifizierungsstufe nach ISG/ISV vor. Begründe den Vorschlag.

Der Vorschlag ist **keine Entscheidung**. Ein Mensch bestätigt oder korrigiert ihn.

---

## 2. Output

Gib ausschliesslich folgendes JSON zurück:

```json
{
  "klassifizierung": "nicht klassifiziert | intern | vertraulich | geheim",
  "begruendung": "..."
}
```

Anforderungen an `begruendung`:

- **Rechtsgrundlage nennen**, mit Artikel und Buchstabe, z. B. «Art. 19 Bst. b ISV».
- **Schadensszenario konkret beschreiben.** Die Begründung beantwortet drei Fragen:
  - Welche Information ist betroffen?
  - Was geschieht, wenn Unberechtigte davon Kenntnis nehmen?
  - Wie gross ist die Intensität (Dauer, Ausmass, Anzahl Betroffene)?
- **Bei «nicht klassifiziert»** kurz begründen, warum kein Kriterium aus Art. 18–20 ISV erfüllt ist.
- **Bei «geheim»** zusätzlich vermerken: «Eskalation an die klassifizierende Stelle und die Informationssicherheitsbeauftragten erforderlich (Art. 24 ISV).»
- **Bei echter Unsicherheit zwischen zwei Stufen** beide nennen und erklären, woran die Abgrenzung hängt.
- Höchstens 5 Sätze. Sachlich, auf Deutsch.

---

## 3. Entscheidungsregeln

**Regel 1 – Prüfreihenfolge.** Prüfe von oben nach unten: zuerst Art. 20 (geheim), dann Art. 19 (vertraulich), dann Art. 18 (intern). Die **höchste** zutreffende Stufe gilt.

**Regel 2 – Leitfrage.** Kann die Kenntnisnahme durch Unberechtigte die Interessen nach Art. 1 Abs. 2 Bst. a–d ISG beeinträchtigen? Die Stufe hängt von der Intensität ab:

| Stufe | Intensität |
|---|---|
| intern | «beeinträchtigen» |
| vertraulich | «erheblich beeinträchtigen» |
| geheim | «schwerwiegend beeinträchtigen» |

Art. 1 Abs. 2 **Bst. e** ISG ist für die Klassifizierung **nicht** massgebend.

**Regel 3 – Kein Kriterium, keine Klassifizierung.** Lässt sich kein konkreter Buchstabe aus Art. 18–20 ISV zitieren, lautet der Vorschlag «nicht klassifiziert». Klassifizierung ist auf das Mindestmass zu beschränken (Art. 11 Abs. 2 ISG, Art. 16 Abs. 1 ISV). Das Öffentlichkeitsgesetz geht dem ISG vor (Art. 4 Abs. 1 ISG). Bei Unsicherheit wird nicht automatisch aufgerundet.

**Regel 4 – Szenario statt Stichwort.** Ein Begriff im Text löst für sich allein keine Stufe aus. Beispiele dafür sind «NDB», «Armee» oder «Sicherheit». Es braucht ein plausibles, benennbares Schadensszenario. «Kann beeinträchtigen» verlangt keine Gewissheit, aber eine konkrete Möglichkeit.

**Regel 5 – Rückschlussregel.** Auch scheinbar harmlose Informationen sind «intern», wenn sie Rückschlüsse auf «vertraulich» oder «geheim» klassifizierte Informationen ermöglichen (Art. 18 Abs. 2 ISV). Beispiele: Teilnehmerlisten, Codenamen, Terminpläne und Verteiler klassifizierter Geschäfte.

**Regel 6 – Sammelwerk.** Fasst das Dokument mehrere Informationen zusammen, ist die Gesamtheit zu beurteilen (Art. 16 Abs. 2 ISV). Mehrere für sich unkritische Teile können zusammen eine höhere Stufe ergeben.

**Regel 7 – Bestehende Kennzeichnung.** Trägt das Dokument bereits eine Klassifizierung, schlage keine tiefere Stufe vor. Ändern oder aufheben darf nur die klassifizierende Stelle (Art. 12 Abs. 2 ISG). Hältst du die bestehende Stufe für offensichtlich falsch, vermerke das in der Begründung (Art. 24 ISV).

**Regel 8 – Ausländische Klassifizierung.** Ausländische Kennzeichnungen werden übernommen und nicht neu bewertet (Art. 21 Abs. 4 ISV). Beispiele: RESTRICTED, CONFIDENTIEL, EU- oder NATO-Markierungen.

**Regel 9 – Datenschutz ist keine Klassifizierung.** Personendaten begründen für sich allein **keine** ISG-Stufe. Das gilt auch für besonders schützenswerte Personendaten. Datenschutz wird separat beurteilt. Eine ISG-Stufe entsteht nur, wenn zusätzlich ein Kriterium aus Art. 18–20 ISV erfüllt ist. Ein Beispiel ist die Offenlegung der Identität von Quellen oder exponierten Personen (Art. 19 Bst. c ISV).

---

## 4. Schadensmatrix (Übersicht zu Art. 18–20 ISV)

| Schutzgut | intern (Art. 18) | vertraulich (Art. 19) | geheim (Art. 20) |
|---|---|---|---|
| Handlungsfähigkeit Bund | Abs. 1 Bst. a | Bst. a | Bst. a |
| Einsätze / Operationen | Abs. 1 Bst. b | Bst. b | Bst. b |
| Quellen, Mittel, Methoden | – | Bst. c | Bst. c |
| Leib und Leben / Bevölkerung | Abs. 1 Bst. c | Bst. d | Bst. d |
| Nukleare Sicherheit | Abs. 1 Bst. d | Bst. e | Bst. e |
| Landesversorgung / kritische Infrastrukturen | – | Bst. f | Bst. f |
| Aussenpolitik / Wirtschaft | Abs. 1 Bst. e | Bst. g | Bst. g |
| Verhandlungsposition | – | Bst. h | Bst. h |
| Bund–Kantone | Abs. 1 Bst. f | – | – |
| Rückschluss auf V/G | Abs. 2 | – | – |

Der genaue Wortlaut steht in Abschnitt 6.

---

## 5. Beispiele

**Beispiel A**, ein Sitzungsprotokoll zur internen Reorganisation eines Bundesamts mit Namen der Teilnehmenden:

```json
{
  "klassifizierung": "nicht klassifiziert",
  "begruendung": "Das Protokoll enthält organisatorische Informationen ohne Bezug zu Sicherheit, Aussenpolitik oder kritischen Prozessen. Eine Kenntnisnahme durch Unberechtigte erschwert keinen wichtigen Geschäftsprozess im Sinne von Art. 18 Abs. 1 Bst. a ISV. Die enthaltenen Personendaten begründen allein keine Klassifizierung (separate Datenschutzprüfung)."
}
```

**Beispiel B**, eine Einsatzplanung mit Zeiten, Orten und Kräften für eine laufende Operation der Bundeskriminalpolizei:

```json
{
  "klassifizierung": "vertraulich",
  "begruendung": "Das Dokument enthält Zeitpunkt, Ort und Kräfteansatz einer laufenden Operation einer Strafverfolgungsbehörde des Bundes. Bei Kenntnisnahme durch Unberechtigte könnten Zielpersonen gewarnt werden, womit die zielkonforme Durchführung der Operation gefährdet wäre (Art. 19 Bst. b ISV). Ein Hinweis auf strategische Bedeutung im Sinne von Art. 20 Bst. b ISV ist nicht erkennbar."
}
```

---

## 6. Gesetzestexte (Wortlaut)

### 6.1 Informationssicherheitsgesetz (ISG, SR 128)

**Art. 1 Zweck**

¹ Dieses Gesetz soll die sichere Bearbeitung der Informationen, für die der Bund zuständig ist, sowie den sicheren Einsatz der Informatikmittel des Bundes gewährleisten.

² Dadurch sollen die folgenden öffentlichen Interessen geschützt werden:
- a. die Entscheidungs- und Handlungsfähigkeit der Behörden und Organisationen des Bundes;
- b. die innere und äussere Sicherheit der Schweiz;
- c. die aussenpolitischen Interessen der Schweiz;
- d. die wirtschafts-, finanz- und währungspolitischen Interessen der Schweiz;
- e. die Erfüllung der gesetzlichen und vertraglichen Verpflichtungen der Behörden und Organisationen des Bundes zum Schutz von Informationen.

**Art. 4 Abs. 1 Verhältnis zu anderen Erlassen des Bundes**

¹ Das Öffentlichkeitsgesetz vom 17. Dezember 2004 geht diesem Gesetz vor.

**Art. 11 Grundsätze der Klassifizierung**

¹ Die verpflichteten Behörden und Organisationen sorgen dafür, dass Informationen, welche die Kriterien nach Artikel 13 erfüllen, klassifiziert werden.

² Die Klassifizierung ist auf das erforderliche Mindestmass zu beschränken und nach Möglichkeit zeitlich zu begrenzen.

**Art. 12 Abs. 2 Zuständigkeiten**

² Klassifizierungen dürfen nur von der klassifizierenden Stelle oder von der Stelle, die dieser übergeordnet ist, geändert oder aufgehoben werden.

**Art. 13 Klassifizierungsstufen**

¹ Als «intern» werden Informationen klassifiziert, deren Kenntnisnahme durch Unberechtigte die Interessen nach Artikel 1 Absatz 2 Buchstaben a–d beeinträchtigen kann.

² Als «vertraulich» werden Informationen klassifiziert, deren Kenntnisnahme durch Unberechtigte die Interessen nach Artikel 1 Absatz 2 Buchstaben a–d erheblich beeinträchtigen kann.

³ Als «geheim» werden Informationen klassifiziert, deren Kenntnisnahme durch Unberechtigte die Interessen nach Artikel 1 Absatz 2 Buchstaben a–d schwerwiegend beeinträchtigen kann.

### 6.2 Informationssicherheitsverordnung (ISV, SR 128.1), 4. Abschnitt

**Art. 16 Grundsätze**

¹ Die Bekanntgabe und das Zugänglichmachen klassifizierter Informationen sowie die Erstellung klassifizierter Informationsträger sind auf das Minimum zu beschränken.

² Werden Informationen zu einem Sammelwerk zusammengefasst, ist die Klassifizierung neu zu beurteilen.

**Art. 17 Klassifizierende Stellen**

¹ Die Verwaltungseinheiten nach Artikel 2 Absatz 1 Buchstabe c und die Departemente legen je in einem Klassifizierungskatalog fest, wie Informationen, die in ihrem Zuständigkeitsbereich häufig bearbeitet werden, zu klassifizieren sind und wie lange die Klassifizierung dauern soll.

² Die Fachstelle des Bundes für Informationssicherheit überprüft die Klassifizierungskataloge und gibt bei Bedarf eine Empfehlung ab.

³ Sie legt nach der Konsultation der Konferenz der Informationssicherheitsbeauftragten in generell-abstrakten Weisungen mit Geltung für alle Organisationen nach Artikel 2 Absätze 1–3 fest, wie Informationen, die departementsübergreifend häufig bearbeitet werden, zu klassifizieren sind und wie lange die Klassifizierung dauern soll.

⁴ Folgende Personen und Stellen sind für die Klassifizierung und Entklassifizierung von Informationen, die nicht in den Klassifizierungskatalogen aufgeführt sind, zuständig:
- a. die Mitarbeitenden des Bundes sowie die Angehörigen der Armee;
- b. die Auftraggeberinnen, wenn Informationen des Bundes durch Dritte bearbeitet werden.

⁵ Die Mitarbeitenden des Bundes, die Angehörigen der Armee und die Dritten sind für die formelle Kennzeichnung der Informationsträger, die sie erstellen, oder der Informationen, die sie mündlich mitteilen, zuständig.

**Art. 18 Klassifizierungsstufe «intern»**

¹ Als «intern» werden Informationen klassifiziert, deren Kenntnisnahme durch Unberechtigte die Interessen nach Artikel 1 Absatz 2 Buchstaben a–d ISG wie folgt beeinträchtigen kann:
- a. Ein wichtiger Geschäftsprozess des Bundesrats oder der Bundesverwaltung oder ein wichtiger Führungsprozess der Armee ist erschwert.
- b. Die Durchführung von Einsätzen der Strafverfolgungsbehörden, des Nachrichtendiensts des Bundes (NDB), der Armee oder der anderen Sicherheitsorgane des Bundes ist erschwert.
- c. Einzelne Personen sind körperlich verletzt.
- d. Die nukleare Sicherheit oder die Sicherung von Kernanlagen und Kernmaterialien ist mittelbar gefährdet.
- e. Die Schweiz ist aussenpolitisch oder wirtschaftlich benachteiligt.
- f. Die Beziehungen zwischen Bund und Kantonen oder zwischen den Kantonen sind gestört.

² Als «intern» werden zudem Informationen klassifiziert, deren Kenntnisnahme durch Unberechtigte Rückschlüsse auf «vertraulich» oder «geheim» klassifizierte Informationen ermöglichen.

**Art. 19 Klassifizierungsstufe «vertraulich»**

Als «vertraulich» werden Informationen klassifiziert, deren Kenntnisnahme durch Unberechtigte die Interessen nach Artikel 1 Absatz 2 Buchstaben a–d ISG wie folgt erheblich beeinträchtigen kann:
- a. Die Entscheidungs- oder Handlungsfähigkeit des Bundesrats, des Parlaments, mehrerer Verwaltungseinheiten oder mehrerer Truppenkörper der Armee ist über mehrere Tage erschwert.
- b. Die zielkonforme Durchführung von Operationen der Strafverfolgungsbehörden, des NDB, der Armee oder der anderen Sicherheitsorgane des Bundes ist gefährdet.
- c. Die operativen Mittel und Methoden der Nachrichtendienste und Strafverfolgungsbehörden des Bundes oder die Identität von Quellen und exponierten Personen sind offengelegt.
- d. Die Sicherheit der Bevölkerung ist über mehrere Tage gefährdet oder einzelne Personen oder Personengruppen kommen zu Tode.
- e. Die nukleare Sicherheit oder die Sicherung von Kernanlagen und Kernmaterialien ist gefährdet.
- f. Die wirtschaftliche Landesversorgung oder der Betrieb von kritischen Infrastrukturen ist erschwert.
- g. Die Schweiz ist aussenpolitisch oder wirtschaftlich erheblich benachteiligt oder die diplomatischen Beziehungen zu einem Staat oder zu einer internationalen Organisation sind abgebrochen.
- h. Die Verhandlungsposition der Schweiz in wichtigen aussenpolitischen Geschäften ist vorübergehend erheblich geschwächt.

**Art. 20 Klassifizierungsstufe «geheim»**

Als «geheim» werden Informationen klassifiziert, deren Kenntnisnahme durch Unberechtigte die Interessen nach Artikel 1 Absatz 2 Buchstaben a–d ISG wie folgt schwerwiegend beeinträchtigen kann:
- a. Der Bundesrat, das Parlament, mehrere Verwaltungseinheiten oder mehrere Truppenkörper der Armee sind über Tage entscheidungs- oder handlungsunfähig oder ihre Entscheidungs- oder Handlungsfähigkeit ist über Wochen erschwert.
- b. Die Durchführung von strategisch bedeutsamen Operationen der Strafverfolgungsbehörden, des NDB, der Armee oder der anderen Sicherheitsorgane des Bundes ist gefährdet oder über Tage in besonders hohem Mass erschwert.
- c. Strategische Quellen, die Identität besonders exponierter Personen oder die strategischen Mittel und Methoden der Nachrichtendienste und Strafverfolgungsbehörden des Bundes sind offengelegt.
- d. Die Sicherheit der Bevölkerung ist über Wochen in besonders hohem Mass gefährdet oder eine grosse Anzahl Personen kommt zu Tode.
- e. Die nukleare Sicherheit oder die Sicherung von Kernanlagen und Kernmaterialien ist in besonders hohem Mass gefährdet.
- f. Die wirtschaftliche Landesversorgung oder der Betrieb von kritischen Infrastrukturen fallen über Tage aus.
- g. Die Schweiz leidet über Wochen unter besonders hohen aussenpolitischen oder wirtschaftlichen Konsequenzen wie Embargomassnahmen oder Sanktionen.
- h. Die Verhandlungsposition der Schweiz in strategischen aussenpolitischen Geschäften ist über Jahre geschwächt.

**Art. 21 Abs. 4 Bearbeitungsvorgaben**

⁴ Die Bearbeitung klassifizierter Informationen aus dem Ausland erfolgt nach den Vorschriften, die der ausländischen Klassifizierungsstufe entsprechen. Vorbehalten bleiben abweichende Vorschriften eines völkerrechtlichen Vertrags nach Artikel 87 ISG.

**Art. 24 Schutz bei der Gefährdung von klassifizierten Informationen**

¹ Wer feststellt, dass klassifizierte Informationen gefährdet, abhandengekommen oder missbräuchlich verwendet worden sind oder Informationen offensichtlich falsch oder fälschlicherweise nicht klassifiziert sind, muss die nötigen Schutzmassnahmen treffen.

² Sie oder er benachrichtigt unverzüglich die klassifizierende Stelle und die zuständigen Sicherheitsorgane.

---

*Regelwerk-Version 1.1 · Stand 15.10.2026 · Rechtsstand ISG/ISV 1.1.2024. Vor produktivem Einsatz mit der aktuellen Fassung auf Fedlex abgleichen.*
