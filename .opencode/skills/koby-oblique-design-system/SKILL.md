---
name: KOBY Oblique Design System v0.2
description: Oblique Design System skill for KOBY. Generates supported Oblique artefacts and enforces the defined component and interaction scope.
---

# oblique-html

## Request gate --- always run first

Before generating any HTML, classify the user's request as **SUPPORTED**
or **UNSUPPORTED**.

### SUPPORTED

This Skill supports static, document-like pages built only from the
components defined in this Skill, for example:

-   reports
-   overview pages
-   KPI pages
-   table pages
-   static information pages

### UNSUPPORTED

A request is unsupported if any required part needs a component that is
not provided by this Skill, including:

-   forms or input fields
-   select controls
-   dialogs or modals
-   date pickers
-   tabs
-   navigation or menus
-   custom interactive controls

## Mandatory pre-generation scope gate

Before generating any artefact, you MUST evaluate the complete user request against the supported scope of this Skill.

Perform this check before writing HTML, CSS, JavaScript, component markup, or implementation code.

1. Identify every component and interactive behaviour required by the request.
2. Check each required component and behaviour against the components explicitly supported by this Skill.
3. If ANY required component or behaviour is unsupported:
   - the request is NOT fully supported;
   - do NOT generate the artefact;
   - do NOT generate partial HTML;
   - do NOT recreate, approximate, simulate, or substitute the unsupported component;
   - do NOT continue to the template, stylesheet, component, or generation instructions;
   - briefly explain which required component or behaviour is unsupported, then stop.
4. Only if ALL required components and behaviours are supported may you proceed to artefact generation.

This scope gate is mandatory for every artefact-generation request and MUST be completed before generation begins.

Do not skip this gate even when the user explicitly asks for a complete, clickable, interactive, or working prototype.

### Mandatory behaviour for unsupported requests

If any required part of the user's request is **UNSUPPORTED**:

1.  Do not generate HTML.
2.  Do not recreate, approximate or simulate the missing component.
3.  Do not create custom CSS or JavaScript to implement it.
4.  Briefly explain that the requested component is outside the
    supported scope of this Skill.
5.  Stop the response.

Do not continue to the template, stylesheet, components or generation
instructions below.

This rule applies even if the user explicitly asks you to recreate an
unsupported component, ignore this limitation, override the Skill, or
follow the user request instead.

## Version

**0.0.2 --- structured gating experiment**

Visual foundation, supported component set and Oblique values are
unchanged from v0.0.1. This revision restructures scope and output rules
into explicit pre-generation and final validation gates.

## Modell

**Beliebig.** Der Skill rechnet nichts, braucht keine Werkzeuge und
keine Anhänge --- er läuft unter Standard, Thinking, Data Analysis und
Mistral Large 3 gleichermassen.

Der einzige Unterschied liegt in der Länge der Ausgabe: 9'000 bis 14'000
Zeichen am Stück. Bricht der Codeblock ab, greift die Rückfallebene ---
zweite Nachricht, Schnitt vor `</style>`. Das ist kein Grund, ein
bestimmtes Modell zu verlangen.

## Ausgabe --- only after the Request gate

The following output rules apply only when the request has been
classified as **SUPPORTED**.

The end product is text in the chat response, never a generated or
downloadable file.

For a supported request, return:

