// Simulated demo data for the document-review workbench.
// All documents and findings are synthetic sample content for the review flow. The fixture
// content stays German because it represents uploaded document content, not UI text
// (see design.md D5). The ISG proposal levels are restricted to the three proposal-capable
// levels; "geheim" is never proposed (see design.md fixture discipline).

export type IsgLevel = 'none' | 'internal' | 'confidential';

export type DsgKind = 'none' | 'personal' | 'sensitive' | 'profiling' | 'profiling_high';

export type EvidenceScope = 'isg' | 'dsg';

export interface DemoEvidence {
	page: number;
	para?: number;
	quote: string;
	scopes: EvidenceScope[];
}

export interface DemoDistribution {
	readonly none: number;
	readonly internal: number;
	readonly confidential: number;
}

export interface DemoImageData {
	header: string;
	title: string;
	sign: string;
	paras: readonly string[];
}

export interface DemoSample {
	id: string;
	file: string;
	type: string;
	pages: number;
	durationSeconds: number;
	tag: string;
	/** Simulated ISG proposal (level, confidence and distribution). */
	level: IsgLevel;
	confidence: number;
	distribution: DemoDistribution;
	/** Simulated DSG assessment. */
	dsgKind: DsgKind;
	dsgConfidence: number;
	justification: string;
	evidence: DemoEvidence[];
	text: DemoImageData;
}

const trustDocSample: DemoSample = {
	id: 'B07',
	file: 'B07_vertrauensaerztliche_beurteilung.docx',
	type: 'docx',
	pages: 2,
	durationSeconds: 4.2,
	tag: 'Gesundheit',
	level: 'confidential',
	confidence: 0.87,
	distribution: {none: 0.03, internal: 0.1, confidential: 0.87},
	dsgKind: 'sensitive',
	dsgConfidence: 0.95,
	justification:
		'Das Dokument enthält eine vertrauensärztliche Beurteilung mit Diagnose- und Prognoseangaben zu einer bestimmbaren ' +
		'Mitarbeiterin im Rahmen eines Personalverfahrens. Eine unbefugte Kenntnisnahme kann den Interessen der betroffenen ' +
		'Person und des Bundes erheblichen Schaden zufügen. «Intern» würde den Zugriff innerhalb der Bundesverwaltung zu ' +
		'weit öffnen; «nicht klassifiziert» scheidet wegen des hohen Schutzbedarfs aus.',
	evidence: [
		{page: 1, para: 2, quote: 'Diagnose und Prognose', scopes: ['isg', 'dsg']},
		{page: 2, para: 1, quote: 'Arbeitsfähigkeit: 50 %', scopes: ['dsg']},
		{page: 2, para: 3, quote: 'vertraulich und ausschliesslich für die Personalmedizin', scopes: ['isg']}
	],
	text: {
		header: 'Bundesamt für [Amt] · Personalmedizin',
		title: 'Vertrauensärztliche Beurteilung',
		sign: 'Dr. med. [Name], Vertrauensärztin · 14. Oktober 2026',
		paras: [
			'Betreffend: Frau M. S., geb. 1981, Personal-Nr. 48 112, Fachspezialistin, Beschäftigungsgrad 80 %.',
			'Auftrag der Personalabteilung vom 2. Oktober 2026: Beurteilung der Arbeitsfähigkeit und allfälliger Massnahmen zur Wiedereingliederung.',
			'[[Diagnose und Prognose: Die Beschwerden bestehen seit Mai 2026; der Verlauf ist unter Therapie stabil, eine vollständige Erholung ist innerhalb von sechs Monaten wahrscheinlich.]]',
			'[[Arbeitsfähigkeit: 50 % ab 1. November 2026, Steigerung auf 80 % voraussichtlich per 1. Januar 2027.]] Empfohlene Massnahmen: reduzierte Präsenzpflicht, Verzicht auf Pikettdienst, Standortgespräch nach acht Wochen.',
			'Diese Beurteilung ist [[vertraulich und ausschliesslich für die Personalmedizin sowie die zuständige HR-Fachperson bestimmt.]]'
		]
	}
};

