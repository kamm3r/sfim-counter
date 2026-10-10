import { describe, expect, it } from 'vitest';
import {
	classifyResult,
	isCombinedEvent,
	normalizeEventName,
} from './classification.js';

function ms(seconds: number): number {
	return seconds * 1000;
}

function cm(metres: number): number {
	return Math.round(metres * 100);
}

describe('classifyResult', () => {
	it('uses the published senior table boundaries', () => {
		expect(classifyResult('100 m', ms(10.20), false, 'Track', 'M')).toBe('SM');
		expect(classifyResult('100 m', ms(10.55), false, 'Track', 'M')).toBe('M');
		expect(classifyResult('100 m', ms(10.95), false, 'Track', 'M')).toBe('A');
		expect(classifyResult('100 m', ms(10.96), false, 'Track', 'M')).toBe('none');

		expect(classifyResult('100 m', ms(11.25), true, 'Track', 'N')).toBe('SM');
		expect(classifyResult('100 m', ms(11.85), true, 'Track', 'N')).toBe('M');
		expect(classifyResult('100 m', ms(12.35), true, 'Track', 'N')).toBe('A');
	});

	it('uses the senior field table and centimetre results', () => {
		expect(classifyResult('M Kuula', cm(19.70), false, 'Field', 'M')).toBe('SM');
		expect(classifyResult('M Kuula', cm(18.00), false, 'Field', 'M')).toBe('M');
		expect(classifyResult('M Kuula', cm(15.60), false, 'Field', 'M')).toBe('A');
		expect(classifyResult('M Kuula', cm(15.59), false, 'Field', 'M')).toBe('none');

		expect(classifyResult('N Korkeus', 189, true, 'Field', 'N')).toBe('SM');
		expect(classifyResult('N Korkeus', 179, true, 'Field', 'N')).toBe('M');
		expect(classifyResult('N Korkeus', 168, true, 'Field', 'N')).toBe('A');
		expect(classifyResult('N Korkeus', 167, true, 'Field', 'N')).toBe('none');
		expect(classifyResult('M Seiväs', 540, false, 'Field', 'M')).toBe('M');
	});

	it('uses the age-specific junior A standards rather than multipliers', () => {
		expect(classifyResult('M17 100 m', ms(11.40), false, 'Track', 'M17')).toBe('A');
		expect(classifyResult('M17 100 m', ms(11.41), false, 'Track', 'M17')).toBe('none');
		expect(classifyResult('N17 100 m', ms(12.85), true, 'Track', 'N17')).toBe('A');
		expect(classifyResult('M15 100 m', ms(12.30), false, 'Track', 'M15')).toBe('A');
		expect(classifyResult('N15 100 m', ms(13.40), true, 'Track', 'N15')).toBe('A');
		expect(classifyResult('M15 Korkeus', 162, false, 'Field', 'M15')).toBe('A');
	});

	it('normalizes Finnish, Swedish, and mixed relay names', () => {
		expect(normalizeEventName('H17/P15 4x100m stafett')).toBe('4x100m');
		expect(normalizeEventName('N 100m aidat (83,8 cm)')).toBe('100mhack');
		expect(normalizeEventName('M Seiväs')).toBe('poleVault');

		expect(classifyResult('H17/P15 4x100m stafett', ms(47.00), false, 'Relay', 'M17')).toBe('A');
		expect(classifyResult('D17/F15 4x100m stafett', ms(52.40), true, 'Relay', 'N17')).toBe('A');
		expect(classifyResult('M17 4x300m stafett', ms(160), false, 'Relay', 'M17')).toBe('A');
		expect(classifyResult('4x100 m', ms(42.00), false, 'Relay', 'M')).toBe('A');
	});

	it('can infer a youth group from the event name', () => {
		expect(classifyResult('M17 100 m', ms(11.40), false, 'Track')).toBe('A');
	});

	it('parses long track times and excludes unknown events from classification', () => {
		expect(classifyResult('1500 m', ms(3 * 60 + 36), false, 'Track', 'M')).toBe('SM');
		expect(classifyResult('marathon', ms(2 * 60 * 60 + 9 * 60 + 30), false, 'Track', 'M')).toBe('SM');
		expect(classifyResult('N 10 km gång', ms(49 * 60), true, 'Track', 'N')).toBe('M');
		expect(classifyResult('not an event', ms(10), false, 'Track', 'M')).toBe('none');
	});
});

describe('isCombinedEvent', () => {
	it('recognizes combined-event names in the supported languages', () => {
		expect(isCombinedEvent('Mångkamp')).toBe(true);
		expect(isCombinedEvent('M 10-ottelu')).toBe(true);
		expect(isCombinedEvent('Women heptathlon')).toBe(true);
		expect(isCombinedEvent('M 100 m')).toBe(false);
	});
});
