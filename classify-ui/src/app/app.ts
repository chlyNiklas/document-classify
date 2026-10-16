import {Component, computed, inject, signal} from '@angular/core';
import {ObMasterLayoutService} from '@oblique/oblique';
import {OffCanvasState} from './shared/off-canvas-state.service';

@Component({
	selector: 'app-root',
	standalone: false,
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App {
	readonly year = signal(new Date().getFullYear());
	readonly offCanvasState = inject(OffCanvasState);

	readonly offCanvasTitle = computed(() => {
		const state = this.offCanvasState.content();
		if (state === null) {
			return '';
		}
		return state.kind === 'guidance' ? 'koby.chrome.guidance.title' : 'koby.work.json.title';
	});

	private readonly masterLayout = inject(ObMasterLayoutService);

	constructor() {
		// Oblique does not render the off-canvas surface unless it is explicitly enabled.
		this.masterLayout.layout.hasOffCanvas = true;
	}

	/** Opens the shared off-canvas guidance content. */
	openGuidance(): void {
		this.offCanvasState.open({kind: 'guidance'});
	}
}
