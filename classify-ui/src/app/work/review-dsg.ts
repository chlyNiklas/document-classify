import {Component, computed, input, output} from '@angular/core';
import {evidenceByScope, evidenceReferences} from '../shared/demo-presenters';
import type {DemoDocumentResult} from '../mock/mock-classification.service';

/** The five DSG assessment tile keys per Art. 5 DSG. */
const dsgTileKeys = ['none', 'personal', 'sensitive', 'profiling', 'profiling_high'] as const;

@Component({
	selector: 'app-review-dsg',
	standalone: false,
	templateUrl: './review-dsg.html',
	styleUrl: './review-dsg.scss'
})
export class ReviewDsg {
	readonly result = input.required<DemoDocumentResult>();

	/** Requests to open the document preview of the shown document in the shared off-canvas. */
	readonly requestPreview = output();

	readonly tileKeys = dsgTileKeys;
	readonly references = computed(() =>
		evidenceReferences(evidenceByScope(this.result().evidence, 'dsg'), this.result().evidenceLetters)
	);

	/** Whether the DSG tile is the simulated proposal of the shown document. */
	isMarked(tileKey: string): boolean {
		return this.result().dsgKind === tileKey;
	}
}
