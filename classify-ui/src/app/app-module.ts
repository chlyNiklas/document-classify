import {LOCALE_ID, NgModule, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing-module';
import {App} from './app';
import {ObButtonModule, ObExternalLinkModule, ObFileUploadModule, ObHttpApiInterceptor, ObMasterLayoutModule, provideObliqueConfiguration} from '@oblique/oblique';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {Home} from './home/home';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {registerLocaleData} from '@angular/common';
import localeDECH from '@angular/common/locales/de-CH';
import localeFRCH from '@angular/common/locales/fr-CH';
import localeITCH from '@angular/common/locales/it-CH';

registerLocaleData(localeDECH);
registerLocaleData(localeFRCH);
registerLocaleData(localeITCH);

@NgModule({
	imports: [BrowserModule, AppRoutingModule, ObButtonModule, MatButtonModule, MatCardModule, MatIconModule, ObExternalLinkModule, ObFileUploadModule, ObMasterLayoutModule, TranslatePipe],
	declarations: [App, Home],
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
