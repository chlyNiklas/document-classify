import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {environment} from '../../environments/environment';
import {type ClassifyResponse, type DocumentFailed, mapLanguageToAcceptLanguage} from './classification';
import {ClassificationService} from './classification.service';

/* eslint-disable @typescript-eslint/naming-convention -- the fixture keeps the API's snake_case keys */
const classifyResponse: ClassifyResponse = {
	isg_isv: {
		classification: 'confidential',
		reasons: ['Enthält interne Angaben zum Bundesrat.', 'Beschränkter Zugriff erforderlich.'],
		legal_basis: ['Art. 13 ISV']
	},
	dsg: {
		classification: 'sensitive_personal_data',
		reasons: ['Enthält Gesundheitsdaten.'],
		legal_basis: ['Art. 5 lit. c DSG'],
		findings: [
			{type: 'health_data', category: 'besonders schützenswerte personendaten', count: 3},
			{type: 'name', category: 'personendaten', count: 12}
		],
		profiling: 'möglich',
		high_risk_profiling: 'nicht erkannt'
	}
};
/* eslint-enable @typescript-eslint/naming-convention -- the fixture keeps the API's snake_case keys */

const bytesPerMegabyte = 1024 * 1024;
const classifyUrl = `${environment.apiBaseUrl}/v1/classify`;

describe('ClassificationService', () => {
	let service: ClassificationService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(ClassificationService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify({ignoreCancelled: true});
	});

	function addFile(name: string, size: number, ext: string): void {
		const {accepted} = service.validate([makeFile(name, size, ext)]);
		service.addFiles(accepted);
	}

	it('validates unsupported formats and over-sized files without touching existing documents', () => {
		const first = service.validate([makeFile('bericht.txt', 10), makeFile('video.mp4', 10), makeFile('riesig.pdf', 11 * bytesPerMegabyte)]);
		expect(first.accepted.map(entry => entry.file.name)).toEqual(['bericht.txt']);
		expect(first.rejected).toEqual([
			{name: 'video.mp4', reason: 'format'},
			{name: 'riesig.pdf', reason: 'size'}
		]);

		service.addFiles(first.accepted);
		httpMock.expectOne(classifyUrl).flush(classifyResponse);
		expect(service.documents().length).toBe(1);

		const again = service.validate([makeFile('video.mp4', 10)]);
		expect(again.accepted).toHaveLength(0);
		service.addFiles(again.accepted);
		expect(service.documents().length).toBe(1);
	});

	it('accepts the four supported formats', () => {
		const files = [makeFile('bericht.pdf', 10), makeFile('brief.docx', 10), makeFile('notizen.md', 10), makeFile('lohnliste.txt', 10)];
		const result = service.validate(files);
		expect(result.rejected).toEqual([]);
		expect(result.accepted.map(entry => entry.ext)).toEqual(['pdf', 'docx', 'md', 'txt']);
		expect(service.acceptedExtensions).toEqual(['pdf', 'docx', 'md', 'txt']);
	});

	it('accepts a file of exactly 10 MB and rejects files beyond the limit with reason size', () => {
		const boundary = service.validate([makeFile('exakt.pdf', 10 * bytesPerMegabyte)]);
		expect(boundary.rejected).toEqual([]);
		expect(boundary.accepted).toHaveLength(1);
		expect(service.maxFileSizeMegabytes).toBe(10);

		const beyond = service.validate([makeFile('riesig.pdf', 10 * bytesPerMegabyte + 1)]);
		expect(beyond.accepted).toHaveLength(0);
		expect(beyond.rejected).toEqual([{name: 'riesig.pdf', reason: 'size'}]);
	});

	it('posts the intact file as multipart to the classify service and maps the response into the review model', () => {
		addFile('bericht.pdf', 2048, 'pdf');
		expect(service.documents()[0].status).toBe('busy');
		expect(service.selectedId()).toBe(service.documents()[0].id);

		const request = httpMock.expectOne(classifyUrl);
		expect(request.request.method).toBe('POST');
		expect(request.request.headers.get('Accept-Language')).toBe('de');
		const body = request.request.body as FormData;
		expect(body.get('file')).toBeInstanceOf(File);
		expect((body.get('file') as File).name).toBe('bericht.pdf');

		request.flush(classifyResponse);
		const entry = service.documents()[0];
		expect(entry.status).toBe('pending');
		if (entry.status !== 'pending') {
			throw new Error('document did not become pending');
		}
		const pending = entry;
		expect(pending.result.isg.classification).toBe('confidential');
		expect(pending.result.isg.reasons).toEqual(classifyResponse.isg_isv.reasons);
		expect(pending.result.isg.legalBasis).toEqual(['Art. 13 ISV']);
		expect(pending.result.dsg.classification).toBe('sensitive_personal_data');
		expect(pending.result.dsg.reasons).toEqual(['Enthält Gesundheitsdaten.']);
		expect(pending.result.dsg.legalBasis).toEqual(['Art. 5 lit. c DSG']);
		expect(pending.result.dsg.findings).toEqual([
			{type: 'health_data', category: 'besonders schützenswerte personendaten', count: 3},
			{type: 'name', category: 'personendaten', count: 12}
		]);
		expect(pending.result.dsg.profiling).toBe('möglich');
		expect(pending.result.dsg.highRiskProfiling).toBe('nicht erkannt');
	});

	it('buildJson returns the RAW stored response object', () => {
		addFile('bericht.pdf', 2048, 'pdf');
		httpMock.expectOne(classifyUrl).flush(classifyResponse);
		const entry = service.documents()[0];
		if (entry.status !== 'pending') {
			throw new Error('document did not become pending');
		}
		expect(service.buildJson(entry)).toBe(classifyResponse);
	});

	describe('error paths mark the document failed with the translated reason', () => {
		const errorCases: {status: number; reason: string}[] = [
			{status: 413, reason: 'koby.work.error.too-large'},
			{status: 415, reason: 'koby.work.error.unsupported'},
			{status: 422, reason: 'koby.work.error.unreadable'},
			{status: 502, reason: 'koby.work.error.model'}
		];

		it.each(errorCases)('HTTP $status marks the document failed', ({status, reason}) => {
			addFile('bericht.pdf', 2048, 'pdf');
			httpMock.expectOne(classifyUrl).flush('error', {status, statusText: 'Error'});
			const entry = service.documents()[0];
			expect(entry.status).toBe('failed');
			expect((entry as DocumentFailed).failureReason).toBe(reason);
		});

		it('a missing response (network error) marks the document failed as service unavailable', () => {
			addFile('bericht.pdf', 2048, 'pdf');
			httpMock.expectOne(classifyUrl).error(new ProgressEvent('network error'), {status: 0, statusText: 'Unknown Error'});
			const entry = service.documents()[0];
			expect(entry.status).toBe('failed');
			expect((entry as DocumentFailed).failureReason).toBe('koby.work.error.unavailable');
		});
	});

	it('cancel removes the document, tears down the in-flight request and the flushed response no longer touches anything', () => {
		addFile('bericht.pdf', 2048, 'pdf');
		const request = httpMock.expectOne(classifyUrl);
		const id = service.documents()[0].id;

		service.cancel(id);

		expect(service.documents()).toHaveLength(0);
		expect(service.selectedId()).toBeNull();
		// Tearing down the per-document subscription aborts the in-flight request.
		expect(request.cancelled).toBe(true);
		// The aborted request counts as cancelled, so the verification ignores it.
		expect(() => httpMock.verify({ignoreCancelled: true})).not.toThrow();
		expect(service.documents()).toHaveLength(0);
	});

	it('a failure leaves other documents untouched', () => {
		addFile('bericht.pdf', 2048, 'pdf');
		addFile('anderes.docx', 2048, 'docx');
		const requests = httpMock.match(classifyUrl);
		expect(requests).toHaveLength(2);
		requests[0].flush('error', {status: 413, statusText: 'Error'});
		requests[requests.length - 1].flush(classifyResponse);

		expect(service.documents()).toHaveLength(2);
		expect(service.documents()[0].status).toBe('failed');
		expect((service.documents()[0] as DocumentFailed).failureReason).toBe('koby.work.error.too-large');
		expect(service.documents()[1].status).toBe('pending');
	});
});

