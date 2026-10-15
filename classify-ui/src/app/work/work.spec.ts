import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {ObEUploadEventType, type ObIUploadEvent, ObNotificationService, provideObliqueTestingConfiguration} from '@oblique/oblique';
import {HttpTestingController, type TestRequest, provideHttpClientTesting} from '@angular/common/http/testing';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AppModule} from '../app-module';
import {environment} from '../../environments/environment';
import type {ClassifyResponse, DocumentFailed} from '../classification/classification';
import {ClassificationService} from '../classification/classification.service';
import {Work} from './work';
import type {WorkIntake} from './work-intake';

const bytesPerMegabyte = 1024 * 1024;
const classifyUrl = `${environment.apiBaseUrl}/v1/classify`;

/* eslint-disable @typescript-eslint/naming-convention -- the fixtures keep the API's snake_case keys */
const classifyResponse: ClassifyResponse = {
	isg_isv: {
		classification: 'confidential',
		reasons: ['Enthält interne Angaben zum Bundesrat.'],
		legal_basis: ['Art. 13 ISV']
	},
	dsg: {
		classification: 'sensitive_personal_data',
		reasons: ['Enthält Gesundheitsdaten.'],
		legal_basis: ['Art. 5 lit. c DSG'],
		findings: [{type: 'health_data', category: 'besonders schützenswerte personendaten', count: 3}],
		profiling: 'möglich',
		high_risk_profiling: 'nicht erkannt'
	}
};

const secretResponse: ClassifyResponse = {
	isg_isv: {
		classification: 'secret',
		reasons: ['Sehr schützenswerte Information.'],
		legal_basis: ['Art. 24 ISV']
	},
	dsg: {
		classification: 'no_personal_data',
		reasons: ['Keine Personenbezug erkennbar.'],
		legal_basis: ['Art. 5 DSG'],
		findings: [],
		profiling: 'nicht erkannt',
		high_risk_profiling: 'nicht erkannt'
	}
};
/* eslint-enable @typescript-eslint/naming-convention -- the fixtures keep the API's snake_case keys */

function makeFile(name: string, size: number, ext: string): File {
	const file = new File(['x'.repeat(32)], name, {type: ext});
	Object.defineProperty(file, 'size', {value: size});
	return file;
}