const payrollSample: DemoSample = {
	id: 'B22',
	file: 'B22_lohnliste_informatik_q3.csv',
	type: 'csv',
	pages: 1,
	durationSeconds: 1.9,
	tag: 'Personalfinanzen',
	level: 'confidential',
	confidence: 0.82,
	distribution: {none: 0.02, internal: 0.16, confidential: 0.82},
	dsgKind: 'personal',
	dsgConfidence: 0.99,
	justification:
		'Strukturierte Personendaten zu Lohn und Lohnklasse von 48 Mitarbeitenden. Keine besonders schützenswerte Kategorie ' +
		'nach Art. 5 lit. c DSG, aber hohes Schadenpotenzial bei Bekanntwerden – daher «vertraulich» statt «intern». ' +
		'Umfangreiche Bearbeitung: DSFA-Pflicht prüfen.',
	evidence: [
		{page: 1, para: 1, quote: 'Name; Personal-Nr.; Lohnklasse; Bruttolohn; Zulagen; Abzüge', scopes: ['isg']},
		{page: 1, para: 2, quote: 'M. S.; 48 112; LK 18; 9\'420.00', scopes: ['dsg', 'isg']}
	],
	text: {
		header: 'Export Personalinformationssystem · Abteilung Informatik',
		title: 'Lohnliste Q3/2026 (CSV-Auszug)',
		sign: '48 Datensätze · Export vom 14. Oktober 2026',
		paras: [
			'[[Name; Personal-Nr.; Lohnklasse; Bruttolohn; Zulagen; Abzüge]]',
			'[[M. S.; 48 112; LK 18; 9\'420.00; 240.00; 1\'980.50]]',
			'R. K.; 47 881; LK 22; 11\'860.00; 0.00; 2\'410.20',
			'… 45 weitere Datensätze'
		]
	}
};

const offerSample: DemoSample = {
	id: 'A03',
	file: 'A03_offerte_rz_erweiterung_los2.xlsx',
	type: 'xlsx',
	pages: 3,
	durationSeconds: 3.6,
	tag: 'Beschaffung',
	level: 'internal',
	confidence: 0.73,
	distribution: {none: 0.08, internal: 0.73, confidential: 0.19},
	dsgKind: 'personal',
	dsgConfidence: 0.62,
	justification:
		'Offertunterlagen mit Preisen und Kalkulationsgrundlagen eines Anbieters im laufenden Ausschreibungsverfahren. ' +
		'Beschaffungsgeheimnis bis zum Zuschlag. Eine Einstufung als «vertraulich» wäre vertretbar, solange die ' +
		'Zuschlagskriterien nicht publiziert sind — darum nur 73 % für «intern».',
	evidence: [
		{page: 2, para: 1, quote: 'Gesamtpreis CHF 1\'840\'000 exkl. MwSt.', scopes: ['isg']},
		{page: 1, para: 3, quote: 'Kontakt: P. Meier, Key Account', scopes: ['dsg']}
	],
	text: {
		header: 'Anbieter [Firma AG] · Offerte',
		title: 'Offerte Rechenzentrum-Erweiterung, Los 2 – Übersicht',
		sign: 'Blatt 1 von 3 · Angebot vom 10. Oktober 2026',
		paras: [
			'Ausschreibung BES-2026-0092, Los 2: Lieferung und Installation von Rack- und Kühlinfrastruktur für den Standort Bern.',
			'[[Kontakt: P. Meier, Key Account]] · [[Angebot gültig bis 30.11.2026]]',
			'Blatt 2 – Preisübersicht: [[Gesamtpreis CHF 1\'840\'000 exkl. MwSt.]], davon Hardware CHF 1\'210\'000, Installation CHF 380\'000, Wartung 5 Jahre CHF 250\'000.',
			'Blatt 3 – Annahmen und Kalkulationsgrundlagen (vertraulich gegenüber Mitbewerbern).'
		]
	}
};

