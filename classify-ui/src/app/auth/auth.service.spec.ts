import {TestBed} from '@angular/core/testing';
import {OAuthService} from 'angular-oauth2-oidc';
import {vi} from 'vitest';
import {type RuntimeAuthConfig, runtimeAuthConfig} from './auth-config';
import {AuthService} from './auth.service';

interface SetupResult {
	service: AuthService;
	oauth: {
		configure: ReturnType<typeof vi.fn>;
		loadDiscoveryDocumentAndTryLogin: ReturnType<typeof vi.fn>;
		hasValidAccessToken: ReturnType<typeof vi.fn>;
		getAccessToken: ReturnType<typeof vi.fn>;
		initCodeFlow: ReturnType<typeof vi.fn>;
		setupAutomaticSilentRefresh: ReturnType<typeof vi.fn>;
		logOut: ReturnType<typeof vi.fn>;
	};
}

function setup(config: RuntimeAuthConfig, hasToken: boolean): SetupResult {
	const oauth = {
		configure: vi.fn(),
		loadDiscoveryDocumentAndTryLogin: vi.fn().mockResolvedValue(true),
		hasValidAccessToken: vi.fn().mockReturnValue(hasToken),
		getAccessToken: vi.fn().mockReturnValue('access-token'),
		initCodeFlow: vi.fn(),
		setupAutomaticSilentRefresh: vi.fn(),
		logOut: vi.fn()
	};
	TestBed.configureTestingModule({
		providers: [
			AuthService,
			{provide: runtimeAuthConfig, useValue: config},
			{provide: OAuthService, useValue: oauth}
		]
	});
	return {service: TestBed.inject(AuthService), oauth};
}

describe('AuthService', () => {
	it('does not contact an identity provider when authentication is disabled', async () => {
		const {service, oauth} = setup({enabled: false, issuer: '', clientId: '', scope: ''}, false);

		await service.initialize();

		expect(service.isAuthenticated()).toBe(true);
		expect(oauth.configure).not.toHaveBeenCalled();
	});

	it('configures code flow with PKCE and accepts an existing access token', async () => {
		const {service, oauth} = setup(
			{
				enabled: true,
				issuer: 'https://identity.example/realms/classify',
				clientId: 'classify-ui',
				scope: 'openid profile document:classify'
			},
			true
		);

		await service.initialize();

		expect(oauth.configure).toHaveBeenCalledWith(
			expect.objectContaining({responseType: 'code', disablePKCE: false})
		);
		expect(oauth.setupAutomaticSilentRefresh).toHaveBeenCalled();
		expect(oauth.initCodeFlow).not.toHaveBeenCalled();
	});

	it('starts login when no access token is available', async () => {
		const {service, oauth} = setup(
			{
				enabled: true,
				issuer: 'https://identity.example/realms/classify',
				clientId: 'classify-ui',
				scope: 'openid profile document:classify'
			},
			false
		);

		await service.initialize();

		expect(oauth.initCodeFlow).toHaveBeenCalledOnce();
	});
});
