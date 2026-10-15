import {Injectable, type OnDestroy, signal} from '@angular/core';
import {demoSampleExtensions, getDemoSample, mapFileNameToSample} from './mock-documents';
import type {DemoEvidence, DemoSample, IsgLevel} from './demo-samples';

export type DemoDocumentStatus = 'busy' | 'pending';

export interface DemoDocumentResult {
	level: IsgLevel;
	confidence: number;
	distribution: DemoSample['distribution'];
	dsgKind: DemoSample['dsgKind'];
	dsgConfidence: number;
	justification: string;
	evidence: readonly DemoEvidence[];
	/** Marker letters (A, B, C …) of the evidence quotes, keyed by quote. */
	evidenceLetters: Readonly<Record<string, string>>;
}

export interface DemoDocumentBase {
	id: string;
	name: string;
	size: number | null;
	ext: string;
	pages: number;
	tag: string;
	sampleId: string;
}

export interface DemoDocumentAwaitingAnalysis extends DemoDocumentBase {
	status: 'busy';
	/** Index of the analysis stage that ran last (stage counts from stageDurationsMs length). */
	step: number;
}

export interface DemoDocumentWithResult extends DemoDocumentBase {
	status: 'pending';
	result: DemoDocumentResult;
}

export type DemoDocument = DemoDocumentAwaitingAnalysis | DemoDocumentWithResult;

export interface AcceptedFileInfo {
	file: File;
	ext: string;
}

export interface RejectedFileInfo {
	name: string;
	reason: 'format' | 'size';
}

const objectIdLength = 48;
const objectIdTailLength = 12;
const secondsInMs = 1000;
const requestIdPrefix = '9f3c1a2e-7b5d-4e1a-9c2f-';

let nextId = 0;

/** Duration of each simulated analysis stage in milliseconds (stage 3 runs slightly longer). */
const stageDurationsMs = [600, 600, 750, 600]; // eslint-disable-line @typescript-eslint/no-magic-numbers -- simulated pipeline stage durations (ms)
const bytesPerMegabyte = 1024 * 1024; // eslint-disable-line @typescript-eslint/no-magic-numbers -- byte conversion factor
/** The first evidence marker letter of the combined ISG + DSG lettering. */
const markerLetterFirst = 'A'.charCodeAt(0);
/** Legal basis per ISG level used in the simulated response. */
const legalBasisByLevel: Record<IsgLevel, string> = {
	none: 'ISG Art. 11',
	internal: 'ISG Art. 12',
	confidential: 'ISG Art. 13'
};

@Injectable({providedIn: 'root'})
export class MockClassificationService implements OnDestroy {
	readonly documents = signal<readonly DemoDocument[]>([]);
	readonly selectedId = signal<string | null>(null);

	/** Files rejected by the last intake validation, with their reason (supported format, size). */
	readonly rejections = signal<readonly RejectedFileInfo[]>([]);

	readonly acceptedExtensions = demoSampleExtensions;
	readonly maxFileSizeMegabytes = 50;

	private readonly timers = new Set<ReturnType<typeof setTimeout>>();

	/** The document currently shown in the review area. */
	selectedDocument(): DemoDocument | null {
		const id = this.selectedId();
		if (id === null) {
			return null;
		}
		return this.documents().find(entry => entry.id === id) ?? null;
	}

	/** Selects the document shown in the review area. */
	select(id: string): void {
		this.selectedId.set(id);
	}

	/** Cancels the analysis of the document with the given id and removes it without a result. */
	cancel(id: string): void {
		this.documents.update(documents => documents.filter(entry => entry.id !== id));
		if (this.selectedId() === id) {
			this.selectedId.set(null);
		}
	}

	/** Simulated classification response ("Befund") of a document, shown via "Befund als JSON". */
	buildJson(entry: DemoDocumentWithResult): Record<string, unknown> {
		const sample = getDemoSample(entry.sampleId);
		const legalBasis = legalBasisByLevel[sample.level];
		const distribution = {none: sample.distribution.none, internal: sample.distribution.internal, confidential: sample.distribution.confidential};
		return {
			/* eslint-disable @typescript-eslint/naming-convention -- the simulated response keeps the API's snake_case keys */
			'request_id': (requestIdPrefix + entry.sampleId.toLowerCase().padEnd(objectIdTailLength, '0')).slice(0, objectIdLength),
			'document': {name: entry.name, size_bytes: entry.size ?? undefined, pages: sample.pages, language: 'de', text_layer: true},
			'isg': {proposal: sample.level, confidence: sample.confidence, distribution, justification: sample.justification, legal_basis: legalBasis},
			'dsg': {proposal: sample.dsgKind, personal_data: sample.dsgKind !== 'none', confidence: sample.dsgConfidence},
			'evidence': sample.evidence.map((evidence, index) => ({
				marker: String.fromCharCode(markerLetterFirst + index),
				page: evidence.page,
				paragraph: evidence.para,
				quote: evidence.quote,
				for: evidence.scopes
			})),
			'decision': {'status': 'pending_human_review'},
			'model': {id: 'bit-classify-l', 'prompt': 'classify-isv-dsg@2026-10.3', runtime: 'vllm'},
			'rules_version': '2026-10',
			'duration_ms': Math.round(sample.durationSeconds * secondsInMs)
		};
		/* eslint-enable @typescript-eslint/naming-convention */
	}

