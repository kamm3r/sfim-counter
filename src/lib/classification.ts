import type { PerformanceClass } from './types.js';

type Thresholds = Partial<Record<Exclude<PerformanceClass, 'none'>, number>>;
type ClassificationGroup = 'senior' | 'M17' | 'N17' | 'M15' | 'N15';

function parseTime(value: string): number {
	const parts = value.replace(',', '.').split(':');
	if (parts.length > 1) {
		return parts.reduce((total, part) => total * 60 + Number(part), 0) * 1000;
	}
	return Number(value.replace(',', '.')) * 1000;
}

function time(SM: string | undefined, M: string | undefined, A: string): Thresholds {
	return {
		...(SM ? { SM: parseTime(SM) } : {}),
		...(M ? { M: parseTime(M) } : {}),
		A: parseTime(A),
	};
}

function distance(SM: number | undefined, M: number | undefined, A: number): Thresholds {
	return {
		...(SM === undefined ? {} : { SM }),
		...(M === undefined ? {} : { M }),
		A,
	};
}

// SFIM rules refer to the 2015 classification table. These thresholds were
// transcribed from the surviving SUL 2012 table and SFI's 15-year-old table;
// any 2015-only changes still need an authoritative copy of that edition.
// Track times are milliseconds; field results are centimetres.
const SENIOR_MEN: Record<string, Thresholds> = {
	'100m': time('10.20', '10.55', '10.95'),
	'200m': time('20.55', '21.60', '22.25'),
	'400m': time('45.60', '48.00', '49.60'),
	'800m': time('1:45.80', '1:50.75', '1:54.50'),
	'1500m': time('3:36.00', '3:45.00', '3:56.50'),
	'3000m': time('7:50.00', '8:15.00', '8:35.00'),
	'5000m': time('13:17.00', '14:15.00', '15:00.00'),
	'10000m': time('27:50.00', '30:00.00', '32:10.00'),
	halfMarathon: time('1:01:20', '1:06:30', '1:11:30'),
	marathon: time('2:09:30', '2:24:00', '2:38:00'),
	'110mhack': time('13.55', '14.30', '15.35'),
	'400mhack': time('49.80', '52.30', '57.25'),
	'3000mhinder': time('8:27.00', '9:03.00', '9:45.00'),
	'5000mwalk': time(undefined, undefined, '23:30.00'),
	'10000mwalk': time('40:30.00', '44:00.00', '49:30.00'),
	'20kmwalk': time('1:21:30', '1:30:00', '1:42:00'),
	'30kmwalk': time('2:09:00', '2:28:00', '2:43:00'),
	'50kmwalk': time('3:53:00', '4:10:00', '4:45:00'),
	highJump: distance(226, 212, 198),
	poleVault: distance(555, 535, 465),
	longJump: distance(800, 770, 700),
	tripleJump: distance(1670, 1540, 1410),
	shot: distance(1970, 1800, 1560),
	discus: distance(6275, 5700, 4700),
	hammer: distance(7450, 7100, 5700),
	javelin: distance(8000, 7700, 7100),
};

const SENIOR_WOMEN: Record<string, Thresholds> = {
	'100m': time('11.25', '11.85', '12.35'),
	'200m': time('23.00', '24.30', '25.40'),
	'400m': time('52.00', '55.75', '58.00'),
	'800m': time('2:01.00', '2:07.00', '2:15.00'),
	'1500m': time('4:07.00', '4:25.00', '4:42.00'),
	'3000m': time('9:05.00', '9:40.00', '10:25.00'),
	'5000m': time('15:20.00', '16:50.00', '18:20.00'),
	'10000m': time('31:50.00', '35:10.00', '38:45.00'),
	halfMarathon: time('1:10:30', '1:19:00', '1:26:00'),
	marathon: time('2:28:00', '2:52:00', '3:12:00'),
	'100mhack': time('13.00', '13.75', '14.75'),
	'400mhack': time('56.60', '60.60', '66.20'),
	'3000mhinder': time('9:50.00', '10:30.00', '12:00.00'),
	'5000mwalk': time('21:55.00', '23:30.00', '26:30.00'),
	'3000mwalk': time(undefined, undefined, '15:30.00'),
	'10kmwalk': time('43:50.00', '49:00.00', '55:00.00'),
	'20kmwalk': time('1:32:00', '1:44:00', '1:58:00'),
	highJump: distance(189, 179, 168),
	poleVault: distance(435, 385, 320),
	longJump: distance(660, 610, 570),
	tripleJump: distance(1400, 1300, 1200),
	shot: distance(1700, 1450, 1200),
	discus: distance(5800, 5200, 4100),
	hammer: distance(6850, 6150, 5100),
	javelin: distance(5750, 5300, 4400),
};