const networkSample: DemoSample = {
	id: 'A07',
	file: 'A07_netzwerkplan_bern_intern.pdf',
	type: 'pdf',
	pages: 3,
	durationSeconds: 3.3,
	tag: 'Technik',
	level: 'confidential',
	confidence: 0.76,
	distribution: {none: 0.01, internal: 0.23, confidential: 0.76},
	dsgKind: 'none',
	dsgConfidence: 0.93,
	justification:
		'Netzwerkdiagramm mit internen IP-Bereichen, Hostnamen und Firewall-Zonen. Technische Geheimnisse — eine Offenlegung ' +
		'erleichtert Angriffe auf die Infrastruktur und kann dem Bund erheblichen Schaden zufügen. Keine Personendaten.',
	evidence: [
		{page: 2, para: 1, quote: '10.42.0.0/16 – Zone Intern', scopes: ['isg']},
		{page: 3, para: 2, quote: 'fw-bern-01.intern.admin.ch', scopes: ['isg']}
	],
	text: {
		header: 'BIT · Netzwerkbetrieb',
		title: 'Netzwerkplan Standort Bern – Zone Intern',
		sign: 'Netzwerkbetrieb · Stand Oktober 2026',
		paras: [
			'Übersicht der Netzzonen am Standort Bern mit Übergängen zur Zone DMZ und zur Zone Management.',
			'Adressierung: [[10.42.0.0/16 – Zone Intern]], 10.43.0.0/16 – Zone Management, 172.16.8.0/22 – DMZ.',
			'Perimeter: [[fw-bern-01.intern.admin.ch]] (aktiv) und fw-bern-02.intern.admin.ch (Standby), Regelwerk-Release 2026.4.'
		]
	}
};

const protocolSample: DemoSample = {
	id: 'B08',
	file: 'B08_amtsleitung_sitzungsprotokoll.docx',
	type: 'docx',
	pages: 4,
	durationSeconds: 3.1,
	tag: 'Sitzung',
	level: 'internal',
	confidence: 0.79,
	distribution: {none: 0.12, internal: 0.79, confidential: 0.09},
	dsgKind: 'personal',
	dsgConfidence: 0.91,
	justification:
		'Internes Sitzungsprotokoll mit Traktanden, Beschlüssen und Namen der Teilnehmenden. Keine besonders schützenswerten ' +
		'Personendaten. Traktandum 4 erwähnt eine geplante WTO-Ausschreibung — vor der Publikation beschaffungsrechtlich ' +
		'relevant, darum «intern» und nicht «nicht klassifiziert».',
	evidence: [
		{page: 1, para: 1, quote: 'Anwesend: B. Keller (Vorsitz)', scopes: ['dsg']},
		{page: 3, para: 4, quote: 'Die WTO-Ausschreibung Q1/2027 wird vorbereitet', scopes: ['isg']}
	],
	text: {
		header: 'Bundesamt für [Amt] · Amtsleitung',
		title: 'Protokoll der Amtsleitungssitzung vom 7. Oktober 2026',
		sign: 'Für das Protokoll: S. Rossi · 8. Oktober 2026',
		paras: [
			'[[Anwesend: B. Keller (Vorsitz), M. Favre, L. Bernasconi, R. Keller, S. Rossi (Protokoll). Entschuldigt: A. Muster.]]',
			'Traktandum 1 – Genehmigung des Protokolls vom 23. September 2026: einstimmig genehmigt.',
			'Traktandum 2 – Stand Projekt Koby Classify: Pilot in zwei Organisationseinheiten läuft; Zwischenbericht an die GL bis Ende November.',
			'Traktandum 4 – Beschaffung Rechenzentrum-Erweiterung: [[Die WTO-Ausschreibung Q1/2027 wird vorbereitet; Zuschlagskriterien sind noch nicht publiziert.]] Die Unterlagen bleiben bis zur Publikation intern.'
		]
	}
};

