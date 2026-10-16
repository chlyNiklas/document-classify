import {InjectionToken} from '@angular/core';

export interface RuntimeAuthConfig {
	enabled: boolean;
	issuer: string;
	clientId: string;
	scope: string;
}

export const disabledAuthConfig: RuntimeAuthConfig = {
	enabled: false,
	issuer: '',
	clientId: '',
	scope: 'openid profile document:classify'
};

export const runtimeAuthConfig = new InjectionToken<RuntimeAuthConfig>('runtime-auth-config', {
	providedIn: 'root',
	factory: () => disabledAuthConfig
});

export async function loadRuntimeAuthConfig(url = '/assets/auth-config.json'): Promise<RuntimeAuthConfig> {
	const response = await fetch(url, {cache: 'no-store'});
	if (!response.ok) {
		throw new Error(`Could not load authentication configuration (${response.status})`);
	}
	const value: unknown = await response.json();
	if (!isRecord(value)) {
		throw new Error('Authentication configuration must be a JSON object');
	}
	const config: RuntimeAuthConfig = {
		enabled: value['enabled'] === true,
		issuer:
			typeof value['issuer'] === 'string' ? value['issuer'].trim().replace(/\/$/u, '') : '',
		clientId: typeof value['clientId'] === 'string' ? value['clientId'].trim() : '',
		scope:
			typeof value['scope'] === 'string' && value['scope'].trim()
				? value['scope'].trim()
				: disabledAuthConfig.scope
	};
	if (config.enabled && (!config.issuer || !config.clientId)) {
		throw new Error('Authentication is enabled but issuer or clientId is missing');
	}
	return config;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
