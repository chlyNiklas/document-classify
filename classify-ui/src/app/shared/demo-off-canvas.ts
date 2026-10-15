import {Component, computed, inject} from '@angular/core';
import {ObNotificationService} from '@oblique/oblique';
import {MockClassificationService} from '../mock/mock-classification.service';
import {DemoPreviewService} from '../shared/demo-preview.service';

/** Flat JSON rendering with two-space indentation. */
const jsonIndent = '  ';

@Component({
	selector: 'app-demo-off-canvas',
	standalone: false,
	templateUrl: './demo-off-canvas.html'
})
export class DemoOffCanvas {
	readonly content = inject(DemoPreviewService).content;

	// The classification service is resolved lazily: the JSON finding is computed on render only.
	readonly jsonFinding = computed(() => {
		const state = this.content();
		if (state?.kind !== 'json') {
			return '';
		}
		return JSON.stringify(this.classification.buildJson(state.document), null, jsonIndent);
	});

	private readonly notification = inject(ObNotificationService);
	private readonly classification = inject(MockClassificationService);

	/** Copies the "Befund als JSON" text to the clipboard and confirms the success. */
	copyJson(): void {
		const state = this.content();
		if (state?.kind !== 'json') {
			return;
		}
		const finding = this.jsonFinding();
		navigator.clipboard.writeText(finding).then(
			() => this.notification.success({title: 'koby.work.json.copied-title', message: 'koby.work.json.copied-message'}),
			() => undefined
		);
	}
}
