import {Component, inject, signal} from '@angular/core';
import {HttpClient, type HttpErrorResponse} from '@angular/common/http';
import {ObEUploadEventType, type ObIUploadEvent} from '@oblique/oblique';
import {environment} from '../../environments/environment';

const jsonIndent = 2;

interface ClassificationResult {
	ok: boolean;
	status?: number;
	body: string;
}

@Component({
	selector: 'app-home',
	standalone: false,
	templateUrl: './home.html',
	styleUrl: './home.scss'
})
export class Home {
	readonly pending = signal(false);
	readonly result = signal<ClassificationResult | null>(null);

	private readonly http = inject(HttpClient);
	private readonly classifyUrl = `${environment.apiBaseUrl}/v1/classify/document`;

	onUploadEvent(event: ObIUploadEvent): void {
		if (event.type !== ObEUploadEventType.CHOSEN) {
			return;
		}
		const file = event.files.find((entry): entry is File => entry instanceof File);
		if (!file) {
			return;
		}
		this.classify(file);
	}

	private classify(file: File): void {
		this.result.set(null);
		this.pending.set(true);
		const formData = new FormData();
		formData.append('file', file);
		this.http.post(this.classifyUrl, formData, {responseType: 'text'}).subscribe({
			next: body => {
				this.pending.set(false);
				this.result.set({ok: true, body});
			},
			error: (error: HttpErrorResponse) => {
				this.pending.set(false);
				this.result.set({ok: false, status: error.status, body: this.rawBody(error)});
			}
		});
	}

	private rawBody(error: HttpErrorResponse): string {
		if (typeof error.error === 'string' && error.error.length > 0) {
			return error.error;
		}
		if (error.error !== null && typeof error.error === 'object') {
			return JSON.stringify(error.error, null, jsonIndent);
		}
		return JSON.stringify({status: error.status, message: error.message}, null, jsonIndent);
	}
}
