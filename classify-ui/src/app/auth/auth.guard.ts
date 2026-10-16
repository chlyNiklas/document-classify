import {inject} from '@angular/core';
import type {CanActivateFn} from '@angular/router';
import {AuthService} from './auth.service';

export const authGuard: CanActivateFn = async () => {
	const auth = inject(AuthService);
	await auth.initialize();
	if (auth.isAuthenticated()) {
		return true;
	}
	auth.login();
	return false;
};
