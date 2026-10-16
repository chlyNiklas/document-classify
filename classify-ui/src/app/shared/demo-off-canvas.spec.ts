import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideObliqueTestingConfiguration} from '@oblique/oblique';
import {TranslatePipe} from '@ngx-translate/core';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {type ClassifyResponse, type DocumentPending, mapClassifyResponse} from '../classification/classification';
import {OffCanvasState} from './off-canvas-state.service';
import {DemoOffCanvas} from './demo-off-canvas';

const jsonIndent = '  ';

/* eslint-disable @typescript-eslint/naming-convention -- the fixture keeps the API's snake_case keys */
const classifyResponse: ClassifyResponse = {
	isg_isv: {
		classification: 'confidential',
		reasons: ['Enthält interne Angaben zum Bundesrat.'],
		legal_basis: ['Art. 13 ISV']
	},
	dsg: {
		classification: 'personal_data',
		reasons: ['Enthält Namen.'],
		legal_basis: ['Art. 5 lit. a DSG'],
		findings: [{type: 'name', category: 'personendaten', count: 4}],
		profiling: 'möglich',
		high_risk_profiling: 'nicht erkannt'
	}
};
/* eslint-enable @typescript-eslint/naming-convention -- the fixture keeps the API's snake_case keys */

function makePendingDocument(): DocumentPending {
	return {
		id: 'doc-1',
		name: 'bericht.pdf',
		size: 2048,
		ext: 'pdf',
		status: 'pending',
		response: classifyResponse,
		result: mapClassifyResponse(classifyResponse)
	};
}

describe('DemoOffCanvas', () => {
	let fixture: ComponentFixture<DemoOffCanvas>;
	let offCanvasState: OffCanvasState;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DemoOffCanvas],
			imports: [TranslatePipe],
			providers: [provideHttpClient(), provideHttpClientTesting(), provideObliqueTestingConfiguration()]
		}).compileComponents();
		offCanvasState = TestBed.inject(OffCanvasState);
	});

	afterEach(() => {
		TestBed.inject(HttpTestingController).verify({ignoreCancelled: true});
	});

	function element(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}

	it('shows the real stored classification response as formatted JSON', () => {
		offCanvasState.open({kind: 'json', document: makePendingDocument()});
		fixture = TestBed.createComponent(DemoOffCanvas);
		fixture.detectChanges();

		const body = element().querySelector('.demo-doc-json__body');
		expect(body?.textContent.trim()).toBe(JSON.stringify(classifyResponse, null, jsonIndent));
		expect(body?.textContent).toContain('"isg_isv"');
		expect(body?.textContent).toContain('confidential');
		expect(body?.textContent).toContain('high_risk_profiling');
	});

	it('shows no JSON content for the guidance content type', () => {
		offCanvasState.open({kind: 'guidance'});
		fixture = TestBed.createComponent(DemoOffCanvas);
		fixture.detectChanges();

		expect(element().querySelector('.demo-doc-json__body')).toBeNull();
	});

	it('the guidance panel states the four review points as proposal labelling', () => {
		offCanvasState.open({kind: 'guidance'});
		fixture = TestBed.createComponent(DemoOffCanvas);
		fixture.detectChanges();

		const guidance = element().querySelector('.demo-guidance');
		expect(guidance?.querySelector('h3')?.textContent).toContain('koby.chrome.guidance.title');
		expect(guidance?.querySelectorAll('li')).toHaveLength(4);
		const points = guidance?.textContent ?? '';
		expect(points).toContain('koby.chrome.guidance.point-1');
		expect(points).toContain('koby.chrome.guidance.point-2');
		expect(points).toContain('koby.chrome.guidance.point-3');
		expect(points).toContain('koby.chrome.guidance.point-4');
		expect(points).not.toContain('koby.rules.principles.term.confidence');
	});
});