const JUNIOR_A: Record<Exclude<ClassificationGroup, 'senior'>, Record<string, number>> = {
	M17: {
		'100m': parseTime('11.40'),
		'200m': parseTime('23.40'),
		'300m': parseTime('37.00'),
		'400m': parseTime('53.00'),
		'800m': parseTime('2:02.50'),
		'1500m': parseTime('4:24.00'),
		'3000m': parseTime('9:35.00'),
		'110mhack': parseTime('15.40'),
		'300mhack': parseTime('42.25'),
		'400mhack': parseTime('62.00'),
		'1500mhinder': parseTime('5:00.00'),
		'2000mhinder': parseTime('7:20.00'),
		'3000mwalk': parseTime('16:10.00'),
		'5000mwalk': parseTime('27:30.00'),
		'10kmwalk': parseTime('56:00.00'),
		highJump: 180,
		poleVault: 350,
		longJump: 630,
		tripleJump: 1270,
		shot: 1420,
		discus: 4200,
		hammer: 4800,
		javelin: 5900,
	},
	N17: {
		'100m': parseTime('12.85'),
		'200m': parseTime('26.70'),
		'300m': parseTime('42.20'),
		'400m': parseTime('1:01.70'),
		'800m': parseTime('2:24.00'),
		'1500m': parseTime('5:10.00'),
		'3000m': parseTime('11:30.00'),
		'100mhack': parseTime('15.30'),
		'300mhack': parseTime('47.00'),
		'400mhack': parseTime('1:14.00'),
		'1500mhinder': parseTime('6:20.00'),
		'2000mhinder': parseTime('8:20.00'),
		'3000mwalk': parseTime('17:00.00'),
		'5000mwalk': parseTime('29:00.00'),
		'10kmwalk': parseTime('1:03:00'),
		highJump: 155,
		poleVault: 260,
		longJump: 525,
		tripleJump: 1070,
		shot: 1200,
		discus: 3100,
		hammer: 4500,
		javelin: 3800,
	},
	M15: {
		'100m': parseTime('12.30'),
		'300m': parseTime('40.60'),
		'800m': parseTime('2:16.00'),
		'2000m': parseTime('6:45.00'),
		'100mhack': parseTime('15.80'),
		'300mhack': parseTime('45.00'),
		'1500mhinder': parseTime('5:35.00'),
		'3000mwalk': parseTime('18:30.00'),
		highJump: 162,
		poleVault: 270,
		longJump: 550,
		tripleJump: 1120,
		shot: 1240,
		discus: 3600,
		hammer: 3600,
		javelin: 4800,
	},
	N15: {
		'100m': parseTime('13.40'),
		'300m': parseTime('44.70'),
		'800m': parseTime('2:33.00'),
		'2000m': parseTime('7:40.00'),
		'80mhack': parseTime('13.10'),
		'300mhack': parseTime('49.50'),
		'1500mhinder': parseTime('6:20.00'),
		'3000mwalk': parseTime('19:30.00'),
		highJump: 149,
		poleVault: 220,
		longJump: 490,
		tripleJump: 1020,
		shot: 1020,
		discus: 2800,
		hammer: 3200,
		javelin: 3400,
	},
};

// Relay teams have no SM class; the table's columns are M, A, B and C.
const SENIOR_RELAY_MEN: Record<string, Thresholds> = {
	'4x100m': { M: parseTime('41.30'), A: parseTime('43.80') },
	'4x400m': { M: parseTime('3:20.00'), A: parseTime('3:32.00') },
	'4x800m': { M: parseTime('7:40.00'), A: parseTime('8:20.00') },
	'4x1500m': { M: parseTime('16:00.00'), A: parseTime('17:05.00') },
	'4x100mhack': { M: parseTime('61.00'), A: parseTime('65.00') },
	'3x3000mwalk': { M: parseTime('42:30.00'), A: parseTime('44:30.00') },
};

