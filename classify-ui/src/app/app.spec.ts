import {TestBed} from '@angular/core/testing';
import {RouterModule} from '@angular/router';
import {App} from './app';
import {AppModule} from './app-module';
import {ObMasterLayoutModule, provideObliqueTestingConfiguration} from '@oblique/oblique';

describe('App', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterModule.forRoot([]), AppModule, ObMasterLayoutModule],
			declarations: [],
			providers: [provideObliqueTestingConfiguration()]
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});
});