	ngOnDestroy(): void {
		for (const timer of this.timers) {
			clearTimeout(timer);
		}
		this.timers.clear();
	}

	/**
	 * Validates files against the supported format list and the 50 MB size limit.
	 * Already present documents are never touched; the rejection reasons are recorded
	 * in the rejections signal.
	 */
	validate(files: readonly File[]): {accepted: AcceptedFileInfo[]; rejected: RejectedFileInfo[]} {
		const accepted: AcceptedFileInfo[] = [];
		const rejected: RejectedFileInfo[] = [];
		for (const file of files) {
			const ext = (file.name.split('.').pop() ?? '').toLowerCase();
			if (!this.acceptedExtensions.includes(ext)) {
				rejected.push({name: file.name, reason: 'format'});
			} else if (file.size > this.maxFileSizeBytes) {
				rejected.push({name: file.name, reason: 'size'});
			} else {
				accepted.push({file, ext});
			}
		}
		this.rejections.set(rejected);
		return {accepted, rejected};
	}

	/** Adds accepted files to the workbench and starts the simulated analysis for each one. */
	addFiles(accepted: readonly AcceptedFileInfo[]): void {
		if (accepted.length === 0) {
			return;
		}
		const added = accepted.map(({file, ext}) => this.mkDocument(file.name, file.size, ext));
		this.documents.update(documents => [...documents, ...added]);
		this.selectedId.set(added[0].id);
		for (const entry of added) {
			this.runAnalysis(entry.id);
		}
	}

	get maxFileSizeBytes(): number {
		return this.maxFileSizeMegabytes * bytesPerMegabyte;
	}

	/**
	 * Builds the simulated classification result of a document from its sample fixture.
	 * The evidence is enriched with marker letters A, B, C … over the combined ISG + DSG list.
	 */
	private buildResult(entry: DemoDocumentAwaitingAnalysis): DemoDocumentResult {
		const sample = getDemoSample(entry.sampleId);
		const evidenceLetters: Record<string, string> = {};
		sample.evidence.forEach((evidence, index) => {
			const letter = evidenceLetters[evidence.quote] ?? String.fromCharCode(markerLetterFirst + index);
			evidenceLetters[evidence.quote] = letter;
		});
		return {
			level: sample.level,
			confidence: sample.confidence,
			distribution: sample.distribution,
			dsgKind: sample.dsgKind,
			dsgConfidence: sample.dsgConfidence,
			justification: sample.justification,
			evidence: sample.evidence,
			evidenceLetters
		};
	}

	private mkDocument(name: string, size: number | null, ext: string): DemoDocumentAwaitingAnalysis {
		const sampleId = mapFileNameToSample(name, ext);
		const sample = getDemoSample(sampleId);
		nextId += 1;
		return {
			id: `doc-${nextId}`,
			name,
			size,
			ext,
			pages: sample.pages,
			tag: sample.tag,
			status: 'busy',
			step: 0,
			sampleId
		};
	}

	private runAnalysis(id: string): void {
		let elapsed = 0;
		stageDurationsMs.forEach((duration, stage) => {
			elapsed += duration;
			const timer = setTimeout(() => {
				this.timers.delete(timer);
				this.advanceStage(id, stage + 1);
			}, elapsed);
			this.timers.add(timer);
		});
	}

	private advanceStage(id: string, stage: number): void {
		this.documents.update(documents =>
			documents.map(entry => {
				if (entry.id !== id || entry.status !== 'busy') {
					return entry;
				}
				if (stage < stageDurationsMs.length) {
					return {...entry, step: stage};
				}
				return {
					id: entry.id,
					name: entry.name,
					size: entry.size,
					ext: entry.ext,
					pages: entry.pages,
					tag: entry.tag,
					sampleId: entry.sampleId,
					status: 'pending',
					result: this.buildResult(entry)
				};
			})
		);
	}
}