describe('Work', () => {
	let fixture: ComponentFixture<Work>;
	let classification: ClassificationService;
	let httpMock: HttpTestingController;
	let notificationInfo: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppModule],
			providers: [provideObliqueTestingConfiguration(), provideHttpClientTesting()]
		}).compileComponents();
		classification = TestBed.inject(ClassificationService);
		httpMock = TestBed.inject(HttpTestingController);
		const notification = TestBed.inject(ObNotificationService);
		notificationInfo = vi.spyOn(notification, 'info');

		// Oblique's testing configuration mocks the icon registration away, so the
		// icon used by the document list actions column is stubbed here.
		const sanitizer = TestBed.inject(DomSanitizer);
		const iconRegistry = TestBed.inject(MatIconRegistry);
		iconRegistry.addSvgIconLiteral('delete', sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));

		fixture = TestBed.createComponent(Work);
	});

	afterEach(() => {
		httpMock.verify({ignoreCancelled: true});
	});

	function intake(): WorkIntake {
		return fixture.componentInstance.intakeChild();
	}

	function addFile(name: string, size: number, ext: string): void {
		const event: ObIUploadEvent = {type: ObEUploadEventType.CHOSEN, files: [makeFile(name, size, ext)]};
		intake().onUploadEvent(event);
		fixture.detectChanges();
	}

	/** Flushes the oldest open classify request with the given response. */
	function flushClassify(response: ClassifyResponse): void {
		const request = openRequest();
		request.flush(response);
		fixture.detectChanges();
	}

	/** Flushes the oldest open classify request with an error status. */
	function flushClassifyError(status: number, statusText: string): void {
		const request = openRequest();
		request.flush('error', {status, statusText});
		fixture.detectChanges();
	}

	function openRequest(): TestRequest {
		const request = httpMock.match(classifyUrl).find(candidate => !candidate.cancelled);
		if (request === undefined) {
			throw new Error('no open classify request');
		}
		return request;
	}

	function element(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}

	it('renders one document row with status and actions per added file (table render)', () => {
		addFile('lohnliste_abteilung_q3.txt', 2048, 'txt');
		flushClassify(classifyResponse);
		addFile('netzwerkplan_standort.pdf', 4096, 'pdf');
		flushClassify(classifyResponse);
		fixture.detectChanges();

		expect(element().querySelectorAll('.doclist__row')).toHaveLength(2);
		expect(element().querySelectorAll('.doclist__row .doclist__status')).toHaveLength(2);
		expect(element().querySelector('.doclist__row .doclist__name')?.textContent).toBe('lohnliste_abteilung_q3.txt');
	});

	it('selection switches the review area to the selected document', () => {
		addFile('lohnliste_abteilung_q3.txt', 2048, 'txt');
		flushClassify(classifyResponse);
		addFile('netzwerkplan_standort.pdf', 4096, 'pdf');
		flushClassify(classifyResponse);
		fixture.detectChanges();

		const selects = element().querySelectorAll<HTMLButtonElement>('.doclist__select');
		selects[1].click();
		fixture.detectChanges();

		expect(element().querySelector('.doclist__row--selected')).toBe(selects[1].closest('.doclist__row'));
		expect(classification.selectedDocument()?.ext).toBe('pdf');
		expect(element().querySelector('[data-testid="review-area"]')).toBeTruthy();
	});

	it('rejects unsupported formats and over-sized files with an alert while keeping existing documents', () => {
		addFile('lohnliste_abteilung_q3.txt', 2048, 'txt');
		flushClassify(classifyResponse);
		const acceptedCountBefore = classification.documents().length;

		addFile('video.mp4', 2048, 'mp4');
		fixture.detectChanges();
		expect(element().querySelectorAll('ob-alert.error, ob-alert.ob-alert-error')).toHaveLength(1);
		expect(classification.documents().length).toBe(acceptedCountBefore);

		addFile('riesig.pdf', 11 * bytesPerMegabyte, 'pdf');
		fixture.detectChanges();
		expect(element().querySelectorAll('ob-alert.error, ob-alert.ob-alert-error')).toHaveLength(1);
		expect(classification.documents().length).toBe(acceptedCountBefore);
	});

	it('the busy state shows a single pending indication and reaches the review area', () => {
		addFile('typ_pruefung.docx', 1024, 'docx');
		fixture.detectChanges();

		expect(element().querySelector('[data-testid="busy-state"]')).toBeTruthy();
		expect(element().querySelector('[data-testid="busy-label"]')?.textContent).toContain('koby.work.busy.analysing');
		expect(element().querySelectorAll('.stages__item')).toHaveLength(0);
		expect(element().querySelector('[data-testid="review-area"]')).toBeNull();

		flushClassify(classifyResponse);
		expect(element().querySelector('[data-testid="review-area"]')).toBeTruthy();
		expect(element().querySelector('[data-testid="busy-state"]')).toBeNull();
	});

	it('cancelling the analysis aborts the in-flight request and removes the document', () => {
		addFile('typ_pruefung.docx', 1024, 'docx');
		fixture.detectChanges();

		const request = httpMock.match(classifyUrl)[0];
		element().querySelector<HTMLButtonElement>('[data-testid="doc-cancel"]')?.click();
		fixture.detectChanges();

		expect(request.cancelled).toBe(true);
		expect(notificationInfo).toHaveBeenCalled();
		expect(classification.documents()).toHaveLength(0);
	});

	it('renders a failed document with its reason without affecting other documents', () => {
		addFile('unlesbar.pdf', 1024, 'pdf');
		flushClassifyError(422, 'Unprocessable Entity');
		fixture.detectChanges();

		expect(element().querySelector('.doclist__status--failed')).toBeTruthy();
		expect(element().querySelector('.doclist__reason')?.textContent).toContain('koby.work.error.unreadable');
		expect(element().querySelector('[data-testid="review-area"]')).toBeNull();
		expect(classification.documents()[0].status).toBe('failed');

		addFile('anderes.pdf', 1024, 'pdf');
		flushClassify(classifyResponse);
		fixture.detectChanges();
		expect(classification.documents()).toHaveLength(2);
		expect(classification.documents()[0].status).toBe('failed');
		expect((classification.documents()[0] as DocumentFailed).failureReason).toBe('koby.work.error.unreadable');
		expect(classification.documents()[1].status).toBe('pending');
	});

	it('marks the ISG proposal and renders the geheim tile only for a secret classification', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		flushClassify(classifyResponse);

		expect(element().querySelectorAll('[data-testid^="isg-tile-"]')).toHaveLength(3);
		expect(element().querySelector('[data-testid="isg-tile-secret"]')).toBeNull();
		expect(element().querySelector('[data-testid="isg-tile-confidential"]')?.className).toContain('tile--marked');
		expect(element().querySelector('[data-testid="isg-reasons"]')?.textContent).toContain('Enthält interne Angaben zum Bundesrat.');
		expect(element().querySelector('[data-testid="isg-legal-basis"]')?.textContent).toContain('Art. 13 ISV');

		addFile('geheime_sache.pdf', 2048, 'pdf');
		flushClassify(secretResponse);
		classification.select(classification.documents()[1].id);
		fixture.detectChanges();

		expect(element().querySelectorAll('[data-testid^="isg-tile-"]')).toHaveLength(4);
		expect(element().querySelector('[data-testid="isg-tile-secret"]')?.className).toContain('tile--marked');
	});

	it('the DSG assessment shows the proposal tile, the profiling readout and the findings', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		flushClassify(classifyResponse);

		expect(element().querySelectorAll('[data-testid^="dsg-tile-"]')).toHaveLength(3);
		expect(element().querySelector('[data-testid="dsg-tile-sensitive_personal_data"]')?.className).toContain('tile--marked');
		expect(element().querySelector('[data-testid="dsg-profiling"]')?.textContent).toContain('koby.work.dsg.detection.possible');
		expect(element().querySelectorAll('[data-testid="dsg-finding"]')).toHaveLength(1);
	});

	it('the findings JSON of the selected document matches the stored response (Befund als JSON)', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		flushClassify(classifyResponse);

		const entry = classification.documents()[0];
		if (entry.status !== 'pending') {
			throw new Error('classification not complete');
		}
		const json = classification.buildJson(entry);
		expect(json).toBe(classifyResponse);
		expect(json.isg_isv.classification).toBe('confidential');
		expect(json.dsg.classification).toBe('sensitive_personal_data');
	});

	it('the disclaimer is rendered with the proposals', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		flushClassify(classifyResponse);
		expect(element().querySelector('.work-review__disclaimer')?.textContent).toContain('koby.work.disclaimer');
	});
});
