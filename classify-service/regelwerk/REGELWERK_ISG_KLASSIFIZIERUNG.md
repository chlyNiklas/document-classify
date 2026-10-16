# Policy Pack ISG/ISV – Dokumentklassifizierung

> Zweck: Kompakte Entscheidungsgrundlage für den Teil `isg_isv` der API-Antwort.
> Quellen: ISG (SR 128), https://www.fedlex.admin.ch/eli/cc/2022/232/de · ISV
> (SR 128.1), https://www.fedlex.admin.ch/eli/cc/2023/735/de
> Fachlich und rechtlich vor einem produktiven Einsatz freigeben und versionieren.

## Aufgabe

Schlage genau eine Informationsklassifizierung vor. Die Klassifizierung betrifft die möglichen
Folgen einer Kenntnisnahme durch Unberechtigte. Personendaten spielen für die ISG/ISV-Klassifizierung
keine Rolle: Ob ein Dokument Personendaten enthält und wie schützenswürdig diese sind, ist für die
ISG/ISV-Stufe unbeachtlich und wird ausschliesslich im DSG-Teil der API-Antwort beurteilt.
Datenschutzbefunde allein erzeugen keine ISG/ISV-Klassifizierung.

Zulässige Werte:

- `nicht klassifiziert`
- `intern`
- `vertraulich`
- `geheim`

## Kernregeln

1. Prüfe zuerst `geheim`, danach `vertraulich`, danach `intern`. Die höchste nachweisbar
   zutreffende Stufe gilt.
2. Ein Schlagwort oder Dokumenttyp genügt nicht. Benenne die Information, die konkrete Folge der
   Offenlegung und deren Intensität, Dauer oder Ausmass.
3. Ist kein konkretes Kriterium aus Art. 18–20 ISV erfüllt, wähle `nicht klassifiziert`.
4. Die Klassifizierung ist auf das erforderliche Mindestmass zu beschränken (Art. 11 Abs. 2 ISG).
5. Mehrere Informationen sind auch in ihrer Kombination zu beurteilen (Art. 16 Abs. 2 ISV).
6. Informationen, die Rückschlüsse auf vertrauliche oder geheime Informationen erlauben, sind
   mindestens intern (Art. 18 Abs. 2 ISV).
7. Eine bestehende Klassifizierung darf nicht herabgesetzt werden. Eine offensichtlich falsche
   Kennzeichnung löst eine Überprüfung und gegebenenfalls Eskalation aus (Art. 12 Abs. 2 ISG,
   Art. 24 ISV).
8. Ausländische Klassifizierungen werden nach Art. 21 Abs. 4 ISV übernommen.
9. Bei fehlendem Kontext trotzdem den am besten belegten zulässigen Wert ausgeben, die Unsicherheit
   und die fehlende Information in `reasons` nennen und nicht automatisch aufrunden.

## Schwellenwerte

Art. 13 ISG definiert die Intensität:

- `intern`: Kenntnisnahme kann die geschützten Interessen beeinträchtigen.
- `vertraulich`: Kenntnisnahme kann sie erheblich beeinträchtigen.
- `geheim`: Kenntnisnahme kann sie schwerwiegend beeinträchtigen.

Massgebend sind die Interessen nach Art. 1 Abs. 2 Bst. a–d ISG:

- Entscheidungs- und Handlungsfähigkeit der Behörden und Organisationen des Bundes;
- innere und äussere Sicherheit der Schweiz;
- aussenpolitische Interessen der Schweiz;
- wirtschafts-, finanz- und währungspolitische Interessen der Schweiz.

## Kriterien `intern` – Art. 18 ISV

`intern`, wenn die Offenlegung insbesondere:

- einen wichtigen Geschäftsprozess des Bundesrats oder der Bundesverwaltung oder einen wichtigen
  Führungsprozess der Armee erschweren kann (Abs. 1 Bst. a);
- Einsätze von Strafverfolgungsbehörden, NDB, Armee oder anderen Sicherheitsorganen erschweren
  kann (Bst. b);
- zur körperlichen Verletzung einzelner Personen führen kann (Bst. c);
- nukleare Sicherheit oder Kernanlagen mittelbar gefährden kann (Bst. d);
- die Schweiz aussenpolitisch oder wirtschaftlich benachteiligen kann (Bst. e);
- Beziehungen zwischen Bund und Kantonen oder zwischen Kantonen stören kann (Bst. f);
- Rückschlüsse auf vertrauliche oder geheime Informationen ermöglicht (Abs. 2).

## Kriterien `vertraulich` – Art. 19 ISV

`vertraulich`, wenn die Offenlegung insbesondere:

- die Entscheidungs- oder Handlungsfähigkeit mehrerer Bundesstellen über mehrere Tage erschwert
  (Bst. a);
- die zielkonforme Durchführung einer Operation der Sicherheitsorgane gefährdet (Bst. b);
- operative Mittel oder Methoden oder die Identität von Quellen oder exponierten Personen
  offenlegt (Bst. c);
- die Bevölkerung über mehrere Tage gefährdet oder zum Tod einzelner Personen oder Gruppen führen
  kann (Bst. d);
- nukleare Sicherheit oder Kernanlagen gefährdet (Bst. e);
- Landesversorgung oder kritische Infrastrukturen erschwert (Bst. f);
- die Schweiz aussenpolitisch oder wirtschaftlich erheblich benachteiligt (Bst. g);
- eine wichtige aussenpolitische Verhandlungsposition vorübergehend erheblich schwächt (Bst. h).

## Kriterien `geheim` – Art. 20 ISV

`geheim`, wenn die Offenlegung insbesondere:

- zentrale Bundesorgane über Tage handlungsunfähig macht oder über Wochen erheblich erschwert
  (Bst. a);
- strategisch bedeutsame Operationen gefährdet oder besonders stark erschwert (Bst. b);
- strategische Quellen, besonders exponierte Personen oder strategische Mittel und Methoden
  offenlegt (Bst. c);
- die Bevölkerung über Wochen besonders stark gefährdet oder zum Tod einer grossen Anzahl
  Personen führen kann (Bst. d);
- nukleare Sicherheit in besonders hohem Mass gefährdet (Bst. e);
- Landesversorgung oder kritische Infrastrukturen über Tage ausfallen lässt (Bst. f);
- über Wochen besonders hohe aussenpolitische oder wirtschaftliche Konsequenzen verursacht
  (Bst. g);
- eine strategische aussenpolitische Verhandlungsposition über Jahre schwächt (Bst. h).

Bei `geheim` muss eine Begründung die Formulierung enthalten, dass eine Eskalation an die
klassifizierende Stelle und die Informationssicherheitsbeauftragten erforderlich ist. In
`legal_basis` ist zusätzlich Art. 24 ISV zu nennen.

## Ausgabeanforderungen

- `reasons`: ein bis fünf kurze, konkrete Begründungen auf Deutsch.
- `legal_basis`: mindestens eine präzise Referenz mit Artikel und Erlass.
- Wenn eine tragende Tatsache oder die Intensität nicht zuverlässig aus dem Dokument hervorgeht,
  Regeln kollidieren oder eine Kennzeichnung offensichtlich falsch wirkt, muss dies ausdrücklich in
  `reasons` stehen.
- Jeder Vorschlag muss durch die zuständige Person rechtlich und fachlich geprüft werden.