const draftSample: DemoSample = {
	id: 'A15',
	file: 'A15_jahresbericht_2026_kap3_entwurf.docx',
	type: 'docx',
	pages: 8,
	durationSeconds: 4.8,
	tag: 'Entwurf',
	level: 'none',
	confidence: 0.58,
	distribution: {none: 0.58, internal: 0.4, confidential: 0.02},
	dsgKind: 'none',
	dsgConfidence: 0.9,
	justification:
		'Entwurf eines zur Publikation bestimmten Berichts. Bis zur Freigabe gilt der Entwurf als intern, danach ist er ' +
		'nicht klassifiziert. Die Confidence ist entsprechend tief — die Fachstelle entscheidet, ob der Entwurfsstatus ' +
		'massgebend ist.',
	evidence: [
		{page: 1, para: 1, quote: 'ENTWURF – nicht zur Weitergabe', scopes: ['isg']},
		{page: 4, para: 2, quote: 'Im Berichtsjahr wurden 1\'204 Gesuche', scopes: ['isg']}
	],
	text: {
		header: 'Bundesamt für [Amt] · Kommunikation',
		title: 'Jahresbericht 2026 – Kapitel 3: Digitalisierung',
		sign: 'Entwurf 0.4 · 14. Oktober 2026',
		paras: [
			'[[ENTWURF – nicht zur Weitergabe]]',
			'[[Im Berichtsjahr wurden 1\'204 Gesuche]] vollständig digital bearbeitet; die mittlere Durchlaufzeit sank um 18 Prozent.',
			'Der Pilot zur KI-gestützten Klassifizierung zeigte eine Übereinstimmung von 91 Prozent zwischen Vorschlag und menschlicher Entscheidung.'
		]
	}
};

const faqSample: DemoSample = {
	id: 'B16',
	file: 'B16_FAQ_Datenschutz.pdf',
	type: 'pdf',
	pages: 6,
	durationSeconds: 2.4,
	tag: 'Publikation',
	level: 'none',
	confidence: 0.94,
	distribution: {none: 0.94, internal: 0.05, confidential: 0.01},
	dsgKind: 'none',
	dsgConfidence: 0.97,
	justification:
		'Allgemein gehaltene Fragen und Antworten zum Datenschutz ohne Personendaten oder interne Details. Das Dokument ist ' +
		'zur Veröffentlichung im Intranet und auf der Website bestimmt — kein Schutzbedarf nach Art. 6 ISG.',
	evidence: [{page: 1, para: 1, quote: 'Diese FAQ richten sich an alle Mitarbeitenden', scopes: ['isg']}],
	text: {
		header: 'Bundesamt für [Amt] · Kommunikation',
		title: 'FAQ Datenschutz für Mitarbeitende',
		sign: 'Datenschutzberatung · Version 3.0 · Oktober 2026',
		paras: [
			'[[Diese FAQ richten sich an alle Mitarbeitenden und erklären in einfacher Sprache, was das revidierte Datenschutzgesetz (DSG) für die tägliche Arbeit bedeutet.]]',
			'Was sind Personendaten? Alle Angaben, die sich auf eine bestimmte oder bestimmbare natürliche Person beziehen – zum Beispiel Name, E-Mail-Adresse oder Personalnummer.',
			'Was sind besonders schützenswerte Personendaten? Daten über Gesundheit, religiöse oder politische Ansichten, genetische und biometrische Daten sowie Daten über straf- und verwaltungsrechtliche Verfahren.',
			'An wen wende ich mich bei Fragen? An die Datenschutzberatung des Amtes oder an die oder den Datenschutzberater des Departements.'
		]
	}
};

export const demoSamples: readonly DemoSample[] = [
	trustDocSample,
	payrollSample,
	offerSample,
	networkSample,
	protocolSample,
	draftSample,
	faqSample
];
