import {Component, type ElementRef, inject, input, viewChild} from '@angular/core';
import {ObOffCanvasService} from '@oblique/oblique';
import type {DocumentPending} from '../classification/classification';
import {ClassificationService} from '../classification/classification.service';
import {OffCanvasState} from '../shared/off-canvas-state.service';

@Component({
	selector: 'app-work-review',
	standalone: false,
	templateUrl: './work-review.html',
	styleUrl: './work-review.scss'
})
export class WorkReview {
	readonly document = input.required<DocumentPending>();

	readonly moreFilesInput = viewChild.required<ElementRef<HTMLInputElement>>('moreFilesInput');

	/** Additional-document upload accepts the same file list as the drop zone. */
	private readonly service = inject(ClassificationService);
	private readonly offCanvasState = inject(OffCanvasState);
	private readonly offCanvas = inject(ObOffCanvasService);

	/** Opens the "Befund als JSON" view of the document in the shared off-canvas. */
	openJson(): void {
		this.offCanvasState.open({kind: 'json', document: this.document()});
		this.offCanvas.open = true;
	}

	/** Re-opens the browser file picker for an additional document ("Weiteres Dokument hochladen"). */
	addMoreDocument(): void {
		this.moreFilesInput().nativeElement.click();
	}

	/** Validates and classifies files added via "Weiteres Dokument hochladen". */
	readMoreFiles(event: Event): void {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}
		if (target.files !== null) {
			const {accepted} = this.service.validate([...target.files]);
			this.service.addFiles(accepted);
		}
		target.value = '';
	}
}
