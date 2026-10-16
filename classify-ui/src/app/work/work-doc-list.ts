import {Component, computed, inject, output} from '@angular/core';
import type {ClassifyDocument} from '../classification/classification';
import {ClassificationService} from '../classification/classification.service';
import {fileSizeValue} from '../shared/demo-presenters';

/** Document list row view: name, meta text, status label, status flags and the failure reason. */
export interface DocumentRow {
	id: string;
	name: string;
	meta: string;
	statusLabel: string;
	busy: boolean;
	failed: boolean;
	selected: boolean;
	/** i18n key of the visible failure reason (failed documents only). */
	reasonLabel: string | null;
	/** i18n key of the remove-action label ("Abbrechen" while analysing, "Dokument entfernen" otherwise). */
	actionLabel: string;
}

const statusLabels: Record<ClassifyDocument['status'], string> = {
	busy: 'koby.work.status.busy',
	pending: 'koby.work.status.pending',
	failed: 'koby.work.status.failed'
};

const busyActionLabel = 'koby.work.cancel.label';
const removeActionLabel = 'koby.work.remove.label';

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
			statusLabel: statusLabels[entry.status],
			busy: entry.status === 'busy',
			failed: entry.status === 'failed',
			selected: entry.id === selectedId,
			reasonLabel: entry.status === 'failed' ? entry.failureReason : null,
			actionLabel: entry.status === 'busy' ? busyActionLabel : removeActionLabel
		}));
	});

	readonly displayedColumns: readonly string[] = ['filename', 'status', 'actions'];

	readonly removed = output<string>();

	private readonly service = inject(ClassificationService);

	/** Selects the document for the review area. */
	select(id: string): void {
		this.service.select(id);
	}

	/** Removes the document from the list (aborts a running analysis). */
	remove(id: string): void {
		this.removed.emit(id);
	}
}
