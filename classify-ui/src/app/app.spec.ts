import {TestBed} from '@angular/core/testing';
import {ObMasterLayoutModule, ObMasterLayoutService, provideObliqueTestingConfiguration} from '@oblique/oblique';
import {beforeAll, vi} from 'vitest';
import {App} from './app';
import {AppModule} from './app-module';
import {OffCanvasState} from './shared/off-canvas-state.service';

describe('App', () => {
	beforeAll(() => {
		vi.stubGlobal(
			'matchMedia',
			(query: string) =>
				({
					matches: false,
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn()
				}) as MediaQueryList
		);
	});

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppModule, ObMasterLayoutModule],
			providers: [provideObliqueTestingConfiguration()]
		}).compileComponents();
	});

	it('creates the app', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('offers the workbench navigation items for the two sections', () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();
		const anchorHrefs = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a')]
			.map(anchor => anchor.getAttribute('href'));
		expect(anchorHrefs).toContain('/work');
		expect(anchorHrefs).toContain('/rules');
	});

	it('the guidance content state is available for the off-canvas surface', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		const offCanvasState = TestBed.inject(OffCanvasState);

		app.openGuidance();

		expect(offCanvasState.content()?.kind).toBe('guidance');
	});

	it('enables the shared off-canvas surface', () => {
		const masterLayout = {layout: {hasOffCanvas: false}};
		TestBed.overrideProvider(ObMasterLayoutService, {useValue: masterLayout});

		TestBed.runInInjectionContext(() => new App());

		expect(masterLayout.layout.hasOffCanvas).toBe(true);
	});

	it('the app header shows the proposal labelling note', () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();
		const note = (fixture.nativeElement as HTMLElement).querySelector('.app__header-note');
		expect(note?.textContent).toContain('koby.chrome.header-note');
	});
});
