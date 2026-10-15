import {Component, effect, inject, viewChild} from '@angular/core';
import {ObNotificationService, ObOffCanvasService, ObSpinnerService} from '@oblique/oblique';
import {
	type DemoDocumentAwaitingAnalysis,
	type DemoDocumentWithResult,
	MockClassificationService
} from '../mock/mock-classification.service';
import {DemoPreviewService} from '../shared/demo-preview.service';
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

	private readonly service = inject(MockClassificationService);
	private readonly preview = inject(DemoPreviewService);
	private readonly offCanvas = inject(ObOffCanvasService);
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
	busyDocument: () => DemoDocumentAwaitingAnalysis | null = () => {
		const entry = this.service.documents().find((item): item is DemoDocumentAwaitingAnalysis => item.status === 'busy');
		return entry ?? null;
	};

	/** The selected document once its simulated analysis is finished. */
	pendingDocument: () => DemoDocumentWithResult | null = () => {
		const selected = this.service.selectedDocument();
		return selected?.status === 'pending' ? selected : null;
	};

	/** Opens the shared off-canvas with the "Hinweise zur Prüfung" guidance (ob-alert trigger). */
	openGuidance: () => void = () => {
		this.preview.open({kind: 'guidance'});
		this.offCanvas.open = true;
	};

	/** Cancels the analysis; the document is removed and the cancellation confirmed by notification. */
	cancel(id: string): void {
		this.service.cancel(id);
		this.preview.close();
		this.notification.info({title: 'koby.work.cancel.title', message: 'koby.work.cancel.message'});
	}
}
