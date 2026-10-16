import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {
	ObEUploadEventType,
	type ObIUploadEvent,
	ObNotificationService,
	ObOffCanvasService,
	ObSpinnerService,
	provideObliqueTestingConfiguration
} from '@oblique/oblique';
import {HttpTestingController, type TestRequest, provideHttpClientTesting} from '@angular/common/http/testing';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AppModule} from '../app-module';
import {environment} from '../../environments/environment';
import type {ClassifyResponse, DocumentFailed} from '../classification/classification';
import {ClassificationService} from '../classification/classification.service';
import {OffCanvasState} from '../shared/off-canvas-state.service';
import {Work, workSpinnerChannel} from './work';
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

	/** Lets pending spinner-channel events (delay(0)) and their view updates settle. */
	async function settle(): Promise<void> {
		await new Promise(resolve => {
			setTimeout(resolve);
		});
		fixture.detectChanges();
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

	it('a busy document shows the inline row spinner in place of the status label and stays interactive', async () => {
		addFile('typ_pruefung.docx', 1024, 'docx');
		await settle();

		const busyCell = element().querySelector('.doclist__status--busy');
		expect(busyCell?.querySelector('ob-spinner')).toBeTruthy();
		// the status label is replaced: only the visually hidden accessible name remains
		expect(busyCell?.querySelector('.doclist__status-hidden')?.textContent).toContain('koby.work.status.busy');
		// the rest of the page stays interactive: no fixed overlay
		expect(element().querySelector('.ob-overlay-fixed')).toBeNull();
		expect(element().querySelector('[data-testid="review-area"]')).toBeNull();
		expect(element().querySelectorAll('.stages__item')).toHaveLength(0);

		flushClassify(classifyResponse);
		expect(element().querySelector('.doclist__status--done')?.textContent).toContain('koby.work.status.pending');
		expect(element().querySelector('.doclist__row ob-spinner')).toBeNull();
		expect(element().querySelector('[data-testid="review-area"]')).toBeTruthy();
	});

	it('the spinner appears for rows rendered while the channel is already active', async () => {
		addFile('erste_pruefung.docx', 1024, 'docx');
		await settle();
		addFile('zweite_pruefung.pdf', 1024, 'pdf');
		await settle();

		const spinners = element().querySelectorAll('.doclist__row ob-spinner');
		expect(spinners).toHaveLength(2);
		for (const spinner of spinners) {
			expect(spinner.querySelector('.ob-spinner-fade-in')).toBeTruthy();
		}

		flushClassify(classifyResponse);
		flushClassify(classifyResponse);
	});

	it('activates the work-analysis spinner channel while a document is busy and deactivates when none is', () => {
		const spinnerService = TestBed.inject(ObSpinnerService);
		const activate = vi.spyOn(spinnerService, 'activate');
		const deactivate = vi.spyOn(spinnerService, 'deactivate');

		addFile('typ_pruefung.docx', 1024, 'docx');
		expect(activate).toHaveBeenCalledWith(workSpinnerChannel);

		activate.mockClear();
		deactivate.mockClear();

		flushClassify(classifyResponse);
		expect(deactivate).toHaveBeenCalledWith(workSpinnerChannel);
		expect(activate).not.toHaveBeenCalled();
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

	it('opens the selected document response from the "Befund als JSON" button', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		flushClassify(classifyResponse);

		const entry = classification.documents()[0];
		if (entry.status !== 'pending') {
			throw new Error('classification not complete');
		}

		const offCanvasState = TestBed.inject(OffCanvasState);
		const offCanvas = TestBed.inject(ObOffCanvasService);
		const action = element().querySelector<HTMLButtonElement>('[data-testid="json-finding-action"]');
		expect(action).toBeTruthy();

		action?.click();
		fixture.detectChanges();

		expect(offCanvasState.content()).toEqual({kind: 'json', document: entry});
		expect(offCanvas.open).toBe(true);
	});

	it('opens the file picker and classifies another document from the review action', () => {
		addFile('erstes_dokument.pdf', 2048, 'pdf');
		flushClassify(classifyResponse);

		const input = element().querySelector<HTMLInputElement>('[data-testid="upload-more-input"]');
		const action = element().querySelector<HTMLButtonElement>('[data-testid="upload-more-action"]');
		if (input === null || action === null) {
			throw new Error('additional-document controls not rendered');
		}

		const inputClick = vi.spyOn(input, 'click');
		action.click();
		expect(inputClick).toHaveBeenCalledOnce();

		const additionalFile = makeFile('zweites_dokument.docx', 4096, 'docx');
		Object.defineProperty(input, 'files', {configurable: true, value: [additionalFile]});
		input.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		expect(classification.documents()).toHaveLength(2);
		expect(classification.documents()[1]).toMatchObject({name: 'zweites_dokument.docx', status: 'busy'});
		flushClassify(secretResponse);
		expect(classification.documents()[1]).toMatchObject({name: 'zweites_dokument.docx', status: 'pending'});
		expect(classification.selectedDocument()?.name).toBe('zweites_dokument.docx');
	});

	it('the disclaimer is rendered with the proposals', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		flushClassify(classifyResponse);
		expect(element().querySelector('.work-review__disclaimer')?.textContent).toContain('koby.work.disclaimer');
	});
});
