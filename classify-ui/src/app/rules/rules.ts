import {Component} from '@angular/core';

interface RuleRow {
	key: 'none' | 'internal' | 'confidential' | 'secret';
	proposed: boolean;
}

/** ISG category table rows; "geheim" is documented as never proposed (manual only). */
const ruleRows: readonly RuleRow[] = [
	{key: 'none', proposed: true},
	{key: 'internal', proposed: true},
	{key: 'confidential', proposed: true},
	{key: 'secret', proposed: false}
];

@Component({
	selector: 'app-rules',
	standalone: false,
	templateUrl: './rules.html',
	styleUrl: './rules.scss'
})
export class Rules {
	readonly rows: readonly RuleRow[] = ruleRows;
}
