# Ground Truth – Dokumententypen

## Übersicht

Der Ground-Truth-Datensatz umfasst 100 synthetische Testdokumente aus 24 Dokumenttypen. Die Dokumente orientieren sich an typischen Geschäftsprozessen der Schweizer Bundesverwaltung.

Ziel ist die Überprüfung einer KI-gestützten Analyse von Dokumenten hinsichtlich:

- Informationsklassifizierung nach ISG und ISV
- Erkennung von Personendaten nach DSG
- Erkennung besonders schützenswerter Personendaten
- Indirekter Identifizierbarkeit natürlicher Personen
- Möglichkeit einer umfassenden Persönlichkeitsbeurteilung
- Hinweisen auf Profiling
- Erkennung von Unsicherheiten und fehlendem Kontext

Die Dokumente liegen in den Formaten PDF, DOCX und TXT vor.

Die rechtlichen Soll-Ergebnisse werden separat in Ground-Truth-Dateien dokumentiert und müssen fachlich validiert werden.

## Dokumenttypen

### DOC-01 – Öffentliche Medienmitteilung
Offizielle Mitteilungen über öffentliche Projekte, Veranstaltungen oder Entscheidungen. Dienen insbesondere als Negativtests für die Informationsklassifizierung. Können Namen und Funktionen von Behördenvertretern enthalten, ohne dass daraus automatisch ein besonderer Schutzbedarf entsteht.

### DOC-02 – Allgemeines Sitzungsprotokoll
Protokolle von Besprechungen mit Teilnehmenden, Traktanden, Beschlüssen und Pendenzen. Enthalten gewöhnliche Personendaten und unterschiedliche geschäftliche Informationen. Testen die kontextabhängige Beurteilung gemischter Inhalte.

### DOC-03 – Interne Aktennotiz
Interne Aufzeichnungen zu administrativen, organisatorischen oder personellen Sachverhalten. Besonders geeignet zur Prüfung indirekter Identifizierbarkeit und unvollständiger Informationen über mögliche Offenlegungsfolgen.

### DOC-04 – Projektantrag / Projektauftrag
Dokumente zur Initialisierung und Genehmigung von Projekten. Enthalten Projektziele, Verantwortlichkeiten, Zeitpläne, Ressourcen und finanzielle Angaben. Testen die Berücksichtigung des organisatorischen Kontexts und die Zuordnung zu Klassifizierungskatalogen.

### DOC-05 – Statusbericht / Lagebericht
Periodische Berichte über Projektfortschritte, Betriebszustände oder organisatorische Entwicklungen. Können aggregierte Informationen enthalten, deren Kombination einen erhöhten Schutzbedarf begründet.

### DOC-06 – Managementbericht / Entscheidungsnotiz
Entscheidungsgrundlagen für Führungspersonen mit Zusammenfassungen, Bewertungen und Handlungsempfehlungen. Testen insbesondere die Ableitung schutzrelevanter Informationen aus mehreren Dokumentabschnitten.

### DOC-07 – Budget- und Finanzbericht
Berichte über Budgets, Ausgaben, Finanzplanung und Mittelverwendung. Testen die Unterscheidung zwischen gewöhnlichen Finanzinformationen und Angaben, deren Offenlegung gesetzlich geschützte Interessen beeinträchtigen könnte.

### DOC-08 – Beschaffungsunterlagen / Offerte
Ausschreibungsunterlagen, Angebote und Beschaffungsbewertungen. Enthalten geschäftliche Informationen, Lieferantenkontakte und möglicherweise schutzwürdige Angebotsdetails. Testen die Anwendung einschlägiger Klassifizierungskataloge.

### DOC-09 – Vertragsentwurf / Vereinbarung
Entwürfe und Vereinbarungen mit rechtlichen, organisatorischen oder geschäftlichen Regelungen. Testen insbesondere die Unterscheidung zwischen vertraglichen Vertraulichkeitsverpflichtungen und einer gesetzlichen Informationsklassifizierung.

### DOC-10 – Personalverzeichnis / Kontaktliste
Verzeichnisse mit Namen, Funktionen, Organisationseinheiten und Kontaktdaten. Dienen der Erkennung gewöhnlicher Personendaten, direkter Identifikatoren und möglicher Verknüpfungsschlüssel.

### DOC-11 – Personalbeurteilung / Leistungsbericht
Dokumente zur Bewertung von Arbeitsleistung, Kompetenzen und beruflicher Entwicklung. Testen die Unterscheidung zwischen gewöhnlichen Personendaten, besonders schützenswerten Personendaten und Informationen, die eine umfassende Persönlichkeitsbeurteilung ermöglichen könnten.

### DOC-12 – Gesundheits- oder Absenzenakte
Unterlagen zu gesundheitsbedingten Abwesenheiten, Arbeitsfähigkeit und medizinischen Sachverhalten. Dienen insbesondere der Erkennung besonders schützenswerter Personendaten und indirekter Identifizierbarkeit.

### DOC-13 – Rekrutierungs- und Bewerbungsdossier
Bewerbungsunterlagen mit Lebensläufen, Qualifikationen, Referenzen und persönlichen Bewertungen. Testen die Erkennung unterschiedlicher Personendatenkategorien innerhalb eines Dokuments.

