import {Component, inject, input} from '@angular/core';
import {ObOffCanvasService} from '@oblique/oblique';
import type {DocumentPending} from '../classification/classification';
import {OffCanvasState} from '../shared/off-canvas-state.service';

@Component({
	selector: 'app-work-review',
	standalone: false,
	templateUrl: './work-review.html',
	styleUrl: './work-review.scss'
})
export class WorkReview {
	readonly document = input.required<DocumentPending>();

	private readonly offCanvasState = inject(OffCanvasState);
	private readonly offCanvas = inject(ObOffCanvasService);

	/** Opens the "Befund als JSON" view of the document in the shared off-canvas. */
	openJson(): void {
		this.offCanvasState.open({kind: 'json', document: this.document()});
		this.offCanvas.open = true;
	}
}
