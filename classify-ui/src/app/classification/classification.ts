/** Canonical ISG classification value of the classify service (`POST /v1/classify`). */
export type IsgClassification = 'unclassified' | 'internal' | 'confidential' | 'secret';

/** Canonical DSG classification value of the classify service. */
export type DsgClassification = 'no_personal_data' | 'personal_data' | 'sensitive_personal_data';

/** Detection status of `profiling`/`high_risk_profiling` (already human-readable German). */
export type DetectionStatus = 'nicht erkannt' | 'möglich' | 'erkannt';

/** DSG finding category of the classify service. */
export type DsgFindingCategory = 'personendaten' | 'besonders schützenswerte personendaten';

/* eslint-disable @typescript-eslint/naming-convention -- the response keeps the API's snake_case keys */

export interface ClassifyFinding {
	type: string;
	category: DsgFindingCategory;
	count: number;
}

export interface ClassifyIsgIsv {
	classification: IsgClassification;
	reasons: string[];
	legal_basis: string[];
}

export interface ClassifyDsg {
	classification: DsgClassification;
	reasons: string[];
	legal_basis: string[];
	findings: ClassifyFinding[];
	profiling: DetectionStatus;
	high_risk_profiling: DetectionStatus;
}

export interface ClassifyResponse {
	isg_isv: ClassifyIsgIsv;
	dsg: ClassifyDsg;
}

/* eslint-enable @typescript-eslint/naming-convention */

/** ISG review-card model mapped from the `isg_isv` response block. */
export interface IsgResult {
	classification: IsgClassification;
	reasons: readonly string[];
	legalBasis: readonly string[];
}

/** One DSG finding (type, category, count) of the review card. */
export interface DsgFinding {
	type: string;
	category: DsgFindingCategory;
	count: number;
}

/** DSG review-card model mapped from the `dsg` response block. */
export interface DsgResult {
	classification: DsgClassification;
	reasons: readonly string[];
	legalBasis: readonly string[];
	findings: readonly DsgFinding[];
	profiling: DetectionStatus;
	highRiskProfiling: DetectionStatus;
}

/** Mapped classification result of a document (shown by the review cards). */
export interface DocumentResult {
	isg: IsgResult;
	dsg: DsgResult;
}

export type DocumentStatus = 'busy' | 'pending' | 'failed';

export interface DocumentBase {
	id: string;
	name: string;
	size: number | null;
	ext: string;
}

export interface DocumentBusy extends DocumentBase {
	status: 'busy';
}

export interface DocumentPending extends DocumentBase {
	status: 'pending';
	/** The RAW classification response of the document ("Befund als JSON"). */
	response: ClassifyResponse;
	result: DocumentResult;
}

export interface DocumentFailed extends DocumentBase {
	status: 'failed';
	/** i18n key of the translated failure reason shown for the document. */
	failureReason: string;
}

export type ClassifyDocument = DocumentBusy | DocumentPending | DocumentFailed;

export interface AcceptedFileInfo {
	file: File;
	ext: string;
}

export interface RejectedFileInfo {
	name: string;
	reason: 'format' | 'size';
}

/** i18n key tokens of the detection statuses (design D2: API values map to i18n keys). */
const detectionKeys: Record<DetectionStatus, string> = {
	'nicht erkannt': 'none',
	'möglich': 'possible',
	'erkannt': 'detected'
};

/** i18n key tokens of the DSG finding categories. */
const findingCategoryKeys: Record<DsgFindingCategory, string> = {
	'personendaten': 'personal-data',
	'besonders schützenswerte personendaten': 'sensitive-personal-data'
};

/** Maps a detection status to the i18n key token of `koby.work.dsg.detection.*`. */
export function detectionKey(status: DetectionStatus): string {
	return detectionKeys[status];
}

/** Maps a finding category to the i18n key token of `koby.work.dsg.finding-category.*`. */
export function findingCategoryKey(category: DsgFindingCategory): string {
	return findingCategoryKeys[category];
}

/** The review model of a classification response (pure mapping, design D2). */
export function mapClassifyResponse(response: ClassifyResponse): DocumentResult {
	return {
		isg: {
			classification: response.isg_isv.classification,
			reasons: [...response.isg_isv.reasons],
			legalBasis: [...response.isg_isv.legal_basis]
		},
		dsg: {
			classification: response.dsg.classification,
			reasons: [...response.dsg.reasons],
			legalBasis: [...response.dsg.legal_basis],
			findings: response.dsg.findings.map(finding => ({...finding})),
			profiling: response.dsg.profiling,
			highRiskProfiling: response.dsg.high_risk_profiling
		}
	};
}

/** The RAW stored classification response of a document ("Befund als JSON"). */
export function buildJson(entry: DocumentPending): ClassifyResponse {
	return entry.response;
}

/** The Accept-Language value of the classify service. */
export type AcceptLanguage = 'de' | 'fr' | 'it';

const acceptLanguages: readonly AcceptLanguage[] = ['de', 'fr', 'it'];
const defaultAcceptLanguage: AcceptLanguage = 'de';
const languageCodeLength = 2;

/** Maps the active UI language ('de-CH', 'fr-CH', 'it-CH', …) to the service's Accept-Language. */
export function mapLanguageToAcceptLanguage(language: string | null): AcceptLanguage {
	const code = (language ?? '').slice(0, languageCodeLength);
	return acceptLanguages.find(accepted => accepted === code) ?? defaultAcceptLanguage;
}

/** HTTP status codes the classify service returns as errors. */
const statusTooLarge = 413;  
const statusUnsupportedType = 415;  
const statusUnreadableDocument = 422;  
const statusModelFailure = 502;  

/** Maps an HTTP status (or a missing response) to the i18n key of the failure reason. */
export function mapStatusToFailureReason(status: number): string {
	if (status === statusTooLarge) {
		return 'koby.work.error.too-large';
	}
	if (status === statusUnsupportedType) {
		return 'koby.work.error.unsupported';
	}
	if (status === statusUnreadableDocument) {
		return 'koby.work.error.unreadable';
	}
	if (status === statusModelFailure) {
		return 'koby.work.error.model';
	}
	return 'koby.work.error.unavailable';
}
