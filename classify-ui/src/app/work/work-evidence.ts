import {Component, input, output} from '@angular/core';
import type {EvidenceReference} from '../shared/demo-presenters';

@Component({
	selector: 'app-work-evidence',
	standalone: false,
	templateUrl: './work-evidence.html',
	styleUrl: './work-evidence.scss'
})
export class WorkEvidence {
	readonly references = input.required<readonly EvidenceReference[]>();
	/** Requests to open the document preview with the evidence quotes marked. */
	readonly requestPreview = output();
}
