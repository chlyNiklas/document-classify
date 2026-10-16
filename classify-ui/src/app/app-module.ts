import {
	LOCALE_ID,
	NgModule,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZoneChangeDetection
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing-module';
import {App} from './app';
import {
	ObAlertModule,
	ObButtonModule,
	ObFileUploadModule,
	ObHttpApiInterceptor,
	ObHttpApiInterceptorConfig,
	ObMasterLayoutModule,
	ObNotificationModule,
	ObOffCanvasModule,
	ObSelectableModule,
	provideObliqueConfiguration
} from '@oblique/oblique';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Work} from './work/work';
import {WorkIntake} from './work/work-intake';
import {WorkDocList} from './work/work-doc-list';
import {WorkReview} from './work/work-review';
import {ReviewIsg} from './work/review-isg';
import {ReviewDsg} from './work/review-dsg';
import {Rules} from './rules/rules';
import {DemoOffCanvas} from './shared/demo-off-canvas';
import {TranslatePipe} from '@ngx-translate/core';
import {registerLocaleData} from '@angular/common';
import localeDECH from '@angular/common/locales/de-CH';
import localeFRCH from '@angular/common/locales/fr-CH';
import localeITCH from '@angular/common/locales/it-CH';
import {OAuthModule} from 'angular-oauth2-oidc';
import {authInterceptor} from './auth/auth.interceptor';
import {AuthService} from './auth/auth.service';

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
		MatIconModule,
		MatTableModule,
		MatTabsModule,
		MatTooltipModule,
		ObFileUploadModule,
		ObAlertModule,
		ObNotificationModule,
		ObOffCanvasModule,
		ObSelectableModule,
		ObMasterLayoutModule,
		OAuthModule.forRoot(),
		TranslatePipe
	],
	declarations: [App, Work, WorkIntake, WorkDocList, WorkReview, ReviewIsg, ReviewDsg, Rules, DemoOffCanvas],
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZoneChangeDetection({eventCoalescing: true}),
		provideAppInitializer(async () => {
			await inject(AuthService).initialize();
		}),
		provideObliqueConfiguration({
			icon: {registerObliqueIcons: true},
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
		{
			provide: ObHttpApiInterceptorConfig,
			useFactory: () => {
				const config = new ObHttpApiInterceptorConfig();
				config.api.spinner = false;
				return config;
			}
		},
		{provide: HTTP_INTERCEPTORS, useClass: ObHttpApiInterceptor, multi: true},
		provideHttpClient(withXhr(), withInterceptors([authInterceptor]), withInterceptorsFromDi()),
		{provide: LOCALE_ID, useValue: 'de-CH'}
	],
	bootstrap: [App]
})
export class AppModule {}
