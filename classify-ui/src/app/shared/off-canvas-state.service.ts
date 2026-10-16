import {Injectable, signal} from '@angular/core';
import type {DocumentPending} from '../classification/classification';

/** Content types the shared off-canvas sidebar can show (design D2: one consistent overlay). */
export type OffCanvasContent = {kind: 'guidance'} | {kind: 'json'; document: DocumentPending};

/**
 * Shared state behind the off-canvas sidebar:
 * - `content`: what is shown inside the shared master-layout off-canvas sidebar.
 */
@Injectable({providedIn: 'root'})
export class OffCanvasState {
	readonly content = signal<OffCanvasContent | null>(null);

	open(content: OffCanvasContent): void {
		this.content.set(content);
	}

	close(): void {
		this.content.set(null);
	}
}
