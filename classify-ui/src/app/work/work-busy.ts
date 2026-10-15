import {Component, input, output} from '@angular/core';
import type {DocumentBusy} from '../classification/classification';

const workSpinnerChannel = 'work-analysis';

@Component({
	selector: 'app-work-busy',
	standalone: false,
	templateUrl: './work-busy.html',
	styleUrl: './work-busy.scss'
})
export class WorkBusy {
	readonly document = input.required<DocumentBusy>();
	readonly canceled = output<string>();

	readonly spinnerChannel = workSpinnerChannel;

	/** Cancels the classification of the visible document. */
	cancelCurrent(): void {
		this.canceled.emit(this.document().id);
	}
}
