import type {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {environment} from '../../environments/environment';
import {AuthService} from './auth.service';

const protectedApiPrefix = `${environment.apiBaseUrl}/v1/`;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
	const auth = inject(AuthService);
	const token = auth.accessToken();
	if (!token || !request.url.startsWith(protectedApiPrefix)) {
		return next(request);
	}
	return next(
		request.clone({
			headers: request.headers.set('Authorization', `Bearer ${token}`)
		})
	);
};
