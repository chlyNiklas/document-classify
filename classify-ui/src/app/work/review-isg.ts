import {Component, computed, input, output} from '@angular/core';
import {confidenceValue, evidenceByScope, evidenceReferences} from '../shared/demo-presenters';
import type {DemoDocumentResult} from '../mock/mock-classification.service';

/** ISG proposal tile keys; "geheim" is shown disabled and never proposed. */
const isgTileKeys = ['none', 'internal', 'confidential', 'secret'] as const;
/** Below this confidence ratio the low-confidence hint is shown (70 %). */
const lowConfidenceThreshold = 0.7;

@Component({
	selector: 'app-review-isg',
	standalone: false,
	templateUrl: './review-isg.html',
	styleUrl: './review-isg.scss'
})
export class ReviewIsg {
	readonly result = input.required<DemoDocumentResult>();

	/** Requests to open the document preview of the shown document. */
	readonly requestPreview = output();

	readonly tileKeys = isgTileKeys;
	readonly hasLowConfidence = computed(() => this.result().confidence < lowConfidenceThreshold);
	readonly references = computed(() =>
		evidenceReferences(evidenceByScope(this.result().evidence, 'isg'), this.result().evidenceLetters)
	);

	/** Whether the ISG tile is the simulated proposal of the shown document. */
	isMarked(tileKey: string): boolean {
		return this.result().level === tileKey;
	}

	/** "geheim" is rendered disabled and never proposed. */
	isDisabled(tileKey: string): boolean {
		return tileKey === 'secret';
	}

	/** Confidence of a proposal-capable ISG tile from the simulated category distribution. */
	tileConfidence(tileKey: string): string {
		const distribution = this.result().distribution;
		return tileKey === 'none' || tileKey === 'internal' || tileKey === 'confidential'
			? confidenceValue(distribution[tileKey])
			: '';
	}
}
