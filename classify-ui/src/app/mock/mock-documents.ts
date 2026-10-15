import {type DemoSample, demoSamples} from './demo-samples';

/** Supported file extensions of the workbench upload (see spec requirement). */
export const demoSampleExtensions: readonly string[] = [
	'pdf',
	'docx',
	'doc',
	'xlsx',
	'xls',
	'csv',
	'txt',
	'md',
	'eml',
	'msg',
	'ics',
	'xml',
	'pptx',
	'rtf',
	'odt',
	'png',
	'jpg',
	'jpeg',
	'tif',
	'tiff'
];

export type {DemoSample};

export function getDemoSample(id: string): DemoSample {
	return demoSamples.find(sample => sample.id === id) ?? demoSamples[0];
}

/** Ordered single-file upload name → sample mapping rules (ported from the prototype rules). */
const nameRules: readonly (readonly [RegExp, string])[] = [
	[/lohn|sal[aä]r|gehalt|salary|payroll|entsch[aä]dig/iu, 'B22'],
	[/arzt|[aä]rzt|medizin|diagnos|gesundheit|krank|attest|iv-|unfall|health|medical/iu, 'B07'],
	[/fallkonferenz|wiedereingliederung|case-?conf/iu, 'B07'],
	[/offert|angebot|ausschreib|beschaff|wto|preis|kalkulation|offer|tender|quote/iu, 'A03'],
	[/netz|network|firewall|server|host|infra|topolog|ip-|vlan|dmz|zugang|rollen|berechtigung/iu, 'A07'],
	[/protokoll|sitzung|minutes|traktand|meeting/iu, 'B08'],
	[/entwurf|draft|jahresbericht|bericht|report/iu, 'A15'],
	[/faq|merkblatt|flyer|brosch|brochure|website|publik|intranet/iu, 'B16']
];

const defaultSampleByExtension: Readonly<Record<string, string>> = {
	pdf: 'B16',
	docx: 'B08',
	doc: 'B08',
	xlsx: 'A03',
	xls: 'A03',
	csv: 'B22',
	txt: 'B16',
	md: 'B16',
	eml: 'B07',
	msg: 'B07',
	ics: 'B08',
	xml: 'B08',
	pptx: 'B08',
	rtf: 'B08',
	odt: 'B08',
	png: 'A07',
	jpg: 'A07',
	jpeg: 'A07',
	tif: 'A07',
	tiff: 'A07'
};

/** Maps an uploaded file name to the sample whose content the simulated analysis is based on. */
export function mapFileNameToSample(fileName: string, fileExtension: string): string {
	const base = fileName.replace(/\.[^.]+$/u, '').replace(/[_.-]+/gu, ' ');
	for (const [pattern, sampleId] of nameRules) {
		if (pattern.test(base)) {
			return sampleId;
		}
	}
	return defaultSampleByExtension[fileExtension] ?? 'B08';
}
