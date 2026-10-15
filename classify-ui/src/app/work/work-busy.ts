import {Component, computed, input, output} from '@angular/core';
import type {DemoDocumentAwaitingAnalysis} from '../mock/mock-classification.service';

/** The four simulated analysis stages of the demo pipeline, translated via `koby.work.stage.*`. */
const stageLabelKeys = ['koby.work.stage.1', 'koby.work.stage.2', 'koby.work.stage.3', 'koby.work.stage.4'];
const percentFactor = 100;
const workSpinnerChannel = 'work-analysis';

@Component({
	selector: 'app-work-busy',
	standalone: false,
	templateUrl: './work-busy.html',
	styleUrl: './work-busy.scss'
})
export class WorkBusy {
	readonly document = input.required<DemoDocumentAwaitingAnalysis>();
	readonly canceled = output<string>();

	readonly stageKeys = stageLabelKeys;
	readonly spinnerChannel = workSpinnerChannel;
	/** Active stage index (1-based) for the ordered stage list. */
	readonly stageActive = computed(() => this.document().step + 1);
	readonly progressPercent = computed(() => Math.round((this.document().step * percentFactor) / this.stageKeys.length));

	/** Cancels the analysis of the visible document. */
	cancelCurrent(): void {
		this.canceled.emit(this.document().id);
	}
}
