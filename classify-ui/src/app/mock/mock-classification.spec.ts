import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {MockClassificationService} from './mock-classification.service';
import {demoSamples} from './demo-samples';
import {getDemoSample, mapFileNameToSample} from './mock-documents';

const bytesPerMegabyteValue = 1024 * 1024;

describe('MockClassificationService', () => {	let service: MockClassificationService;

	beforeEach(() => {
		vi.useFakeTimers();
		service = TestBed.inject(MockClassificationService);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('every fixture is proposal-capable (never "geheim") with a confidence present', () => {
		for (const sample of demoSamples) {
			expect(sample.id).toBeTruthy();
			expect(sample.level, sample.id).not.toBe('secret');
			expect(['none', 'internal', 'confidential']).toContain(sample.level);
			expect(sample.confidence, sample.id).toBeGreaterThan(0);
			expect(sample.confidence, sample.id).toBeLessThanOrEqual(1);
			expect(Object.values(sample.distribution)).toContain(sample.confidence);
		}
	});

	it('the upload name mapping never resolves to the manual-only level', () => {
		const names = [
			'lohnliste_q3.txt',
			'vertrauensaerztliche_beurteilung.docx',
			'offerte_rz_erweiterung.pdf',
			'netzwerkplan.pdf',
			'protokoll_amtsleitung.docx',
			'FAQ_Datenschutz.pdf',
			'jahresbericht_entwurf.docx',
			'irgendwas.docx'
		];
		for (const name of names) {
			const ext = name.split('.').pop() ?? '';
			const samplePoint = getDemoSample(mapFileNameToSample(name, ext));
			expect(samplePoint.level, name).not.toBe('secret');
		}
	});

	it('validates unsupported formats and over-sized files without touching existing documents', () => {
		const first = service.validate([makeFile('bericht.txt', 10), makeFile('video.mp4', 10), makeFile('riesig.pdf', 60 * bytesPerMegabyteValue)]);
		expect(first.accepted.map(entry => entry.file.name)).toEqual(['bericht.txt']);
		expect(first.rejected).toEqual([
			{name: 'video.mp4', reason: 'format'},
			{name: 'riesig.pdf', reason: 'size'}
		]);

		service.addFiles(first.accepted);
		expect(service.documents().length).toBe(1);

		const again = service.validate([makeFile('video.mp4', 10)]);
		expect(again.accepted).toHaveLength(0);
		service.addFiles(again.accepted);
		expect(service.documents().length).toBe(1);
	});

	describe('simulated four-stage pipeline', () => {
		function addFakeFile(name: string, size: number, ext: string): string {
			const {accepted} = service.validate([makeFile(name, size, ext)]);
			service.addFiles(accepted);
			const added = [...service.documents()].at(-1);
			if (added === undefined) {
				throw new Error('document was not added');
			}
			return added.id;
		}

		it('progresses stage by stage and completes with a result', () => {
			const id = addFakeFile('some_documentation.pdf', 2048, 'pdf');
			expect(service.documents()[0].status).toBe('busy');

			vi.advanceTimersByTime(600);
			const running = service.documents()[0];
			expect(running.status).toBe('busy');
			if (running.status !== 'busy') {
				throw new Error('analysis still running');
			}
			expect(running.step).toBe(1);

			vi.advanceTimersByTime(600);
			const runningTwo = service.documents()[0];
			if (runningTwo.status !== 'busy') {
				throw new Error('analysis still running');
			}
			expect(runningTwo.step).toBe(2);

			vi.advanceTimersByTime(1750);
			const done = service.documents()[0];
			if (done.status !== 'pending') {
				throw new Error('analysis not complete');
			}
			expect(done.status).toBe('pending');
			expect(done.result.confidence).toBeGreaterThan(0);
			expect(Object.keys(done.result.evidenceLetters).length).toBeGreaterThan(0);
			expect(id).toBeTruthy();
		});

		it('cancel removes the pending document and later stage timers no longer touch anything', () => {
			const id = addFakeFile('some_documentation.pdf', 2048, 'pdf');
			service.cancel(id);
			expect(service.documents()).toHaveLength(0);
			expect(service.selectedId()).toBeNull();
			expect(() => vi.runAllTimers()).not.toThrow();
			expect(service.documents()).toHaveLength(0);
		});

		it('the simulated JSON finding matches the fixture of the document', () => {
			addFakeFile('some_documentation.pdf', 2048, 'pdf');
			vi.runAllTimers();
			const entry = service.documents()[0];
			if (entry.status !== 'pending') {
				throw new Error('analysis not complete');
			}
			const json = service.buildJson(entry);

			expect(entry.sampleId).toBe('B16');
			expect(json['rules_version']).toBe('2026-10');
			const isg = json['isg'] as {proposal: string; confidence: number};
			const dsg = json['dsg'] as {proposal: string};
			expect(isg.proposal).toBe('none');
			expect(isg.confidence).toBe(0.94);
			expect(dsg.proposal).toBe('none');
			const evidence = json['evidence'] as {marker: string; quote: string}[];
			expect(evidence).toHaveLength(1);
			expect(evidence[0].marker).toBe('A');
			expect(String(json['request_id']).startsWith('9f3c1a2e-7b5d-4e1a-9c2f-b16')).toBe(true);
		});
	});
});

function makeFile(name: string, size: number, ext?: string): File {
	const extension = ext ?? 'csv';
	const fullName = name.includes('.') ? name : `${name}.${extension}`;
	const file = new File(['x'.repeat(32)], fullName, {type: extension});
	Object.defineProperty(file, 'size', {value: size});
	return file;
}
