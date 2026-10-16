# Policy Pack DSG – Erkennung und Kategorisierung von Personendaten

> Zweck: Kompakte Entscheidungsgrundlage für den Teil `dsg` der API-Antwort.
> Quelle: DSG (SR 235.1), insbesondere Art. 5,
> https://www.fedlex.admin.ch/eli/oc/2022/491/de
> Fachlich und rechtlich vor einem produktiven Einsatz freigeben und versionieren.

## Aufgabe und Grenze

Erkenne, ob das Dokument Personendaten oder besonders schützenswerte Personendaten enthält und ob
es Hinweise auf Profiling gibt. Diese Analyse ist unabhängig von der ISG/ISV-Klassifizierung.

Beurteile nicht abschliessend, ob eine Datenbearbeitung rechtmässig ist. Dafür wären insbesondere
Bearbeitungszweck, Rechtsgrundlage, Empfänger, Aufbewahrungsdauer und organisatorische sowie
technische Massnahmen erforderlich.

## Klassifikation

Wähle den höchsten im Dokument belegten Wert:

- `keine personendaten`: keine Angaben zu einer bestimmten oder bestimmbaren natürlichen Person.
- `personendaten`: Angaben zu mindestens einer bestimmten oder bestimmbaren natürlichen Person
  nach Art. 5 Bst. a DSG.
- `besonders schützenswerte personendaten`: mindestens eine Kategorie nach Art. 5 Bst. c DSG.

Ein Name ist nicht erforderlich. Eine Person kann auch durch Identifikatoren, Funktion, Ort,
Zeitpunkt oder die Kombination mehrerer Merkmale bestimmbar sein. Rein anonymisierte Angaben ohne
realistische Reidentifizierbarkeit sind keine Personendaten; blosse Pseudonymisierung hebt den
Personenbezug nicht automatisch auf.

Eine AHV-Nummer ist als Personenidentifikator unter `personendaten` zu erfassen. Sie ist für sich
allein keine Kategorie besonders schützenswerter Personendaten nach Art. 5 Bst. c DSG. Der übrige
Kontext kann jedoch eine solche Kategorie enthalten.

## Besonders schützenswerte Personendaten – Art. 5 Bst. c DSG

Erfasse als `besonders schützenswerte personendaten`:

1. religiöse, weltanschauliche, politische oder gewerkschaftliche Ansichten oder Tätigkeiten;
2. Gesundheit, Intimsphäre, Rasse oder Ethnie;
3. genetische Daten;
4. biometrische Daten, die eine natürliche Person eindeutig identifizieren;
5. verwaltungs- oder strafrechtliche Verfolgungen oder Sanktionen;
6. Massnahmen der sozialen Hilfe.

Verwende für Findings kurze `snake_case`-Typen, beispielsweise `name`, `contact_details`,
`ahv_number`, `health_data`, `political_views`, `genetic_data`, `identifying_biometric_data`,
`criminal_proceedings` oder `social_assistance_measures`. Gib keine Originalwerte oder sensiblen
Textpassagen aus.

## Profiling – Art. 5 Bst. f und g DSG

- `profiling` ist `erkannt`, wenn das Dokument eine automatisierte Bearbeitung von Personendaten
  beschreibt, die persönliche Aspekte bewertet, analysiert oder vorhersagt.
- `high_risk_profiling` ist `erkannt`, wenn eine solche automatisierte Verknüpfung eine Beurteilung
  wesentlicher Aspekte der Persönlichkeit erlaubt und ein hohes Risiko für Persönlichkeit oder
  Grundrechte mit sich bringt.
- Nutze `möglich` nur bei konkreten Hinweisen und fehlendem entscheidendem Kontext; nenne die
  Unsicherheit und die fehlende Information ausdrücklich in `reasons`.
- Eine manuell verfasste Personalbeurteilung oder eine umfangreiche Akte ist nicht allein deshalb
  Profiling. Entscheidend ist die automatisierte Bearbeitung im Sinne von Art. 5 Bst. f DSG.

## Deterministische Befunde

Befunde im Block `deterministische-befunde` wurden vom Service technisch validiert. Übernimm sie
in `findings` und berücksichtige sie in `classification`. Erhöhe ihre Anzahl nicht und ändere ihre
Kategorie nicht. Weitere semantische Findings dürfen anhand des Dokuments ergänzt werden.

## Ausgabeanforderungen

- `reasons`: ein bis fünf kurze, konkrete Begründungen auf Deutsch.
- `legal_basis`: mindestens eine präzise DSG-Referenz.
- `findings`: pro Befundtyp Kategorie und Anzahl, ohne Originalwerte.
- Bei `keine personendaten` muss `findings` leer sein und beide Profiling-Felder müssen
  `nicht erkannt` sein.
- Bei `besonders schützenswerte personendaten` muss mindestens ein Finding derselben Kategorie
  vorhanden sein.
- Wenn Identifizierbarkeit, Kategorie oder Profiling nicht zuverlässig aus dem Dokument hervorgeht,
  muss dies ausdrücklich in `reasons` stehen.
- Jeder Vorschlag muss durch die zuständige Person rechtlich und fachlich geprüft werden.

