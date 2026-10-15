import {Component, computed, inject, output} from '@angular/core';
import {MockClassificationService} from '../mock/mock-classification.service';
import {fileSizeValue} from '../shared/demo-presenters';

/** Document list row view: name, meta text, status label and cancel flag. */
export interface DocumentRow {
	id: string;
	name: string;
	meta: string;
	statusLabel: string;
	busy: boolean;
	selected: boolean;
}

@Component({
	selector: 'app-work-doc-list',
	standalone: false,
	templateUrl: './work-doc-list.html',
	styleUrl: './work-doc-list.scss'
})
export class WorkDocList {
	readonly rows = computed<DocumentRow[]>(() => {
		const selectedId = this.service.selectedId();
		return this.service.documents().map(entry => ({
			id: entry.id,
			name: entry.name,
			meta: [entry.ext.toUpperCase(), fileSizeValue(entry.size)].filter(meta => meta.length > 0).join(' · '),
			statusLabel: entry.status === 'busy' ? 'koby.work.status.busy' : 'koby.work.status.pending',
			busy: entry.status === 'busy',
			selected: entry.id === selectedId
		}));
	});

	readonly displayedColumns: readonly string[] = ['filename', 'status', 'actions'];

	readonly canceled = output<string>();

	private readonly service = inject(MockClassificationService);

	/** Selects the document for the review area. */
	select(id: string): void {
		this.service.select(id);
	}

	cancel(id: string): void {
		this.canceled.emit(id);
	}
}
