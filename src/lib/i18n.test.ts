import { describe, expect, it } from 'vitest';
import snapshot2025 from './sfim-2025.fixture.json';
import snapshot2026 from './sfim-2026.fixture.json';
import { archiveLinkLabel, fill, formatDate, formatPoints, getCopy, LOCALES, translateEventName } from './i18n.js';

describe('site languages', () => {
	it('provides a complete, nonempty copy set in all three languages', () => {
		const keys = Object.keys(getCopy('sv')).sort();
		for (const selected of LOCALES) {
			expect(Object.keys(getCopy(selected)).sort()).toEqual(keys);
			for (const value of Object.values(getCopy(selected))) expect(value.trim()).not.toBe('');
		}
	});

	it('localizes point totals and template text', () => {
		expect(formatPoints(180.5, 'sv')).toBe('180,5');
		expect(formatPoints(180.5, 'fi')).toBe('180,5');
		expect(formatPoints(180.5, 'en')).toBe('180.5');
		expect(formatPoints(16, 'en')).toBe('16');
		expect(formatPoints(16 / 3, 'en')).toBe('≈5.33');
		expect(formatPoints((16 / 3) * 3, 'en')).toBe('16');
		expect(formatDate('2026-07-09T22:30:00Z', 'en')).toBe('10/07/2026');
		expect(fill(getCopy('en').showFullTable, { count: 12 })).toBe('Show full table · 12 clubs');
		expect(archiveLinkLabel('Dag 2', 'fi')).toBe('Päivä 2');
	});

	it('translates Swedish and Finnish source event names without changing the source data', () => {
		expect(translateEventName('D17 100m häck', 'fi')).toBe('N17 100m aidat');
		expect(translateEventName('N17 4x100m viesti', 'sv')).toBe('D17 4×100m stafett');
		expect(translateEventName('P15 3-Steg', 'en')).toBe('Boys U15 triple jump');
		expect(translateEventName('N15 Kolmiloikka', 'en')).toBe('Girls U15 triple jump');
		expect(translateEventName('M 3000m esteet', 'sv')).toBe('H 3000m hinder');
	});

	it('renders every archived event with an English group label', () => {
		for (const event of [...snapshot2025, ...snapshot2026]) {
			expect(translateEventName(event.Name, 'en'), event.Name).toMatch(/^(Women|Men|Girls|Boys)/);
		}
	});
});
