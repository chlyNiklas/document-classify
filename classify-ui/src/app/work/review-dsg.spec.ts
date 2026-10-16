import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {provideObliqueTestingConfiguration} from '@oblique/oblique';
import {TranslatePipe} from '@ngx-translate/core';
import {beforeEach, describe, expect, it} from 'vitest';
import type {DocumentResult} from '../classification/classification';
import {ReviewDsg} from './review-dsg';

function makeResult(): DocumentResult {
	return {
		isg: {
			classification: 'internal',
			reasons: ['Enthält interne Angaben.'],
			legalBasis: ['Art. 12 ISV']
		},
		dsg: {
			classification: 'sensitive_personal_data',
			reasons: ['Enthält Gesundheitsdaten.'],
			legalBasis: ['Art. 5 lit. c DSG'],
			findings: [
				{type: 'health_data', category: 'besonders schützenswerte personendaten', count: 3},
				{type: 'name', category: 'personendaten', count: 12}
			],
			profiling: 'möglich',
			highRiskProfiling: 'erkannt'
		}
	};
}

describe('ReviewDsg', () => {
	let fixture: ComponentFixture<ReviewDsg>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ReviewDsg],
			imports: [TranslatePipe],
			providers: [provideObliqueTestingConfiguration()]
		}).compileComponents();
	});

	function element(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}

	function create(): void {
		fixture = TestBed.createComponent(ReviewDsg);
		fixture.componentRef.setInput('result', makeResult());
		fixture.detectChanges();
	}

	it('renders three classification tiles and marks the proposal', () => {
		create();
		expect(element().querySelectorAll('[data-testid^="dsg-tile-"]')).toHaveLength(3);
		expect(element().querySelector('[data-testid="dsg-tile-sensitive_personal_data"]')?.className).toContain('tile--marked');
		expect(element().querySelectorAll('[data-testid="dsg-card"] .tile--marked')).toHaveLength(1);
	});

	it('renders the profiling readout for profiling and high-risk profiling', () => {
		create();
		const readout = element().querySelector('[data-testid="dsg-profiling"]');
		expect(readout?.textContent).toContain('koby.work.dsg.profiling.label');
		expect(readout?.textContent).toContain('koby.work.dsg.detection.possible');
		expect(readout?.textContent).toContain('koby.work.dsg.profiling-high.label');
		expect(readout?.textContent).toContain('koby.work.dsg.detection.detected');
	});

	it('renders the findings list with category and count per finding', () => {
		create();
		const findings = element().querySelectorAll('[data-testid="dsg-finding"]');
		expect(findings).toHaveLength(2);
		expect(findings[0].textContent).toContain('koby.work.dsg.finding-category.sensitive-personal-data');
		expect(findings[0].textContent).toContain('koby.work.dsg.finding-count');
		expect(findings[1].textContent).toContain('koby.work.dsg.finding-category.personal-data');
		expect(findings[1].textContent).not.toBe(findings[0].textContent);
	});
});
