import {Component, computed, inject} from '@angular/core';
import {DemoPreviewService} from './demo-preview.service';
import {type PreviewParagraph, previewParagraphSegments} from './demo-presenters';
import {getDemoSample} from '../mock/mock-documents';
import type {DemoImageData} from '../mock/demo-samples';

@Component({
	selector: 'app-demo-doc-preview',
	standalone: false,
	templateUrl: './demo-doc-preview.html'
})
export class DemoDocPreview {
	readonly header = computed(() => this.previewText()?.header ?? '');
	readonly title = computed(() => this.previewText()?.title ?? '');
	readonly sign = computed(() => this.previewText()?.sign ?? '');

	// The preview paragraphs mark every evidence quote with its marker letter.
	readonly paragraphs = computed<PreviewParagraph[]>(() => {
		const state = this.preview.content();
		if (state?.kind !== 'preview') {
			return [];
		}
		const sampleText = this.previewText();
		return (sampleText?.paras ?? []).map(paragraph => ({
			segments: previewParagraphSegments(paragraph, state.document.result.evidenceLetters)
		}));
	});

	private readonly preview = inject(DemoPreviewService);
	private readonly previewText = computed<DemoImageData | null>(() => {
		const state = this.preview.content();
		return state?.kind === 'preview' ? getDemoSample(state.document.sampleId).text : null;
	});
}
