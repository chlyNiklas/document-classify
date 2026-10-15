import {Component, effect, inject, viewChild} from '@angular/core';
import {ObNotificationService, ObSpinnerService} from '@oblique/oblique';
import type {DocumentBusy, DocumentPending} from '../classification/classification';
import {ClassificationService} from '../classification/classification.service';
import {OffCanvasState} from '../shared/off-canvas-state.service';
import {WorkIntake} from './work-intake';

/** Spinner channel of the work page busy state. */
const workSpinnerChannel = 'work-analysis';

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
		// The spinner channel is active while any document analysis runs.
		effect(() => {
			const analysisRunning = this.service.documents().some(entry => entry.status === 'busy');
			if (analysisRunning) {
				this.spinnerService.activate(workSpinnerChannel);
			} else {
				this.spinnerService.deactivate(workSpinnerChannel);
			}
		});
	}

	/** The document in the busy state (first busy document of the workbench). */
	busyDocument: () => DocumentBusy | null = () => {
		const entry = this.service.documents().find((item): item is DocumentBusy => item.status === 'busy');
		return entry ?? null;
	};

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
