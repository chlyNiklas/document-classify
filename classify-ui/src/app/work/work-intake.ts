import {Component, computed, inject, output} from '@angular/core';
import {ObEUploadEventType, type ObIUploadEvent} from '@oblique/oblique';
import {ClassificationService} from '../classification/classification.service';

/** Rejection view of a file not taken over into the workbench. */
export interface RejectionInfo {
	file: string;
	reasonIsFormat: boolean;
	reasonIsSize: boolean;
}

const fileFilter = (candidate: File | string): candidate is File => candidate instanceof File;

@Component({
	selector: 'app-work-intake',
	standalone: false,
	templateUrl: './work-intake.html',
	styleUrl: './work-intake.scss'
})
export class WorkIntake {
	readonly accept = computed(() => this.service.acceptedExtensions.map(extension => `.${extension}`));
	readonly rejectedFiles = computed<RejectionInfo[]>(() =>
		this.service.rejections().map(entry => ({
			file: entry.name,
			reasonIsFormat: entry.reason === 'format',
			reasonIsSize: entry.reason === 'size'
		}))
	);

	readonly canceled = output<string>();

	private readonly service = inject(ClassificationService);

	readonly maxFileSize = (): number => this.service.maxFileSizeMegabytes;

	/** Whether any open rejection is shown. */
	hasRejections(): boolean {
		return this.rejectedFiles().length > 0;
	}

	/** Document count for the document-list header. */
	documentCount(): number {
		return this.service.documents().length;
	}

	onUploadEvent(event: ObIUploadEvent): void {
		const files = Array.isArray(event.files) ? event.files.filter(fileFilter) : [];
		if (event.type === ObEUploadEventType.CHOSEN) {
			const {accepted} = this.service.validate(files);
			this.service.addFiles(accepted);
		} else if (event.type === ObEUploadEventType.ERRORED) {
			// Reasons are recomputed from the drop zone's own rejected files;
			// already present documents are kept untouched.
			this.service.validate(files);
		}
	}

	cancel(id: string): void {
		this.canceled.emit(id);
	}
}