### DOC-14 – Statistik / anonymisierter Bericht
Statistische Auswertungen ohne unmittelbar erkennbare personenbezogene Angaben. Testen die Wirksamkeit der Anonymisierung, Risiken der Reidentifizierung und die Vermeidung falsch positiver Personendatenbefunde.

### DOC-15 – Umfrage- und Befragungsauswertung
Auswertungen von Mitarbeiter- oder Organisationsbefragungen. Können aggregierte Resultate und Freitextantworten enthalten. Testen indirekte Identifizierbarkeit, mögliche Profiling-Hinweise und Risiken kleiner Auswertungsgruppen.

### DOC-16 – Systemarchitektur / technische Systemdokumentation
Beschreibungen von IT-Systemen, Komponenten, Schnittstellen und technischen Abhängigkeiten. Testen die Beurteilung sicherheitsrelevanter Informationen auch ohne enthaltene Personendaten.

### DOC-17 – Schwachstellenbericht / Penetrationstest
Technische Berichte über identifizierte Sicherheitslücken und deren mögliche Ausnutzung. Testen die Bewertung potenzieller Offenlegungsfolgen und die kontextabhängige Informationsklassifizierung.

### DOC-18 – Sicherheitsvorfall / Incident-Report
Berichte über Informationssicherheitsvorfälle mit Ereignisabläufen, technischen Befunden und betroffenen Systemen. Können technische Informationen und Personendaten kombinieren. Testen die getrennte Beurteilung beider Dimensionen.

### DOC-19 – Berechtigungs- und Zugriffsübersicht
Dokumentationen von Benutzerkonten, Rollen, Zugriffsrechten und Systemberechtigungen. Testen die Erkennung von Personenidentifikatoren und die sicherheitsrelevante Kombination verschiedener Informationen.

### DOC-20 – Audit- und Prüfbericht
Ergebnisse interner oder externer Prüfungen mit Feststellungen, Kontrollschwächen und Empfehlungen. Testen die Bewertung möglicher Offenlegungsfolgen, rechtlicher Zusammenhänge und Informationen über Dritte.

### DOC-21 – Verwaltungs- oder Strafverfahrensakte
Unterlagen zu Verwaltungsverfahren, strafrechtlichen Untersuchungen oder behördlichen Entscheidungen. Dienen insbesondere der Erkennung besonders schützenswerter Personendaten und der Berücksichtigung des Verfahrenskontexts.

### DOC-22 – Korrespondenz / E-Mail-Export
Schriftverkehr zwischen Personen und Organisationseinheiten. Enthält häufig mehrere Beteiligte, zitierte Nachrichten und gemischte Inhalte. Testet insbesondere die korrekte Interpretation von Zitaten und die Widerstandsfähigkeit gegen Prompt Injection.

### DOC-23 – Datenexport / textbasierte Fallliste
Strukturierte oder halbstrukturierte Datensammlungen mit Identifikatoren, Fallinformationen und verschiedenen Attributen. Testen die Verknüpfung von Datensätzen, indirekte Identifizierbarkeit und mögliche Persönlichkeitsbeurteilungen.

### DOC-24 – Weisung / Richtlinie / Arbeitshilfe
Normative oder erläuternde Dokumente zu internen Prozessen und Regelungen. Testen insbesondere, ob das System zwischen beschriebenen Klassifizierungsregeln und der tatsächlichen Klassifizierung des vorliegenden Dokuments unterscheiden kann.

## Testdimensionen

### Datenschutz
- Keine Personendaten
- Gewöhnliche Personendaten
- Besonders schützenswerte Personendaten
- Direkte und indirekte Identifizierbarkeit
- Reidentifizierungsrisiken
- Möglichkeit einer umfassenden Persönlichkeitsbeurteilung
- Hinweise auf Profiling
- Unzureichender Bearbeitungskontext

### Informationssicherheit
- Nicht klassifiziert
- INTERN
- VERTRAULICH
- Nicht abschliessend beurteilbar
- Anwendung von Klassifizierungskatalogen
- Ausnahmen und besondere Bedingungen
- Kombination unterschiedlicher Informationsarten

### Robustheit
- Irreführende Klassifizierungskennzeichnungen
- Prompt Injection
- Widersprüchliche Dokumentabschnitte
- Versteckte oder unvollständig extrahierte Inhalte
- Unterschiedliche sprachliche Formulierungen
- Informationsverknüpfung über mehrere Abschnitte

## Grundsätze

1. Der Dokumenttyp allein bestimmt keine Informationsklassifizierung.
2. Datenschutzbeurteilung und Informationsklassifizierung erfolgen unabhängig voneinander.
3. Positive Befunde müssen durch konkrete Fundstellen belegbar sein.
4. Fehlender Kontext muss als solcher ausgewiesen werden.
5. Die Ground Truth wird fachlich und juristisch validiert.
6. Sämtliche Testdokumente enthalten ausschliesslich synthetische Personen und Organisationen.
7. Klassifizierungskataloge und Rechtsgrundlagen werden versioniert referenziert.
