import {Component, computed, input} from '@angular/core';
import type {DocumentResult, IsgClassification} from '../classification/classification';

/** The four ISG classification tiles, keyed by the canonical API value. */
const isgTileKeys: readonly IsgClassification[] = ['unclassified', 'internal', 'confidential', 'secret'];

@Component({
	selector: 'app-review-isg',
	standalone: false,
	templateUrl: './review-isg.html',
	styleUrl: './review-isg.scss'
})
export class ReviewIsg {
	readonly result = input.required<DocumentResult>();

	/** The rendered tiles; "geheim" is shown only when the classification is secret. */
	readonly visibleTileKeys = computed(() =>
		this.result().isg.classification === 'secret' ? isgTileKeys : isgTileKeys.filter(tileKey => tileKey !== 'secret')
	);

	/** Whether the ISG tile is the proposed classification of the shown document. */
	isMarked(tileKey: IsgClassification): boolean {
		return this.result().isg.classification === tileKey;
	}
}
