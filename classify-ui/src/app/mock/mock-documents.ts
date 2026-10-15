import {type DemoSample, demoSamples} from './demo-samples';

/** Supported file extensions of the workbench upload (see spec requirement). */
export const demoSampleExtensions: readonly string[] = [
	'pdf',
	'docx',
	'md',
	'txt'
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
	md: 'B16',
	txt: 'B16'
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
