import {platformBrowser} from '@angular/platform-browser';
import {loadRuntimeAuthConfig, runtimeAuthConfig} from './app/auth/auth-config';
import {AppModule} from './app/app-module';

loadRuntimeAuthConfig()
	.then(async config => {
		await platformBrowser([{provide: runtimeAuthConfig, useValue: config}]).bootstrapModule(AppModule, {});
	})
	.catch((error: unknown) => console.error('Application startup failed', error));