const SENIOR_RELAY_WOMEN: Record<string, Thresholds> = {
	'4x100m': { M: parseTime('47.30'), A: parseTime('51.20') },
	'4x400m': { M: parseTime('3:48.00'), A: parseTime('4:15.00') },
	'4x800m': { M: parseTime('9:08.00'), A: parseTime('10:10.00') },
	'3x3000mwalk': { M: parseTime('48:00.00'), A: parseTime('50:00.00') },
};

const JUNIOR_RELAY_A: Record<Exclude<ClassificationGroup, 'senior'>, Record<string, number>> = {
	M17: { '4x100m': parseTime('47.00'), '4x300m': parseTime('2:40.00') },
	N17: { '4x100m': parseTime('52.40'), '4x300m': parseTime('3:02.00') },
	M15: { '4x100m': parseTime('47.00') },
	N15: { '4x100m': parseTime('52.40') },
};

const EVENT_ALIASES: Record<string, string> = {
	'100m': '100m',
	'200m': '200m',
	'300m': '300m',
	'400m': '400m',
	'800m': '800m',
	'1500m': '1500m',
	'2000m': '2000m',
	'3000m': '3000m',
	'5000m': '5000m',
	'10000m': '10000m',
	'puolimaraton': 'halfMarathon',
	'halvmaraton': 'halfMarathon',
	'halfmarathon': 'halfMarathon',
	'maraton': 'marathon',
	'marathon': 'marathon',
	'80mhack': '80mhack',
	'100mhack': '100mhack',
	'110mhack': '110mhack',
	'300mhack': '300mhack',
	'400mhack': '400mhack',
	'100maidat': '100mhack',
	'80maidat': '80mhack',
	'110maidat': '110mhack',
	'300maidat': '300mhack',
	'400maidat': '400mhack',
	'1500mhinder': '1500mhinder',
	'2000mhinder': '2000mhinder',
	'3000mhinder': '3000mhinder',
	'1500mesteet': '1500mhinder',
	'2000mesteet': '2000mhinder',
	'3000mesteet': '3000mhinder',
	'3000mej': '3000mhinder',
	'5000mgang': '5000mwalk',
	'3000mgang': '3000mwalk',
	'5000mkavely': '5000mwalk',
	'3000mkavely': '3000mwalk',
	'3x3000mgang': '3x3000mwalk',
	'3x3000mkavely': '3x3000mwalk',
	'10000mgang': '10000mwalk',
	'10000mkavely': '10000mwalk',
	'10kmgang': '10kmwalk',
	'10kmkavely': '10kmwalk',
	'20kmgang': '20kmwalk',
	'20kmkavely': '20kmwalk',
	'30kmgang': '30kmwalk',
	'30kmkavely': '30kmwalk',
	'50kmgang': '50kmwalk',
	'50kmkavely': '50kmwalk',
	'kula': 'shot',
	'kuula': 'shot',
	'kulastotning': 'shot',
	'diskus': 'discus',
	'kiekko': 'discus',
	'diskuskastning': 'discus',
	'moukari': 'hammer',
	'slagga': 'hammer',
	'slaggkastning': 'hammer',
	'keihas': 'javelin',
	'spjut': 'javelin',
	'spjutkastning': 'javelin',
	'korkeus': 'highJump',
	'hojd': 'highJump',
	'hojdhopp': 'highJump',
	'seivas': 'poleVault',
	'stav': 'poleVault',
	'stavhopp': 'poleVault',
	'pituus': 'longJump',
	'langd': 'longJump',
	'langdhopp': 'longJump',
	'kolmiloikka': 'tripleJump',
	'tresteg': 'tripleJump',
	'trestegshopp': 'tripleJump',
	'3steg': 'tripleJump',
	'4x100m': '4x100m',
	'4x100mviesti': '4x100m',
	'4x100mstafett': '4x100m',
	'4x400m': '4x400m',
	'4x400mviesti': '4x400m',
	'4x400mstafett': '4x400m',
	'4x300m': '4x300m',
	'4x300mviesti': '4x300m',
	'4x300mstafett': '4x300m',
	'4x800m': '4x800m',
	'4x800mviesti': '4x800m',
	'4x800mstafett': '4x800m',
	'4x1500m': '4x1500m',
	'4x1500mviesti': '4x1500m',
	'4x1500mstafett': '4x1500m',
	'4x100maidat': '4x100mhack',
	'4x100mhack': '4x100mhack',
};

