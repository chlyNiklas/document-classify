import {Component, type ElementRef, inject, input, viewChild} from '@angular/core';
import {ObOffCanvasService} from '@oblique/oblique';
import {DemoPreviewService} from '../shared/demo-preview.service';
import {type DemoDocumentWithResult, MockClassificationService} from '../mock/mock-classification.service';

@Component({
	selector: 'app-work-review',
	standalone: false,
	templateUrl: './work-review.html',
	styleUrl: './work-review.scss'
})
export class WorkReview {
	readonly document = input.required<DemoDocumentWithResult>();

	readonly moreFilesInput = viewChild.required<ElementRef<HTMLInputElement>>('moreFilesInput');

	/** Additional-document upload accepts the same file list as the drop zone. */
	private readonly service = inject(MockClassificationService);
	private readonly preview = inject(DemoPreviewService);
	private readonly offCanvas = inject(ObOffCanvasService);

	/** Opens the "Befund als JSON" view of the document in the shared off-canvas. */
	openJson(): void {
		this.preview.open({kind: 'json', document: this.document()});
		this.offCanvas.open = true;
	}

	/** Re-opens the browser file picker for an additional document ("Weiteres Dokument hochladen"). */
	addMoreDocument(): void {
		this.moreFilesInput().nativeElement.click();
	}

	/** Validates files added via "Weiteres Dokument hochladen"; rejected files only raise the alert. */
	readMoreFiles(event: Event): void {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}
		if (target.files !== null) {
			this.service.validate([...target.files]);
		}
		target.value = '';
	}
}
