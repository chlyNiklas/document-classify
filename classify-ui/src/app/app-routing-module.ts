import {NgModule} from '@angular/core';
import {RouterModule, type Routes} from '@angular/router';
import {ObUnknownRouteModule} from '@oblique/oblique';
import {Work} from './work/work';
import {Rules} from './rules/rules';
import {authGuard} from './auth/auth.guard';

const routes: Routes = [
	{path: '', redirectTo: 'work', pathMatch: 'full'},
	{path: 'work', component: Work, canActivate: [authGuard]},
	{path: 'rules', component: Rules, canActivate: [authGuard]},
	{path: '**', redirectTo: 'unknown-route'}
];

@NgModule({
	imports: [RouterModule.forRoot(routes, {anchorScrolling: 'enabled'}), ObUnknownRouteModule],
	exports: [RouterModule]
})
export class AppRoutingModule {}