describe('environment API base URL', () => {
	it('the development environment targets the local classify service and the test environment matches it', async () => {
		const {environment: environmentDev} = await import('../../environments/environment.dev');
		expect(environmentDev.apiBaseUrl).toBe('http://localhost:8000');
		expect(environment.apiBaseUrl).toBe('http://localhost:8000');
	});

	it('the production build issues classify requests relative to the serving origin', async () => {
		const {environment: environmentProd} = await import('../../environments/environment.prod');
		expect(environmentProd.apiBaseUrl).toBe('');
	});
});

describe('mapLanguageToAcceptLanguage', () => {
	it('maps the active UI locales to the service languages', () => {
		expect(mapLanguageToAcceptLanguage('de-CH')).toBe('de');
		expect(mapLanguageToAcceptLanguage('fr-CH')).toBe('fr');
		expect(mapLanguageToAcceptLanguage('it-CH')).toBe('it');
		expect(mapLanguageToAcceptLanguage('de')).toBe('de');
	});

	it('falls back to German for unknown languages', () => {
		expect(mapLanguageToAcceptLanguage('en-US')).toBe('de');
		expect(mapLanguageToAcceptLanguage(null)).toBe('de');
	});
});

function makeFile(name: string, size: number, ext = ''): File {
	const extension = ext || (name.split('.').pop() ?? '');
	const file = new File(['x'.repeat(32)], name, {type: extension});
	Object.defineProperty(file, 'size', {value: size});
	return file;
}
