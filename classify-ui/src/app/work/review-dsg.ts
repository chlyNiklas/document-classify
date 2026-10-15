import {Component, computed, input} from '@angular/core';
import {
	type DocumentResult,
	type DsgClassification,
	type DsgFindingCategory,
	detectionKey,
	findingCategoryKey
} from '../classification/classification';

/** The three DSG classification tiles, keyed by the canonical API value. */
const dsgTileKeys: readonly DsgClassification[] = ['no_personal_data', 'personal_data', 'sensitive_personal_data'];

@Component({
	selector: 'app-review-dsg',
	standalone: false,
	templateUrl: './review-dsg.html',
	styleUrl: './review-dsg.scss'
})
export class ReviewDsg {
	readonly result = input.required<DocumentResult>();

	readonly tileKeys = dsgTileKeys;
	readonly profilingKey = computed(() => detectionKey(this.result().dsg.profiling));
	readonly highRiskProfilingKey = computed(() => detectionKey(this.result().dsg.highRiskProfiling));

	/** Whether the DSG tile is the proposed classification of the shown document. */
	isMarked(tileKey: DsgClassification): boolean {
		return this.result().dsg.classification === tileKey;
	}

	/** i18n key token of a finding category. */
	categoryKey(category: DsgFindingCategory): string {
		return findingCategoryKey(category);
	}
}