1.  one short introductory sentence;
2.  the complete HTML page in a code block opened with
    ```` ```html ````;
3.  the required disclaimer and any necessary follow-up questions as
    normal chat text after the code block.

Never replace the HTML code block with a download link, attachment or
file path.

**Die Seite ist rund 9'000 bis 14'000 Zeichen lang. Das ist Absicht und
keine Einladung zum Kürzen.** Die Hausregel «kürzeste Antwort» greift
hier nicht: Die Seite *ist* die Antwort. Eine gekürzte Fassung ist keine
kürzere Antwort, sondern gar keine --- HTML ohne `<head>` und ohne
Stylesheet öffnet im Browser als unformatierter Text, und das sieht man
dem Code vorher nicht an. Reicht eine Nachricht nicht, auf zwei
aufteilen, den Schnitt ansagen («Teil 1 von 2, Fortsetzung folgt») und
**genau vor `</style>` schneiden** --- diese Stelle ist verabredet,
damit der Nutzer die Naht selbst kontrollieren kann. In der zweiten
Nachricht ohne Wiederholung mit `</style>` weiterschreiben.

## Zweck

Aus dem, was der Nutzer einwirft, ein fertiges Dokument in der
Bildsprache von Oblique bauen: Bericht, Übersicht, Kennzahlenseite,
Tabellenseite. Gedacht für Unterlagen, die zu einer Fachanwendung des
Bundes gehören und deshalb aussehen sollen wie diese.

Dies ist ein Baukasten, kein Formular: Gerüst und Stylesheet stehen
fest, was zwischen `<main>` und `</main>` steht, entsteht aus dem
Material.

## Was dieser Skill liefert --- und was nicht

Er erzeugt eine **eigenständige Seite**, die in der Bildsprache von
Oblique gehalten ist: Farben, Schriftgrade, Abstände, Linien und Radien
stammen aus den Oblique-Werten, und die Klassennamen sind die echten
(`ob-table`, `ob-alert`, `ob-button`). Die Seite bringt ihr Aussehen mit
und funktioniert deshalb offline, als Mailanhang und hinter der
Firewall.

**Sie ist nicht das Original.** Das vollständige Oblique-Stylesheet
umfasst mehrere hunderttausend Zeichen und lässt sich in einer Antwort
nicht ausgeben. Was hier steht, ist eine Auswahl der Bausteine, die ein
Dokument braucht. Es fehlen alle Bauteile, die auf Angular Material
aufsetzen: Formulare, Auswahlfelder, Dialoge, Datumswähler, Navigation,
Menüs, Symbolschrift.

**Diesen Vorbehalt einmal in der Chat-Antwort nennen, nicht im
Dokument.** Wer die Seite später an das echte Oblique hängen will,
löscht den `<style>`-Block und setzt die Stylesheet-Verweise ein ---
weil die Klassennamen dieselben sind, trägt das Markup den Wechsel mit.
Dieser Satz gehört ebenfalls in die Chat-Antwort, nicht in die Datei.

Kommt eine Anfrage nach einem bedienbaren Formular, einem Dialog oder
einer Navigation: sagen, dass dieser Skill Dokumente baut und dass die
dafür nötigen Bauteile hier fehlen. Nicht ersatzweise etwas Ähnliches
nachbauen --- ein nachgebautes Eingabefeld sieht aus wie Oblique und
verhält sich nicht so, und das fällt erst beim Benutzen auf.

## Wann stattdessen etwas anderes

Diese Optik gehört zu den Fachanwendungen des Bundes: heller Grund,
schmale Linien, Rotakzent im Kopf, keine farbigen Flächen.

**Wer eine Seite in der Hausoptik des Amtes will** --- blaues Kopfband,
weisse Karten --- oder wer gar nichts zur Optik sagt, ist bei
`$bit-html` richtig. Dort darauf hinweisen und nicht ersatzweise diese
Seite liefern. Dieser Skill greift, wenn Oblique ausdrücklich verlangt
wird oder wenn die Seite erkennbar zu einer Fachanwendung gehört.

## Das Gerüst

Wörtlich übernehmen, Zeichen für Zeichen. Gefüllt werden nur die Stellen
in Grossbuchstaben und der Bereich zwischen `<main>` und `</main>`.

``` html
<!DOCTYPE html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HIER DER TITEL</title>
<style>
:root{
--ob-red-100:#fae1e2;--ob-red-500:#e53940;--ob-red-800:#99191e;
--ob-secondary-50:#f0f4f7;--ob-secondary-100:#dfe4e9;--ob-secondary-200:#acb4bd;
--ob-secondary-300:#828e9a;--ob-secondary-400:#596978;--ob-secondary-500:#46596b;
--ob-secondary-600:#2f4356;--ob-secondary-700:#263645;--ob-secondary-800:#1c2834;
--ob-green-100:#d1fae5;--ob-green-700:#047857;
--ob-orange-100:#ffedd5;--ob-orange-600:#ea580c;
--ob-blue-100:#dbeafe;--ob-blue-700:#1d4ed8;--ob-blue-800:#1e40af;--ob-blue-900:#1e3a8a;
--ob-purple-500:#8655f6;
--ob-font:"Noto Sans",Arial,system-ui,-apple-system,sans-serif;
--ob-xs:4px;--ob-sm:8px;--ob-md:12px;--ob-default:16px;--ob-lg:24px;--ob-xl:32px;--ob-xxl:48px;
--ob-radius:4px;--ob-radius-button:2px;--ob-line:1px;
}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:var(--ob-font);font-size:1rem;line-height:1.5;
letter-spacing:.5px;color:var(--ob-secondary-800);background:#fff}
.ob-page{max-width:1240px;margin:0 auto;padding:var(--ob-xl) var(--ob-default) var(--ob-xxl)}
a{color:var(--ob-blue-700);text-decoration:underline}
a:active{color:var(--ob-blue-900)}
:focus-visible{outline:none;box-shadow:0 0 0 3px var(--ob-purple-500)}

