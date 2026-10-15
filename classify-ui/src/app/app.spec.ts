import {TestBed} from '@angular/core/testing';
import {ObMasterLayoutModule, provideObliqueTestingConfiguration} from '@oblique/oblique';
import {beforeAll, vi} from 'vitest';
import {App} from './app';
import {AppModule} from './app-module';
import {DemoPreviewService} from './shared/demo-preview.service';

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
		const preview = TestBed.inject(DemoPreviewService);

		app.openGuidance();

		expect(preview.content()?.kind).toBe('guidance');
	});
});
