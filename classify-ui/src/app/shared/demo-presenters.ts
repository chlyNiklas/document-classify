import type {DemoEvidence} from '../mock/demo-samples';

export interface PreviewSegment {
	text: string;
	marked: boolean;
	letter?: string;
}

export interface PreviewParagraph {
	segments: PreviewSegment[];
}

export interface EvidenceReference {
	letter: string;
	page: number;
	para?: number;
	quote: string;
}

const fractionDigitsValue = 1;  
const percentFactor = 100;  
const bytesPerMegabyte = 1024 * 1024; // eslint-disable-line @typescript-eslint/no-magic-numbers -- byte conversion
const bytesPerKilobyte = 1024;  
const letterMatchHeadLength = 16;  

/** Formats a confidence ratio as a rounded percentage label (e.g. "87 %"). */
export function confidenceValue(ratio: number): string {
	return `${Math.round(ratio * percentFactor)} %`;
}

/** Formats a byte size as KB/MB label with the Swiss decimal comma. */
export function fileSizeValue(bytes: number | null): string {
	if (bytes === null) {
		return '';
	}
	if (bytes >= bytesPerMegabyte) {
		return `${(bytes / bytesPerMegabyte).toFixed(fractionDigitsValue).replace('.', ',')} MB`;
	}
	return `${Math.max(1, Math.round(bytes / bytesPerKilobyte))} KB`;
}

/** The evidence of a scope list, letters come from the combined ISG + DSG lettering. */
export function evidenceByScope(evidence: readonly DemoEvidence[], scope: 'isg' | 'dsg'): DemoEvidence[] {
	return evidence.filter(entry => entry.scopes.includes(scope));
}

/** Evidence quote references (quote, marker letter) for a review card. */
export function evidenceReferences(
	evidence: readonly DemoEvidence[],
	letters: Readonly<Record<string, string>>
): EvidenceReference[] {
	return evidence.map(entry => ({letter: letters[entry.quote] ?? '?', page: entry.page, para: entry.para, quote: entry.quote}));
}

/** Splits a paragraph into plain and marked ([[…]]) text segments. */
export function previewParagraphSegments(paragraph: string, letters: Readonly<Record<string, string>>): PreviewSegment[] {
	const segments: PreviewSegment[] = [];
	const pattern = /\[\[(?<quote>[\s\S]*?)\]\]/gu;
	let cursor = 0;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(paragraph))) {
		const quote = match.groups?.['quote'] ?? '';
		if (match.index > cursor) {
			segments.push({text: paragraph.slice(cursor, match.index), marked: false});
		}
		segments.push({text: quote, marked: true, letter: matchLetter(quote, letters)});
		cursor = pattern.lastIndex;
	}
	if (cursor < paragraph.length) {
		segments.push({text: paragraph.slice(cursor), marked: false});
	}
	return segments;
}

export function previewParagraphs(paras: readonly string[], letters: Readonly<Record<string, string>>): PreviewParagraph[] {
	return paras.map(paragraph => ({segments: previewParagraphSegments(paragraph, letters)}));
}

function matchLetter(segmentText: string, letters: Readonly<Record<string, string>>): string | undefined {
	const normalizedSegment = normalizeForMatch(segmentText);
	const segmentHead = normalizedSegment.slice(0, letterMatchHeadLength);
	for (const [quote, letter] of Object.entries(letters)) {
		const quoteHead = normalizeForMatch(quote).slice(0, letterMatchHeadLength);
		if (normalizedSegment.startsWith(quoteHead) || quote.startsWith(segmentHead)) {
			return letter;
		}
	}
	return undefined;
}

function normalizeForMatch(text: string): string {
	return text.replace(/[\u00ab\u00bb\u2026\s]+/gu, ' ').trim().toLowerCase();
}
