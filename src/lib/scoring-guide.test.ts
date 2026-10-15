import { describe, expect, it } from 'vitest';
import { scoringExamples } from './scoring-guide.js';

describe('user-facing scoring examples', () => {
	it('shows the promised placing and A-class bonus for both trophies', () => {
		const examples = scoringExamples();
		expect(examples.map((example) => [example.frihetspriset.placementPoints, example.frihetspriset.resultPoints, example.frihetspriset.totalPoints]))
			.toEqual([[5, 5, 10], [2, 3, 5], [0, 0, 0]]);
		expect(examples.map((example) => example.ungdomspokalen && [example.ungdomspokalen.placementPoints, example.ungdomspokalen.resultPoints, example.ungdomspokalen.totalPoints]))
			.toEqual([undefined, [5, 5, 10], [3, 5, 8]]);
		for (const example of examples) {
			expect(example.frihetspriset).toMatchObject({ placement: example.place, performanceClass: 'A', isValid: true });
		}
	});
});
