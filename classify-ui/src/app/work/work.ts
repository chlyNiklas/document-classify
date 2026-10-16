import {Component, afterRenderEffect, inject, viewChild} from '@angular/core';
import {ObNotificationService, ObSpinnerService} from '@oblique/oblique';
import type {DocumentPending} from '../classification/classification';
import {ClassificationService} from '../classification/classification.service';
import {OffCanvasState} from '../shared/off-canvas-state.service';
import {WorkIntake} from './work-intake';

/** Spinner channel of the work page busy state. */
export const workSpinnerChannel = 'work-analysis';

@Component({
	selector: 'app-work',
	standalone: false,
	templateUrl: './work.html',
	styleUrl: './work.scss'
})
export class Work {
	/** Access to the intake child (used by the unit tests to simulate upload events). */
	readonly intakeChild = viewChild.required(WorkIntake);

	private readonly service = inject(ClassificationService);
	private readonly offCanvasState = inject(OffCanvasState);
	private readonly notification = inject(ObNotificationService);
	private readonly spinnerService = inject(ObSpinnerService);

	constructor() {
		// The spinner channel is (re-)activated after render while any document
		// analysis runs so that spinners rendered while the channel is already
		// active — e.g. a second busy document — also receive the activation
		// event (design D2).
		afterRenderEffect(() => {
			const analysisRunning = this.service.documents().some(entry => entry.status === 'busy');
			if (analysisRunning) {
				this.spinnerService.deactivate(workSpinnerChannel);
				this.spinnerService.activate(workSpinnerChannel);
			} else {
				this.spinnerService.deactivate(workSpinnerChannel);
			}
		});
	}

	/** The selected document once its classification finished. */
	pendingDocument: () => DocumentPending | null = () => {
		const selected = this.service.selectedDocument();
		return selected?.status === 'pending' ? selected : null;
	};

	/** Cancels the classification; the document is removed and the cancellation confirmed by notification. */
	cancel(id: string): void {
		this.service.cancel(id);
		this.offCanvasState.close();
		this.notification.info({title: 'koby.work.cancel.title', message: 'koby.work.cancel.message'});
	}
}
