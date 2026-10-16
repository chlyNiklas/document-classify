import {Component, inject, viewChild} from '@angular/core';
import {ObNotificationService} from '@oblique/oblique';
import type {DocumentPending} from '../classification/classification';
import {ClassificationService} from '../classification/classification.service';
import {OffCanvasState} from '../shared/off-canvas-state.service';
import {WorkIntake} from './work-intake';

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

	/** The selected document once its classification finished. */
	pendingDocument: () => DocumentPending | null = () => {
		const selected = this.service.selectedDocument();
		return selected?.status === 'pending' ? selected : null;
	};

	/**
	 * Removes the document from the list. A running analysis is aborted; the action is
	 * confirmed by a notification that distinguishes cancellation from removal.
	 */
	remove(id: string): void {
		const status = this.service.documents().find(entry => entry.id === id)?.status;
		this.service.remove(id);
		this.offCanvasState.close();
		if (status === 'busy') {
			this.notification.info({title: 'koby.work.cancel.title', message: 'koby.work.cancel.message'});
		} else {
			this.notification.info({title: 'koby.work.remove.title', message: 'koby.work.remove.message'});
		}
	}
}
