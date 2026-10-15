import {Injectable, signal} from '@angular/core';
import type {DemoDocumentWithResult} from '../mock/mock-classification.service';


/** Content types the shared off-canvas sidebar can show (design.md D2: one consistent overlay). */
export type DemoPreviewState =
	| {kind: 'guidance'}
	| {kind: 'preview'; document: DemoDocumentWithResult}
	| {kind: 'json'; document: DemoDocumentWithResult};

/**
 * Shared state behind the off-canvas sidebar:
 * - `content`: what is shown inside the shared master-layout off-canvas sidebar.
 */
@Injectable({providedIn: 'root'})
export class DemoPreviewService {
	readonly content = signal<DemoPreviewState | null>(null);

	open(state: DemoPreviewState): void {
		this.content.set(state);
	}

	close(): void {
		this.content.set(null);
	}
}
