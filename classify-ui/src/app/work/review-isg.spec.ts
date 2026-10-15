import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {provideObliqueTestingConfiguration} from '@oblique/oblique';
import {TranslatePipe} from '@ngx-translate/core';
import {beforeEach, describe, expect, it} from 'vitest';
import type {DocumentResult, IsgClassification} from '../classification/classification';
import {ReviewIsg} from './review-isg';

function makeResult(classification: IsgClassification): DocumentResult {
	return {
		isg: {
			classification,
			reasons: ['Enthält interne Angaben zum Bundesrat.'],
			legalBasis: ['Art. 13 ISV']
		},
		dsg: {
			classification: 'personal_data',
			reasons: ['Enthält Namen.'],
			legalBasis: ['Art. 5 lit. a DSG'],
			findings: [{type: 'name', category: 'personendaten', count: 4}],
			profiling: 'nicht erkannt',
			highRiskProfiling: 'nicht erkannt'
		}
	};
}

describe('ReviewIsg', () => {
	let fixture: ComponentFixture<ReviewIsg>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ReviewIsg],
			imports: [TranslatePipe],
			providers: [provideObliqueTestingConfiguration()]
		}).compileComponents();
	});

	function element(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}

	function create(classification: IsgClassification): void {
		fixture = TestBed.createComponent(ReviewIsg);
		fixture.componentRef.setInput('result', makeResult(classification));
		fixture.detectChanges();
	}

	it('renders three tiles and marks the proposal for a non-secret classification', () => {
		create('confidential');
		expect(element().querySelectorAll('[data-testid^="isg-tile-"]')).toHaveLength(3);
		expect(element().querySelector('[data-testid="isg-tile-secret"]')).toBeNull();
		expect(element().querySelector('[data-testid="isg-tile-confidential"]')?.className).toContain('tile--marked');
		expect(element().querySelectorAll('[data-testid="isg-card"] .tile--marked')).toHaveLength(1);
	});

	it('renders the geheim tile only for a secret classification and marks it', () => {
		create('secret');
		expect(element().querySelectorAll('[data-testid^="isg-tile-"]')).toHaveLength(4);
		expect(element().querySelector('[data-testid="isg-tile-secret"]')?.className).toContain('tile--marked');
		expect(element().querySelectorAll('[data-testid="isg-card"] .tile--marked')).toHaveLength(1);
	});

	it('renders the reasons list of the proposal justification', () => {
		create('confidential');
		const reasons = element().querySelectorAll('[data-testid="isg-reasons"] .review-card__reason');
		expect(reasons).toHaveLength(1);
		expect(reasons[0].textContent.trim()).toBe('Enthält interne Angaben zum Bundesrat.');
	});

	it('renders the legal basis as references', () => {
		create('confidential');
		const references = element().querySelectorAll('[data-testid="isg-legal-basis"] .review-card__reference');
		expect(references).toHaveLength(1);
		expect(references[0].textContent.trim()).toBe('Art. 13 ISV');
	});
});