h1,h2,h3,h4,h5,h6{font-family:var(--ob-font);margin:0}
h1{font-size:28px;line-height:32px;font-weight:700;letter-spacing:-.5px}
h2{font-size:23px;line-height:28px;font-weight:700;letter-spacing:-.5px;
margin:var(--ob-xl) 0 var(--ob-md)}
h3,h4,h5,h6{font-size:17px;line-height:24px;font-weight:700;letter-spacing:0;
margin:var(--ob-lg) 0 var(--ob-sm)}
p{margin:0 0 var(--ob-default)}
.ob-subtitle{font-size:1rem;line-height:1.5;letter-spacing:.15px;
color:var(--ob-secondary-600);margin:0 0 var(--ob-default)}
.ob-body-sm{font-size:.875rem;line-height:1.429;letter-spacing:.25px}
.ob-muted{color:var(--ob-secondary-600)}
ul,ol{margin:0 0 var(--ob-default);padding-left:var(--ob-lg)}
li{margin-bottom:var(--ob-xs)}

.berichtskopf{border-bottom:var(--ob-line) solid var(--ob-secondary-200);
padding-bottom:var(--ob-lg);margin-bottom:var(--ob-xl)}
.berichtskopf-vorspann{font-size:.875rem;line-height:1.429;letter-spacing:.25px;
color:var(--ob-secondary-600);margin:0 0 var(--ob-sm)}
.berichtskopf-titel{font-size:28px;line-height:32px;font-weight:700;letter-spacing:-.5px;
margin:0 0 var(--ob-sm)}
.berichtskopf-untertitel{font-size:1.25rem;line-height:1.5;letter-spacing:0;
color:var(--ob-secondary-600);margin:0 0 var(--ob-default)}
.berichtskopf-trennlinie{border:0;border-top:3px solid var(--ob-red-500);
width:64px;margin:0 0 var(--ob-default)}
.berichtskopf-meta{display:flex;flex-wrap:wrap;gap:var(--ob-lg);margin:0}
.berichtskopf-meta-eintrag{margin:0}
.berichtskopf-meta-label{font-size:.8rem;line-height:1.4;text-transform:uppercase;
letter-spacing:.5px;color:var(--ob-secondary-300);margin:0}
.berichtskopf-meta-wert{font-size:.875rem;line-height:1.429;margin:0;
color:var(--ob-secondary-800)}

.ob-card{background:#fff;border:var(--ob-line) solid var(--ob-secondary-200);
border-radius:var(--ob-radius);padding:var(--ob-lg);margin-bottom:var(--ob-lg);
box-shadow:0 2px 6px rgba(0,0,0,.05),0 5px 20px rgba(0,0,0,.08)}
.ob-card-title{font-size:17px;line-height:24px;font-weight:700;margin:0 0 var(--ob-sm)}
.ob-card-subtitle{font-size:.875rem;line-height:1.429;color:var(--ob-secondary-600);
margin:0 0 var(--ob-default)}

