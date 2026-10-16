import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Injectable, type OnDestroy, inject, signal} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import type {Subscription} from 'rxjs';
import {environment} from '../../environments/environment';
import {
	type AcceptedFileInfo,
	type ClassifyDocument,
	type ClassifyResponse,
	type DocumentBusy,
	type DocumentFailed,
	type DocumentPending,
	type RejectedFileInfo,
	buildJson,
	mapClassifyResponse,
	mapLanguageToAcceptLanguage,
	mapStatusToFailureReason
} from './classification';
const bytesPerMegabyte = 1024 * 1024; // eslint-disable-line @typescript-eslint/no-magic-numbers -- byte conversion factor
const classifyPath = '/v1/classify';
const fileFieldName = 'file';
const acceptLanguageHeader = 'Accept-Language';

let nextId = 0;

/**
 * Real classification data layer of the workbench (design D1): posts each intact file as
 * multipart to the classify service and maps the `{ isg_isv, dsg }` response into the
 * review model. Document state stays in component memory; there is no persistence.
 */
@Injectable({providedIn: 'root'})
export class ClassificationService implements OnDestroy {
	readonly documents = signal<readonly ClassifyDocument[]>([]);
	readonly selectedId = signal<string | null>(null);

	/** Files rejected by the last intake validation, with their reason (supported format, size). */
	readonly rejections = signal<readonly RejectedFileInfo[]>([]);

	/** The file formats the classify service can extract (design D8). */
	readonly acceptedExtensions: readonly string[] = ['pdf', 'docx', 'md', 'txt'];

	/** The upload size limit of the classify service in megabytes (design D8). */
	readonly maxFileSizeMegabytes = 10;

	private readonly http = inject(HttpClient);
	private readonly translate = inject(TranslateService, {optional: true});
	private readonly files = new Map<string, File>();
	private readonly subscriptions = new Map<string, Subscription>();

	get maxFileSizeBytes(): number {
		return this.maxFileSizeMegabytes * bytesPerMegabyte;
	}

	/** The document currently shown in the review area. */
	selectedDocument(): ClassifyDocument | null {
		const id = this.selectedId();
		if (id === null) {
			return null;
		}
		return this.documents().find(entry => entry.id === id) ?? null;
	}

	/** Selects the document shown in the review area. */
	select(id: string): void {
		this.selectedId.set(id);
	}

	/**
	 * Removes the document with the given id: tears down a running classification
	 * (via the document's own subscription) and deletes it from the list.
	 */
	remove(id: string): void {
		this.files.delete(id);
		this.subscriptions.get(id)?.unsubscribe();
		this.subscriptions.delete(id);
		this.documents.update(documents => documents.filter(entry => entry.id !== id));
		if (this.selectedId() === id) {
			this.selectedId.set(null);
		}
	}

	/** The RAW stored classification response ("Befund") of a document, shown via "Befund als JSON". */
	buildJson(entry: DocumentPending): ClassifyResponse {
		return buildJson(entry);
	}

	/**
	 * Validates files against the supported format list and the 10 MB size limit.
	 * Already present documents are never touched; the rejection reasons are recorded
	 * in the rejections signal.
	 */
	validate(files: readonly File[]): {accepted: AcceptedFileInfo[]; rejected: RejectedFileInfo[]} {
		const accepted: AcceptedFileInfo[] = [];
		const rejected: RejectedFileInfo[] = [];
		for (const file of files) {
			const ext = (file.name.split('.').pop() ?? '').toLowerCase();
			if (!this.acceptedExtensions.includes(ext)) {
				rejected.push({name: file.name, reason: 'format'});
			} else if (file.size > this.maxFileSizeBytes) {
				rejected.push({name: file.name, reason: 'size'});
			} else {
				accepted.push({file, ext});
			}
		}
		this.rejections.set(rejected);
		return {accepted, rejected};
	}

	/** Adds accepted files to the workbench and immediately requests their classification. */
	addFiles(accepted: readonly AcceptedFileInfo[]): void {
		if (accepted.length === 0) {
			return;
		}
		const added = accepted.map(({file, ext}) => this.mkDocument(file, ext));
		this.documents.update(documents => [...documents, ...added]);
		this.selectedId.set(added[0].id);
		for (const entry of added) {
			this.request(entry.id);
		}
	}

	ngOnDestroy(): void {
		for (const subscription of this.subscriptions.values()) {
			subscription.unsubscribe();
		}
		this.subscriptions.clear();
		this.files.clear();
	}

	private mkDocument(file: File, ext: string): DocumentBusy {
		nextId += 1;
		const id = `doc-${nextId}`;
		this.files.set(id, file);
		return {id, name: file.name, size: file.size, ext, status: 'busy'};
	}

	/** Posts the intact file as multipart to the classify service (design D4). */
	private request(id: string): void {
		const file = this.files.get(id);
		if (file === undefined) {
			return;
		}
		const form = new FormData();
		form.append(fileFieldName, file, file.name);
		const headers = new HttpHeaders({
			[acceptLanguageHeader]: mapLanguageToAcceptLanguage(this.translate?.currentLang() ?? null)
		});
		const subscription = this.http.post<ClassifyResponse>(`${environment.apiBaseUrl}${classifyPath}`, form, {headers}).subscribe({
			next: response => this.complete(id, response),
			error: (error: HttpErrorResponse) => this.fail(id, error)
		});
		this.subscriptions.set(id, subscription);
	}

	/** Marks the document pending with its mapped result; documents removed meanwhile are left alone. */
	private complete(id: string, response: ClassifyResponse): void {
		this.files.delete(id);
		this.subscriptions.delete(id);
		this.documents.update(documents =>
			documents.map(entry => {
				if (entry.id !== id || entry.status !== 'busy') {
					return entry;
				}
				const pending: DocumentPending = {...entry, status: 'pending', response, result: mapClassifyResponse(response)};
				return pending;
			})
		);
	}

	/** Marks the document failed with a translated reason; documents removed meanwhile are left alone. */
	private fail(id: string, error: HttpErrorResponse): void {
		this.files.delete(id);
		this.subscriptions.delete(id);
		const failureReason = mapStatusToFailureReason(error instanceof HttpErrorResponse ? error.status : 0);
		this.documents.update(documents =>
			documents.map(entry => {
				if (entry.id !== id || entry.status !== 'busy') {
					return entry;
				}
				const failed: DocumentFailed = {...entry, status: 'failed', failureReason};
				return failed;
			})
		);
	}
}
