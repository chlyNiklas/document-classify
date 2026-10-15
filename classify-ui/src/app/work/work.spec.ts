import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {ObEUploadEventType, type ObIUploadEvent, ObNotificationService, provideObliqueTestingConfiguration} from '@oblique/oblique';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AppModule} from '../app-module';
import {Work} from './work';
import type {WorkIntake} from './work-intake';
import {MockClassificationService} from '../mock/mock-classification.service';

const stageTotalMs = 600 + 600 + 750 + 600;
const bytesPerMegabyte = 1024 * 1024;

function makeFile(name: string, size: number, ext: string): File {
	const file = new File(['x'.repeat(32)], name, {type: ext});
	Object.defineProperty(file, 'size', {value: size});
	return file;
}

describe('Work', () => {
	let fixture: ComponentFixture<Work>;
	let classification: MockClassificationService;
	let notificationInfo: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.useFakeTimers();
		await TestBed.configureTestingModule({
			imports: [AppModule],
			providers: [provideObliqueTestingConfiguration()]
		}).compileComponents();
		classification = TestBed.inject(MockClassificationService);
		const notification = TestBed.inject(ObNotificationService);
		notificationInfo = vi.spyOn(notification, 'info');

		// Oblique's testing configuration mocks the icon registration away, so the
		// icons used by the document list actions column are stubbed here.
		const sanitizer = TestBed.inject(DomSanitizer);
		const iconRegistry = TestBed.inject(MatIconRegistry);
		iconRegistry.addSvgIconLiteral('eye', sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
		iconRegistry.addSvgIconLiteral('delete', sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));

		fixture = TestBed.createComponent(Work);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function intake(): WorkIntake {
		return fixture.componentInstance.intakeChild();
	}

	function addFile(name: string, size: number, ext: string): void {
		const event: ObIUploadEvent = {type: ObEUploadEventType.CHOSEN, files: [makeFile(name, size, ext)]};
		intake().onUploadEvent(event);
		fixture.detectChanges();
	}

	function runAnalysis(): void {
		vi.advanceTimersByTime(stageTotalMs);
		fixture.detectChanges();
	}

	function element(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}

	it('renders one document row with status and actions per added file (table render)', () => {
		addFile('lohnliste_abteilung_q3.txt', 2048, 'txt');
		addFile('netzwerkplan_standort.pdf', 4096, 'pdf');
		fixture.detectChanges();

		expect(element().querySelectorAll('.doclist__row')).toHaveLength(2);
		expect(element().querySelectorAll('.doclist__row .doclist__status')).toHaveLength(2);
		expect(element().querySelector('.doclist__row .doclist__name')?.textContent).toBe('lohnliste_abteilung_q3.txt');
	});

	it('selection switches the review area to the selected document', () => {
		addFile('lohnliste_abteilung_q3.txt', 2048, 'txt');
		addFile('netzwerkplan_standort.pdf', 4096, 'pdf');
		vi.runAllTimers();
		fixture.detectChanges();

		const selects = element().querySelectorAll<HTMLButtonElement>('.doclist__select');
		selects[1].click();
		fixture.detectChanges();

		expect(element().querySelector('.doclist__row--selected')).toBe(selects[1].closest('.doclist__row'));
		expect(classification.selectedDocument()?.ext).toBe('pdf');

		const views = element().querySelectorAll<HTMLButtonElement>('[data-testid="doc-view"]');
		expect(views[1].disabled).toBe(true);
		expect(views[0].disabled).toBe(false);
	});

	it('rejects unsupported formats and over-sized files with an alert while keeping existing documents', () => {
		addFile('lohnliste_abteilung_q3.txt', 2048, 'txt');
		vi.runAllTimers();
		fixture.detectChanges();
		const acceptedCountBefore = classification.documents().length;

		addFile('video.mp4', 2048, 'mp4');
		fixture.detectChanges();
		expect(element().querySelectorAll('ob-alert.error, ob-alert.ob-alert-error')).toHaveLength(1);
		expect(classification.documents().length).toBe(acceptedCountBefore);

		addFile('riesig.pdf', 60 * bytesPerMegabyte, 'pdf');
		fixture.detectChanges();
		expect(element().querySelectorAll('ob-alert.error, ob-alert.ob-alert-error')).toHaveLength(1);
		expect(classification.documents().length).toBe(acceptedCountBefore);
	});

	it('advances the ordered stage list while busy and reaches the review area', () => {
		addFile('typ_pruefung.docx', 1024, 'docx');
		fixture.detectChanges();

		expect(element().querySelectorAll('.stages__item')).toHaveLength(4);
		expect(element().querySelectorAll('.stages__item--active')).toHaveLength(1);

		vi.advanceTimersByTime(600);
		fixture.detectChanges();
		expect(element().querySelectorAll('.stages__item--done')).toHaveLength(1);

		vi.advanceTimersByTime(1200);
		fixture.detectChanges();
		expect(element().querySelectorAll('.stages__item--done')).toHaveLength(2);
		expect(element().querySelector('[data-testid="review-area"]')).toBeNull();

		runAnalysis();
		expect(element().querySelector('[data-testid="review-area"]')).toBeTruthy();
		expect(element().querySelector('[data-testid="busy-state"]')).toBeNull();
	});

	it('cancelling the analysis removes the document and confirms by notification', () => {
		addFile('typ_pruefung.docx', 1024, 'docx');
		fixture.detectChanges();

		element().querySelector<HTMLButtonElement>('[data-testid="doc-cancel"]')?.click();
		fixture.detectChanges();

		expect(notificationInfo).toHaveBeenCalled();
		expect(classification.documents()).toHaveLength(0);
	});

	it('shows the low-confidence hint only below 70 per cent', () => {
		addFile('jahresbericht_2026_entwurf.docx', 1024, 'docx');
		runAnalysis();
		expect(element().querySelector('[data-testid="low-confidence-hint"]')).toBeTruthy();

		addFile('FAQ_Datenschutz_fuer_Mitarbeitende.pdf', 2048, 'pdf');
		runAnalysis();
		expect(element().querySelector('[data-testid="low-confidence-hint"]')).toBeNull();
	});

	it('marks the simulated ISG proposal and renders geheim disabled', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		runAnalysis();

		expect(element().querySelectorAll('[data-testid^="isg-tile-"]')).toHaveLength(4);
		expect(element().querySelector('[data-testid="isg-tile-secret"]')?.className).toContain('tile--disabled');
		expect(element().querySelector('[data-testid="isg-tile-secret"]')?.className).not.toContain('tile--marked');
		expect(element().querySelectorAll('[data-testid="isg-card"] .tile--marked')).toHaveLength(1);
	});

	it('the DSG assessment shows the simulated proposal tile', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		runAnalysis();

		expect(element().querySelectorAll('[data-testid^="dsg-tile-"]')).toHaveLength(5);
		expect(element().querySelector('[data-testid="dsg-tile-sensitive"]')?.className).toContain('tile--marked');
	});

	it('the evidence accordions toggle and list quotes with letters', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		runAnalysis();

		const toggles = element().querySelectorAll<HTMLElement>('.ob-collapse-toggle');
		expect(toggles.length).toBeGreaterThan(0);
		expect(toggles[0].getAttribute('aria-expanded')).toBe('false');

		toggles[0].click();
		fixture.detectChanges();
		expect(toggles[0].getAttribute('aria-expanded')).toBe('true');
		expect(element().querySelectorAll('.evidence').length).toBeGreaterThan(0);
		expect(element().querySelectorAll('.evidence__letter').length).toBeGreaterThan(0);
	});

	it('the findings JSON of the selected document matches the fixture (Befund als JSON)', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		runAnalysis();

		const entry = classification.documents()[0];
		if (entry.status !== 'pending') {
			throw new Error('analysis not complete');
		}
		const json = classification.buildJson(entry);
		expect((json['isg'] as {proposal: string}).proposal).toBe('confidential');
		expect(json['rules_version']).toBe('2026-10');
		expect((json['evidence'] as {marker: string}[]).map(evidence => evidence.marker)).toEqual(['A', 'B', 'C']);
		expect((json['dsg'] as {proposal: string}).proposal).toBe('sensitive');
	});

	it('the disclaimer is rendered with the proposals', () => {
		addFile('vertrauensaerztliche_Beurteilung_Personalmedizin.docx', 2048, 'docx');
		runAnalysis();
		expect(element().querySelector('.work-review__disclaimer')).toBeTruthy();
	});
});