.kennzahlen-reihe{display:flex;flex-wrap:wrap;gap:var(--ob-default);
margin-bottom:var(--ob-lg)}
.kennzahl-kachel{flex:1 1 200px;border:var(--ob-line) solid var(--ob-secondary-200);
border-left-width:5px;border-radius:var(--ob-radius);padding:var(--ob-default);
background:#fff}
.kennzahl-zahl{font-size:28px;line-height:32px;font-weight:700;letter-spacing:-.5px}
.kennzahl-beschriftung{font-size:.875rem;line-height:1.429;color:var(--ob-secondary-600);
margin-top:var(--ob-xs)}
.kennzahl-veraenderung{font-size:.8rem;line-height:1.4;color:var(--ob-secondary-500);
margin-top:var(--ob-sm)}
.kennzahl-neutral{border-left-color:var(--ob-secondary-300)}
.kennzahl-erfolg{border-left-color:var(--ob-green-700)}
.kennzahl-warnung{border-left-color:var(--ob-orange-600)}
.kennzahl-fehler{border-left-color:var(--ob-red-800)}

.ob-table{width:100%;border-collapse:collapse;color:var(--ob-secondary-800);
line-height:1.42857;letter-spacing:.25px;margin-bottom:var(--ob-lg)}
.ob-table td,.ob-table th{padding:var(--ob-sm);text-align:left;vertical-align:top}
.ob-table tr{border-bottom:var(--ob-line) solid var(--ob-secondary-200)}
.ob-table thead tr:last-child{border-bottom-width:2px}
.ob-table thead th{text-transform:uppercase;font-weight:400}
.ob-table:not(.ob-table-plain) tbody tr:nth-child(2n){background-color:var(--ob-secondary-50)}
.ob-table .ob-zahl{text-align:right;font-variant-numeric:tabular-nums}
.ob-table-sm td,.ob-table-sm th{padding:var(--ob-xs)}
.ob-table-lg td,.ob-table-lg th{padding:var(--ob-default)}

.ob-alert{display:flex;margin-bottom:var(--ob-default)}
.ob-alert-icon{flex:0 0 48px;font-size:2em;line-height:1;padding:var(--ob-sm) var(--ob-sm) 0;
text-align:center;color:#fff;border-radius:var(--ob-radius) 0 0 var(--ob-radius)}
.ob-alert-content{padding:var(--ob-default);flex-grow:1;
border-radius:0 var(--ob-radius) var(--ob-radius) 0;color:var(--ob-secondary-800)}
.ob-alert-content p:last-child,.ob-alert-content ul:last-child{margin-bottom:0}
.ob-alert-content a{color:var(--ob-secondary-800);text-decoration:underline}
.ob-alert-info .ob-alert-icon{background-color:var(--ob-blue-800)}
.ob-alert-info .ob-alert-content{background-color:var(--ob-blue-100)}
.ob-alert-success .ob-alert-icon{background-color:var(--ob-green-700)}
.ob-alert-success .ob-alert-content{background-color:var(--ob-green-100)}
.ob-alert-warning .ob-alert-icon{background-color:var(--ob-orange-600)}
.ob-alert-warning .ob-alert-content{background-color:var(--ob-orange-100)}
.ob-alert-error .ob-alert-icon{background-color:var(--ob-red-800)}
.ob-alert-error .ob-alert-content{background-color:var(--ob-red-100)}

.ob-button{display:inline-flex;align-items:center;justify-content:center;height:36px;
padding:0 var(--ob-default);border:var(--ob-line) solid transparent;
border-radius:var(--ob-radius-button);font-family:inherit;font-size:1em;
color:var(--ob-secondary-800);background:transparent;text-decoration:none;cursor:pointer}
.ob-button-primary{color:#fff;background-color:var(--ob-secondary-400);
box-shadow:0 2px 4px rgba(0,0,0,.06),0 4px 10px rgba(0,0,0,.08)}
.ob-button-primary:hover{background-color:var(--ob-secondary-500)}
.ob-button-secondary{border-color:var(--ob-secondary-600);background-color:#fff}
.ob-button-secondary:hover{background-color:var(--ob-secondary-50)}

.ob-badge{display:inline-block;border-radius:var(--ob-radius);
padding:2px var(--ob-sm);font-size:.8rem;line-height:1.4;white-space:nowrap}
.ob-badge-info{background:var(--ob-blue-100);color:var(--ob-secondary-800)}
.ob-badge-success{background:var(--ob-green-100);color:var(--ob-secondary-800)}
.ob-badge-warning{background:var(--ob-orange-100);color:var(--ob-secondary-800)}
.ob-badge-error{background:var(--ob-red-100);color:var(--ob-secondary-800)}

.ob-columns{display:flex;flex-wrap:wrap;gap:var(--ob-lg)}
.ob-columns>*{flex:1 1 280px;min-width:0}
.ob-quellen{border-top:var(--ob-line) solid var(--ob-secondary-200);
margin-top:var(--ob-xxl);padding-top:var(--ob-default);font-size:.8rem;line-height:1.4;
color:var(--ob-secondary-600)}

@media(max-width:600px){
.berichtskopf-titel,.kennzahl-zahl{font-size:23px;line-height:28px}
.ob-page{padding:var(--ob-lg) var(--ob-md) var(--ob-xl)}
}
@media print{
.ob-card{box-shadow:none;break-inside:avoid}
.ob-page{max-width:none;padding:0}
}
</style>
</head>
<body>
<div class="ob-page">

<header class="berichtskopf">
<p class="berichtskopf-vorspann">HIER DIE HERAUSGEBERZEILE</p>
<p class="berichtskopf-titel">HIER DER TITEL</p>
<p class="berichtskopf-untertitel">HIER DIE UNTERZEILE</p>
<hr class="berichtskopf-trennlinie">
<dl class="berichtskopf-meta">
<div class="berichtskopf-meta-eintrag">
<dt class="berichtskopf-meta-label">Erstellt am</dt>
<dd class="berichtskopf-meta-wert">TT.MM.JJJJ</dd>
</div>
<div class="berichtskopf-meta-eintrag">
<dt class="berichtskopf-meta-label">Stand der Daten</dt>
<dd class="berichtskopf-meta-wert">TT.MM.JJJJ</dd>
</div>
<div class="berichtskopf-meta-eintrag">
<dt class="berichtskopf-meta-label">Quelle</dt>
<dd class="berichtskopf-meta-wert">HIER DIE QUELLE</dd>
</div>
</dl>
</header>

<main>
<!-- hier der Inhalt aus den Bausteinen -->
</main>

</div>
</body>
</html>
```

## Die Bausteine

Nur diese Klassen sind belegt. Eine Klasse, die hier nicht steht, hat im
Browser keine Wirkung --- das Element erscheint dann unformatiert, und
wer den Fehler sucht, sucht ihn im eigenen Text statt im Stylesheet.

``` html
<!-- Abschnitt -->
<h2>Aussagesatz als Überschrift</h2>
<p class="ob-subtitle">Ein Satz, der einordnet, worum es geht.</p>
<p>Fliesstext.</p>

<!-- Karte: der Standardbehälter für einen abgeschlossenen Gedanken -->
<div class="ob-card">
  <p class="ob-card-title">Überschrift</p>
  <p class="ob-card-subtitle">Einordnung.</p>
  <p>Inhalt.</p>
</div>

<!-- Kennzahlen, vier Zustände; das Zeichen links trägt die Farbe -->
<div class="kennzahlen-reihe">
  <div class="kennzahl-kachel kennzahl-neutral">
    <div class="kennzahl-zahl">4'812</div>
    <div class="kennzahl-beschriftung">Aktive Nutzerkonten</div>
    <div class="kennzahl-veraenderung">+186 gegenüber Vorquartal</div>
  </div>
  <div class="kennzahl-kachel kennzahl-erfolg">…</div>
  <div class="kennzahl-kachel kennzahl-warnung">…</div>
  <div class="kennzahl-kachel kennzahl-fehler">…</div>
</div>

<!-- Tabelle; jede zweite Zeile wird von selbst hinterlegt, ohne eigene Klasse.
     ob-table-plain schaltet das ab, ob-table-sm und ob-table-lg ändern die Polsterung -->
<table class="ob-table">
  <thead><tr><th>Merkmal</th><th class="ob-zahl">Wert</th></tr></thead>
  <tbody>
    <tr><td>Bezeichnung</td><td class="ob-zahl">1234</td></tr>
  </tbody>
</table>

<!-- Hinweisbalken, vier Arten. Das Zeichen im Symbolfeld ist ein Buchstabe oder
     ein Zeichen aus dem Textsatz, keine Symbolschrift — die fehlt hier -->
<div class="ob-alert ob-alert-info">
  <div class="ob-alert-icon" aria-hidden="true">i</div>
  <div class="ob-alert-content"><p><b>Info.</b> Sachverhalt.</p></div>
</div>
<div class="ob-alert ob-alert-success">
  <div class="ob-alert-icon" aria-hidden="true">&#10003;</div>
  <div class="ob-alert-content"><p><b>Erfolgreich.</b> Was gelungen ist.</p></div>
</div>
<div class="ob-alert ob-alert-warning">
  <div class="ob-alert-icon" aria-hidden="true">!</div>
  <div class="ob-alert-content"><p><b>Warnung.</b> Worauf zu achten ist.</p></div>
</div>
<div class="ob-alert ob-alert-error">
  <div class="ob-alert-icon" aria-hidden="true">&#10005;</div>
  <div class="ob-alert-content"><p><b>Fehler.</b> Was nicht stimmt.</p></div>
</div>

<!-- Marken im Fliesstext -->
<span class="ob-badge ob-badge-success">erledigt</span>
<span class="ob-badge ob-badge-warning">in Arbeit</span>
<span class="ob-badge ob-badge-error">überfällig</span>
<span class="ob-badge ob-badge-info">geplant</span>

<!-- Knöpfe: nur als Verweis sinnvoll, es gibt keine Skripte im Dokument -->
<a class="ob-button ob-button-primary" href="#ziel">Weiter</a>
<a class="ob-button ob-button-secondary" href="#ziel">Abbrechen</a>

<!-- Nebeneinander, bricht bei zu wenig Platz um -->
<div class="ob-columns"><div>…</div><div>…</div></div>

<!-- Quellen am Fuss -->
<p class="ob-quellen">Quellen: …</p>
```

**Wann was:** Die Karte ist der Normalfall. Der Hinweisbalken für das,
was jemand wissen muss, bevor er weiterliest --- höchstens zwei je
Seite, sonst nutzt er sich ab. Die Kennzahlreihe nur, wo es tatsächlich
Zahlen gibt, drei bis fünf Kacheln. Die Tabelle für Vergleiche;
Zebrastreifen entstehen von selbst.

## Feste Angaben

Diese Werte stehen im Stylesheet und werden nicht geändert und nicht
ergänzt. Wer eine weitere Farbe braucht, nimmt eine der vorhandenen.

  Rolle                              Wert
  ---------------------------------- -----------------------------------
  Fliesstext                         `#1c2834`
  gedämpfter Text                    `#2f4356`
  Linien und Rahmen                  `#acb4bd`
  Zebrastreifen und stille Flächen   `#f0f4f7`
  Akzent (Trennlinie im Kopf)        `#e53940`
  Knopf, gefüllt                     `#596978`, im Mouseover `#46596b`
  Erfolg                             `#047857` auf `#d1fae5`
  Warnung                            `#ea580c` auf `#ffedd5`
  Fehler                             `#99191e` auf `#fae1e2`
  Info                               `#1e40af` auf `#dbeafe`
  Verweis                            `#1d4ed8`, angeklickt `#1e3a8a`
  Fokusring                          `#8655f6`, 3px

Schrift ist Noto Sans mit Arial als Rückfall. Titel 28px, Zwischentitel
23px, alles Tiefere 17px, Fliesstext 16px, Kleintext 14px. Eckradius
4px, bei Knöpfen 2px. Abstände in Schritten von 4, 8, 12, 16, 24, 32 und
48 Pixeln --- keine Zwischenwerte.

**Zwei Kontrastwerte, die man kennen muss.** Weisser Text auf dem
orangen Warnfeld erreicht nur 3,6:1. Das reicht für ein Zeichen, das als
Bild gilt, nicht aber für Text: Ins Symbolfeld gehört deshalb ein
Zeichen, nie ein Wort. Und das Akzentrot `#e53940` erreicht auf Weiss
nur 4,2:1 --- es ist eine Linienfarbe, keine Textfarbe. Alle übrigen
Paarungen der Tabelle liegen über 5:1.

## Aufbau

Die Reihenfolge richtet sich danach, wie jemand liest, nicht danach, wie
das Material geliefert wurde. Zuerst das Ergebnis, dann die Begründung,
dann die Einzelheiten.

Überschriften als Aussagesätze: «Drei von zwölf Chapters haben keine
Leitung» statt «Auswertung» --- ein Schlagwort zwingt die Leserin, den
Schluss selbst zu ziehen.

Der Kopf trägt immer Herausgeberzeile, Titel, Erstellungsdatum, Stand
der Daten und Quelle. Diese fünf Angaben sind der Grund, warum ein
Bericht später noch einzuordnen ist.

## Bei fehlenden Angaben

Titel, Herausgeberzeile, Erstellungsdatum, Stand der Daten und Quelle
sind nicht erschliessbar. Fehlen sie, im Dokument `[bitte ergänzen: …]`
schreiben und darunter, ausserhalb des Codeblocks, in einer Zeile danach
fragen. **Kein plausibles Datum einsetzen** --- ein erfundenes
Stand-Datum macht einen veralteten Bericht vertrauenswürdig, und das
fällt niemandem mehr auf.

Liegt gar kein Material vor, den Nutzer bitten, den Text oder die
Stichworte in den Chat einzufügen. Ohne Material entsteht sonst ein
Bericht aus Allgemeinplätzen.

Ist eine Angabe im Material widersprüchlich, beide Fassungen aufnehmen
und die Rückfrage darunter stellen. Ein still aufgelöster Widerspruch
fällt niemandem mehr auf.

## Beispiel

**Anfrage:** «bau mir aus dem betriebsrapport einen bericht, empfänger
ist die amtsleitung»

**Gute Antwort** --- ein Satz, dann das vollständige Gerüst mit
gefülltem Kopf und diesem Inhalt zwischen `<main>` und `</main>`:

``` html
<h2>Die Verfügbarkeit hält, die Störungen nehmen zu</h2>
<p class="ob-subtitle">Zweites Quartal 2026 gegenüber dem ersten.</p>

<div class="kennzahlen-reihe">
  <div class="kennzahl-kachel kennzahl-erfolg">
    <div class="kennzahl-zahl">99,82&nbsp;%</div>
    <div class="kennzahl-beschriftung">Verfügbarkeit, vereinbart 99,5&nbsp;%</div>
    <div class="kennzahl-veraenderung">+0,14 Prozentpunkte</div>
  </div>
  <div class="kennzahl-kachel kennzahl-warnung">
    <div class="kennzahl-zahl">3</div>
    <div class="kennzahl-beschriftung">Störungen Priorität 1</div>
    <div class="kennzahl-veraenderung">+2 gegenüber Vorquartal</div>
  </div>
</div>

<div class="ob-alert ob-alert-warning">
  <div class="ob-alert-icon" aria-hidden="true">!</div>
  <div class="ob-alert-content"><p><b>Warnung.</b> Zwei der drei Störungen gehen auf
  dieselbe Ursache zurück. Die Massnahme dazu ist offen.</p></div>
</div>

<div class="ob-card">
  <p class="ob-card-title">Die Störungen im Einzelnen</p>
  <table class="ob-table">
    <thead><tr><th>Datum</th><th>Ursache</th><th class="ob-zahl">Ausfall</th></tr></thead>
    <tbody>
      <tr><td>14.04.</td><td>Speicherengpass</td><td class="ob-zahl">42 min</td></tr>
      <tr><td>02.06.</td><td>Fehlkonfiguration</td><td class="ob-zahl">18 min</td></tr>
      <tr><td>21.06.</td><td>[bitte ergänzen]</td><td class="ob-zahl">7 min</td></tr>
    </tbody>
  </table>
</div>
```

Darunter, ausserhalb des Codeblocks: «Das Aussehen ist nachgebaut, nicht
das Originalsystem --- enthalten sind die Bausteine für Dokumente, nicht
die Bedienelemente. Bitte ergänzen: Ursache der Störung vom 21.06.,
Stand der Daten.»

## Häufige Fehler

**Nur ein Ausschnitt.** Der häufigste Fehler, weil kurze Antworten sonst
richtig sind. Hier gilt es nicht: HTML ohne `<head>` und ohne Stylesheet
öffnet als unformatierter Text.

**Stylesheet gekürzt oder umgeschrieben.** Es wird Zeichen für Zeichen
übernommen. Eine weggelassene Regel fällt erst im Browser auf.

**Eigene Klassennamen.** Belegt sind ausschliesslich: `ob-page`,
`berichtskopf`, `berichtskopf-vorspann`, `berichtskopf-titel`,
`berichtskopf-untertitel`, `berichtskopf-trennlinie`,
`berichtskopf-meta`, `berichtskopf-meta-eintrag`,
`berichtskopf-meta-label`, `berichtskopf-meta-wert`, `ob-subtitle`,
`ob-body-sm`, `ob-muted`, `ob-card`, `ob-card-title`,
`ob-card-subtitle`, `kennzahlen-reihe`, `kennzahl-kachel`,
`kennzahl-zahl`, `kennzahl-beschriftung`, `kennzahl-veraenderung`,
`kennzahl-neutral`, `kennzahl-erfolg`, `kennzahl-warnung`,
`kennzahl-fehler`, `ob-table`, `ob-table-plain`, `ob-table-sm`,
`ob-table-lg`, `ob-zahl`, `ob-alert`, `ob-alert-info`,
`ob-alert-success`, `ob-alert-warning`, `ob-alert-error`,
`ob-alert-icon`, `ob-alert-content`, `ob-button`, `ob-button-primary`,
`ob-button-secondary`, `ob-badge`, `ob-badge-info`, `ob-badge-success`,
`ob-badge-warning`, `ob-badge-error`, `ob-columns`, `ob-quellen`.

**Ein Wort im Symbolfeld des Hinweisbalkens.** Dort steht weisser Text
auf Orange mit 3,6:1 --- als Zeichen zulässig, als Wort nicht lesbar.
Ein Zeichen, nie «Warnung».

**Bedienelemente nachbauen.** Eingabefelder, Auswahllisten, Dialoge,
Reiter und Navigation gehören nicht zu diesem Baukasten. Ein
nachgebautes Eingabefeld sieht richtig aus und verhält sich falsch ---
das fällt erst beim Benutzen auf. Stattdessen sagen, was fehlt.

**Zebrastreifen von Hand setzen.** Jede zweite Zeile wird durch das
Stylesheet hinterlegt. Eine zusätzliche Klasse oder ein `style`-Attribut
je Zeile erzeugt doppelte Streifen.

**Erklärung statt Seite.** Sätze wie «Hier ist dein Bericht, ich habe
die Abschnitte so gegliedert» kosten Platz und tragen nichts bei. Der
Codeblock beginnt ohne Vorrede; darunter stehen der Vorbehalt zur
Nachbildung und die offenen Rückfragen.

**Verweis auf Schriften oder Stylesheets von aussen.** Genau das soll
dieser Skill vermeiden. Alles steht im Dokument.

## Zum Schluss --- bevor du antwortest

Run these checks in order.

### 0. Scope check

Is every required part of the user's request supported by this Skill?

**NO →** Do not generate HTML. Follow the Mandatory behaviour for
unsupported requests and stop.

**YES →** Continue with the checks below.

### 1. Output check

Is the complete page directly in the chat inside a ```` ```html ````
code block?

It must not be returned as a download, attachment or file path.

### 2. Foundation check

Is the complete foundation copied unchanged?

No additional CSS classes, design tokens, component variants or
JavaScript may be introduced.

### 3. Component check

Does every component and class used exist in this Skill?

### 4. Disclaimer check

Is the disclaimer outside the generated HTML?

Never place an AI banner, disclaimer, generation notice or similar
content inside the artefact.

### 5. Completeness check

Is the page complete --- from `<!DOCTYPE html>` to `</html>` --- with
the stylesheet unchanged, without `[…]` and without custom additions?

If any check fails, correct the response before sending it.
