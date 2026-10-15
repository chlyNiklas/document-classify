import {LOCALE_ID, NgModule, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing-module';
import {App} from './app';
import {
	ObAlertModule,
	ObButtonModule,
	ObCollapseModule,
	ObFileUploadModule,
	ObHttpApiInterceptor,
	ObMasterLayoutModule,
	ObNotificationModule,
	ObOffCanvasModule,
	ObSelectableModule,
	ObSpinnerModule,
	provideObliqueConfiguration
} from '@oblique/oblique';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {Work} from './work/work';
import {WorkIntake} from './work/work-intake';
import {WorkDocList} from './work/work-doc-list';
import {WorkBusy} from './work/work-busy';
import {WorkReview} from './work/work-review';
import {ReviewIsg} from './work/review-isg';
import {ReviewDsg} from './work/review-dsg';
import {WorkEvidence} from './work/work-evidence';
import {Rules} from './rules/rules';
import {DemoOffCanvas} from './shared/demo-off-canvas';
import {DemoDocPreview} from './shared/demo-doc-preview';
import {TranslatePipe} from '@ngx-translate/core';
import {registerLocaleData} from '@angular/common';
import localeDECH from '@angular/common/locales/de-CH';
import localeFRCH from '@angular/common/locales/fr-CH';
import localeITCH from '@angular/common/locales/it-CH';

registerLocaleData(localeDECH);
registerLocaleData(localeFRCH);
registerLocaleData(localeITCH);

@NgModule({
	imports: [
		BrowserModule,
		AppRoutingModule,
		ObButtonModule,
		MatButtonModule,
		MatChipsModule,
		MatProgressBarModule,
		ObFileUploadModule,
		ObAlertModule,
		ObNotificationModule,
		ObSpinnerModule,
		ObCollapseModule,
		ObOffCanvasModule,
		ObSelectableModule,
		ObMasterLayoutModule,
		TranslatePipe
	],
	declarations: [App, Work, WorkIntake, WorkDocList, WorkBusy, WorkReview, ReviewIsg, ReviewDsg, WorkEvidence, Rules, DemoOffCanvas, DemoDocPreview],
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZoneChangeDetection({eventCoalescing: true}),
		provideObliqueConfiguration({
			translate: {locales: {locales: ['de-CH', 'fr-CH', 'it-CH'], defaultLanguage: 'de'}},
			accessibilityStatement: {
				applicationName: 'classify-ui',
				conformity: 'none',
				createdOn: new Date('2026-10-15'),
				applicationOperator: 'Koby Classify',
				contact: [{email: 'foo@bit.admin.ch'}]
			},
			language: {hasLanguageInUrl: false}
		}),
		{provide: HTTP_INTERCEPTORS, useClass: ObHttpApiInterceptor, multi: true},
		provideHttpClient(withXhr(), withInterceptorsFromDi()),
		{provide: LOCALE_ID, useValue: 'de-CH'}
	],
	bootstrap: [App]
})
export class AppModule {}