const GROUP_PREFIX = /^(?:[mnhdpft](?:15|17)?(?:\s*\/\s*[mnhdpft](?:15|17)?)?)(?=\s|[0-9])/i;

function normalizeForMatching(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/×/g, 'x')
		.replace(/[^a-z0-9]+/g, '');
}

export function normalizeEventName(name: string): string {
	const withoutGroup = name
		.trim()
		.replace(GROUP_PREFIX, '')
		.replace(/\s*[([{].*?[)\]}]/g, '');
	const compact = normalizeForMatching(withoutGroup);
	return EVENT_ALIASES[compact] ?? compact;
}

export function isCombinedEvent(name: string): boolean {
	const compact = normalizeForMatching(name);
	return [
		'combined',
		'decathlon',
		'heptathlon',
		'octathlon',
		'pentathlon',
		'mangkamp',
		'moniottelu',
		'ottelu',
		'kamp',
		'tiokamp',
		'sjukamp',
		'femkamp',
	].some((term) => compact.includes(term));
}

function normalizeGroup(group: string | undefined): ClassificationGroup {
	const token = group?.toUpperCase().trim().split(/[\s/]+/)[0] ?? '';
	if (token === 'M17' || token === 'H17') return 'M17';
	if (token === 'N17' || token === 'D17') return 'N17';
	if (token === 'M15' || token === 'P15' || token === 'H15') return 'M15';
	if (token === 'N15' || token === 'F15' || token === 'D15' || token === 'T15') return 'N15';
	return 'senior';
}

export function isJuniorGroup(group: string | undefined): boolean {
	return normalizeGroup(group) !== 'senior';
}

export function isCentimetreEvent(eventName: string): boolean {
	const key = normalizeEventName(eventName);
	return key === 'highJump' || key === 'poleVault';
}

function getThresholds(
	eventKey: string,
	isFemale: boolean,
	category: 'Track' | 'Field' | 'Relay',
	group: string | undefined
): Thresholds | null {
	const classificationGroup = normalizeGroup(group);
	if (classificationGroup === 'senior') {
		if (category === 'Relay') return (isFemale ? SENIOR_RELAY_WOMEN : SENIOR_RELAY_MEN)[eventKey] ?? null;
		return (isFemale ? SENIOR_WOMEN : SENIOR_MEN)[eventKey] ?? null;
	}

	if (category === 'Relay') {
		const threshold = JUNIOR_RELAY_A[classificationGroup][eventKey];
		return threshold === undefined ? null : { A: threshold };
	}

	const threshold = JUNIOR_A[classificationGroup][eventKey];
	return threshold === undefined ? null : { A: threshold };
}

export function classifyResult(
	eventName: string,
	parsedValue: number,
	isFemale: boolean,
	category: 'Track' | 'Field' | 'Relay',
	group?: string
): PerformanceClass {
	const effectiveGroup = group || eventName;
	const thresholds = getThresholds(normalizeEventName(eventName), isFemale, category, effectiveGroup);
	if (!thresholds) return 'none';

	const classificationGroup = normalizeGroup(effectiveGroup);
	const isTrack = category === 'Track' || category === 'Relay';
	if (classificationGroup !== 'senior') {
		if (thresholds.A === undefined) return 'none';
		return isTrack ? (parsedValue <= thresholds.A ? 'A' : 'none') : (parsedValue >= thresholds.A ? 'A' : 'none');
	}

	if (isTrack) {
		if (thresholds.SM !== undefined && parsedValue <= thresholds.SM) return 'SM';
		if (thresholds.M !== undefined && parsedValue <= thresholds.M) return 'M';
		if (thresholds.A !== undefined && parsedValue <= thresholds.A) return 'A';
	} else {
		if (thresholds.SM !== undefined && parsedValue >= thresholds.SM) return 'SM';
		if (thresholds.M !== undefined && parsedValue >= thresholds.M) return 'M';
		if (thresholds.A !== undefined && parsedValue >= thresholds.A) return 'A';
	}

	return 'none';
}
