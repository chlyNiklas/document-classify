import {Component} from '@angular/core';

interface RuleRow {
	key: 'none' | 'internal' | 'confidential' | 'secret';
	/** Whether the AI proposes the category: always, or only on escalation with an Art. 24 ISV reference. */
	proposal: 'yes' | 'escalation';
}

/** ISG category table rows; "geheim" is proposed only on escalation with an Art. 24 ISV reference. */
const ruleRows: readonly RuleRow[] = [
	{key: 'none', proposal: 'yes'},
	{key: 'internal', proposal: 'yes'},
	{key: 'confidential', proposal: 'yes'},
	{key: 'secret', proposal: 'escalation'}
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
