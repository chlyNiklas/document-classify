import {Injectable, inject} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {runtimeAuthConfig} from './auth-config';

@Injectable({providedIn: 'root'})
export class AuthService {
	private readonly oauth = inject(OAuthService);
	private readonly config = inject(runtimeAuthConfig);
	private initialization: Promise<void> | null = null;

	async initialize(): Promise<void> {
		this.initialization ??= this.initializeOnce();
		await this.initialization;
	}

	isEnabled(): boolean {
		return this.config.enabled;
	}

	isAuthenticated(): boolean {
		return !this.config.enabled || this.oauth.hasValidAccessToken();
	}

	accessToken(): string {
		return this.config.enabled ? this.oauth.getAccessToken() : '';
	}

	login(): void {
		if (this.config.enabled) {
			this.oauth.initCodeFlow();
		}
	}

	logout(): void {
		if (this.config.enabled) {
			this.oauth.logOut();
		}
	}

	private async initializeOnce(): Promise<void> {
		if (!this.config.enabled) {
			return;
		}
		this.oauth.configure({
			issuer: this.config.issuer,
			clientId: this.config.clientId,
			redirectUri: window.location.origin,
			postLogoutRedirectUri: window.location.origin,
			responseType: 'code',
			scope: this.config.scope,
			disablePKCE: false,
			preserveRequestedRoute: true,
			requireHttps: 'remoteOnly',
			strictDiscoveryDocumentValidation: true,
			showDebugInformation: false
		});
		await this.oauth.loadDiscoveryDocumentAndTryLogin();
		if (!this.oauth.hasValidAccessToken()) {
			this.oauth.initCodeFlow();
			return;
		}
		this.oauth.setupAutomaticSilentRefresh();
	}
}
