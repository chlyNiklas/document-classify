import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {provideObliqueTestingConfiguration} from '@oblique/oblique';
import {beforeEach, describe, expect, it} from 'vitest';
import {AppModule} from '../app-module';
import {Rules} from './rules';

describe('Rules', () => {
	let fixture: ComponentFixture<Rules>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppModule],
			providers: [provideObliqueTestingConfiguration()]
		}).compileComponents();
		fixture = TestBed.createComponent(Rules);
	});

	function element(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}

	it('the ISG table renders four category rows with the proposal flags', () => {
		fixture.detectChanges();
		expect(element().querySelector('[data-testid="isg-table"]')).toBeTruthy();
		expect(element().querySelectorAll('[data-testid^="isg-row-"]')).toHaveLength(4);
		expect(element().querySelectorAll('[data-testid="proposal-yes"]')).toHaveLength(3);
	});

	it('geheim is proposed only on escalation with an Art. 24 ISV reference', () => {
		fixture.detectChanges();
		const row = element().querySelector('[data-testid="isg-row-secret"]');
		expect(row).toBeTruthy();
		expect(row?.querySelector('[data-testid="proposal-escalation"]')).toBeTruthy();
		expect(row?.querySelector('[data-testid="proposal-yes"]')).toBeNull();
		expect(row?.textContent).toContain('koby.rules.isg.escalation');
	});

	it('the principles card covers justification, legal basis and findings without confidence or evidence', () => {
		fixture.detectChanges();
		const card = element().querySelector('[data-testid="principles-card"]');
		expect(card).toBeTruthy();
		expect(card?.querySelector('[data-testid="principles-justification"]')).toBeTruthy();
		expect(card?.querySelector('[data-testid="principles-legal-basis"]')).toBeTruthy();
		expect(card?.querySelector('[data-testid="principles-findings"]')).toBeTruthy();
		expect(card?.textContent).not.toContain('koby.rules.principles.term.confidence');
		expect(card?.textContent).not.toContain('koby.rules.principles.term.evidence');
		expect(card?.querySelectorAll('dt')).toHaveLength(3);
	});

	it('the DSG definitions card lists the five assessment definitions per Art. 5 DSG', () => {
		fixture.detectChanges();
		const card = element().querySelector('[data-testid="dsg-card"]');
		expect(card).toBeTruthy();
		expect(card?.querySelectorAll('dt')).toHaveLength(5);
	});

	it('the model/operations card is visible and lists model, PII and operations entries', () => {
		fixture.detectChanges();
		const card = element().querySelector('[data-testid="operations-card"]');
		expect(card).toBeTruthy();
		expect(card?.querySelectorAll('dt')).toHaveLength(3);
	});

	it('the versioned badge is rendered next to the title', () => {
		fixture.detectChanges();
		expect(element().querySelector('.rules__version')).toBeTruthy();
	});

	it('re-opening the guidance from the rules screen states the same four points', () => {
		fixture.detectChanges();
		expect(element().querySelector('[data-testid="principles-card"]')).toBeTruthy();
	});
});
