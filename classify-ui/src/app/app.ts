import {Component, computed, inject, signal} from '@angular/core';
import {DemoPreviewService} from './shared/demo-preview.service';
import {previewParagraphs} from './shared/demo-presenters';
import {getDemoSample} from './mock/mock-documents';
import type {DemoImageData} from './mock/demo-samples';

@Component({
	selector: 'app-root',
	standalone: false,
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App {
	readonly year = signal(new Date().getFullYear());
	readonly preview = inject(DemoPreviewService);

	readonly offCanvasTitle = computed(() => {
		const state = this.preview.content();
		if (state === null) {
			return '';
		}
		if (state.kind === 'guidance') {
			return 'koby.chrome.guidance.title';
		}
		if (state.kind === 'preview') {
			return state.document.name;
		}
		return 'koby.work.json.title';
	});

	readonly pageHeader = computed(() => this.previewText()?.header ?? '');
	readonly pageTitle = computed(() => this.previewText()?.title ?? '');
	readonly pageSign = computed(() => this.previewText()?.sign ?? '');

	readonly previewParagraphs = computed<ReturnType<typeof previewParagraphs>>(() => {
		const state = this.preview.content();
		if (state?.kind !== 'preview') {
			return [];
		}
		return previewParagraphs(this.previewText()?.paras ?? [], state.document.result.evidenceLetters);
	});

	private readonly previewText = computed<DemoImageData | null>(() => {
		const state = this.preview.content();
		if (state?.kind === 'preview') {
			return getDemoSample(state.document.sampleId).text;
		}
		return null;
	});

	/** Opens the shared off-canvas guidance content. */
	openGuidance(): void {
		this.preview.open({kind: 'guidance'});
	}
}

