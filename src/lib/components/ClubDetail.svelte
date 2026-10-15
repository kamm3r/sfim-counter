<script lang="ts">
	import type { ClubEntry, Trophy } from '$lib/club-entries.js';
	import { calculated2026Split, official2026Split } from '$lib/official-standings.js';
	import { locale, getCopy, fill, formatDay, formatPoints, translateEventName } from '$lib/i18n.js';

	let { entries, trophy, eventDates, sourceUrls, onclose }: {
		entries: Partial<Record<Trophy, ClubEntry>>;
		trophy: Trophy;
		eventDates: ReadonlyMap<number, string>;
		sourceUrls?: Record<Trophy, string>;
		onclose?: () => void;
	} = $props();

	const TITLES: Record<Trophy, string> = { frihetspriset: 'Frihetspriset', ungdomspokalen: 'Ungdomspokalen' };
	let copy = $derived(getCopy($locale));
	// The tab follows the trophy the club was opened from, but can be switched here.
	let active = $state<Trophy>('frihetspriset');
	let showAll = $state(false);
	let name = $derived((entries.frihetspriset ?? entries.ungdomspokalen)?.club.club.Name ?? '');
	// Reset only when another club or trophy is opened, not on every live refresh.
	let openedFor = '';
	$effect.pre(() => {
		const key = `${name}|${trophy}`;
		if (key === openedFor) return;
		openedFor = key;
		active = entries[trophy] ? trophy : (entries.frihetspriset ? 'frihetspriset' : 'ungdomspokalen');
		showAll = false;
	});
	let entry = $derived(entries[active]);
	let club = $derived(entry?.club);
	let sourceUrl = $derived(sourceUrls?.[active]);
	let counted = $derived(club ? [...club.events].filter((item) => item.points > 0).sort((a, b) => b.points - a.points) : []);
	let shown = $derived(showAll ? counted : counted.slice(0, 6));
	let points = (value: number) => formatPoints(value, $locale);

	// Official 2026 day subtotals when published; otherwise calculated points per competition day.
	let split = $derived.by(() => {
		if (!club) return [];
		const official = sourceUrl ? official2026Split(active, club.club.Name) : undefined;
		if (official) {
			let calculated: number[] = [];
			try { calculated = calculated2026Split(club, active, eventDates); } catch { calculated = []; }
			const labels = active === 'frihetspriset'
				? [`${copy.friday} · ${copy.senior.toLowerCase()}`, `${copy.friday} · ${copy.junior.toLowerCase()}`, `${copy.saturday} · ${copy.senior.toLowerCase()}`, `${copy.saturday} · ${copy.junior.toLowerCase()}`]
				: [copy.friday, copy.saturday];
			return official.map((value, index) => ({ label: labels[index], value, calculated: calculated[index] }));
		}
		const days = new Map<string, { label: string; value: number }>();
		for (const item of club.events) {
			const date = eventDates.get(item.eventId);
			if (!date) continue;
			const key = date.slice(0, 10);
			const day = days.get(key) ?? { label: formatDay(date, $locale), value: 0 };
			day.value += item.points;
			days.set(key, day);
		}
		return [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, day]) => ({ ...day, calculated: undefined as number | undefined }));
	});
	let splitMax = $derived(Math.max(1, ...split.map((day) => day.value)));
</script>

<div class="detail">
	<div class="head">
		<div class="min-w-0">
			<p class="eyebrow">{TITLES[active]}{#if entry}{' · '}{entry.tied ? copy.tiedPlace : copy.place} {entry.place}{/if}</p>
			<h2 class="name" id="club-detail-name">{name}</h2>
		</div>
		{#if onclose}<button type="button" class="close" aria-label={copy.closeProtocol} onclick={onclose}>✕</button>{/if}
	</div>

	<div class="tabs" role="tablist" aria-label={copy.standings}>
		{#each ['frihetspriset', 'ungdomspokalen'] as const as key}
			<button type="button" role="tab" aria-selected={active === key} disabled={!entries[key]} onclick={() => { active = key; showAll = false; }}>{TITLES[key]}</button>
		{/each}
	</div>

	{#if entry && club}
		<div class="total">
			<span class="big num">{points(club.totalPoints)}</span>
			<span class="sw-mute">{club.calculatedPoints !== undefined ? copy.publishedTotal.toLowerCase() : copy.points}{#if entry.place > 1}{' · '}{points(entry.leader.totalPoints - club.totalPoints)} {copy.behindLeader.toLowerCase()}{:else}{' · '}{copy.winner.toLowerCase()}{/if}</span>
		</div>

		{#if split.length}
			<div class="split">
				{#each split as day}
					<div>
						<span class="capitalize">{day.label}</span>
						<b class="num">{points(day.value)}{#if day.calculated !== undefined && day.calculated !== day.value} <span class="delta">({day.value - day.calculated > 0 ? '+' : ''}{points(day.value - day.calculated)})</span>{/if}</b>
						<i style:--v={day.value / splitMax}></i>
					</div>
				{/each}
			</div>
		{/if}

		<h3 class="sw-cap list-head">{copy.biggestPoints}</h3>
		{#if counted.length}
			<ol class="list">
				{#each shown as item}
					<li>
						<span class="min-w-0"><b>{translateEventName(item.eventName, $locale)}</b><small>{item.athleteName} · {item.result || '–'} · {item.placement}. +{points(item.placementPoints)}{#if item.performanceClass !== 'none'} · {item.performanceClass} +{points(item.resultPoints)}{/if}</small></span>
						<span class="pt num">+{points(item.points)}</span>
					</li>
				{/each}
			</ol>
			{#if counted.length > 6}<button type="button" class="more sw-link" onclick={() => showAll = !showAll}>{showAll ? copy.showFewer : fill(copy.showAllClubResults, { count: counted.length })}</button>{/if}
		{:else}
			<p class="sw-mute small">{copy.noPointsInTrophy}</p>
		{/if}

		{#if club.calculatedPoints !== undefined}
			<div class="ledger num">
				<div><span>{copy.eventRowsSum}</span><span>{points(club.calculatedPoints)} p</span></div>
				{#if club.officialAdjustment}<div class="diff"><span>{copy.unallocatedDifference}</span><span>{club.officialAdjustment > 0 ? '+' : ''}{points(club.officialAdjustment)} p</span></div>{/if}
				<div class="final"><span>{copy.officialFinal}</span><span>{points(club.totalPoints)} p</span></div>
			</div>
		{/if}
		<p class="sw-mute small foot">{copy.calculatedNote}{#if sourceUrl} <a class="sw-link" href={sourceUrl} target="_blank" rel="noreferrer">{copy.organizerTable} ↗</a>{/if}</p>
	{:else}
		<p class="sw-mute small">{copy.noPointsInTrophy}</p>
	{/if}
</div>

<style>
	.detail { padding-bottom: 4px; }
	.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
	.eyebrow { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--red); }
	.name { margin: 6px 0 0; font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 900; letter-spacing: -.045em; line-height: .95; }
	.close { flex: none; width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid var(--ink); transition: background-color 120ms ease, color 120ms ease, transform 120ms var(--ease-out); }
	.close:hover { background: var(--ink); color: #fff; }
	.close:active { transform: scale(.94); }
	.tabs { display: flex; gap: 18px; margin-top: 14px; border-bottom: 1px solid var(--rule); }
	.tabs button { padding: 8px 0; font-weight: 600; color: var(--mute); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 150ms ease, border-color 150ms ease; }
	.tabs button:hover:not(:disabled) { color: var(--ink); }
	.tabs button[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--red); }
	.tabs button:disabled { opacity: .35; cursor: default; }
	.total { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; margin-top: 18px; }
	.big { font-size: 72px; font-weight: 900; letter-spacing: -.06em; line-height: .85; color: var(--red); }
	.split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin-top: 16px; }
	.split > div { display: grid; grid-template-columns: 1fr auto; row-gap: 6px; font-size: 13px; }
	.split b { font-weight: 800; }
	.delta { color: var(--red); font-weight: 600; }
	.split i { grid-column: 1 / -1; height: 4px; background: var(--rule); position: relative; overflow: hidden; }
	.split i::after { content: ''; position: absolute; inset: 0; background: var(--ink); transform-origin: left; transform: scaleX(var(--v)); transition: transform 400ms var(--ease-out); }
	.list-head { margin: 22px 0 0; padding-bottom: 8px; border-bottom: 1px solid var(--ink); }
	.list { list-style: none; margin: 0; padding: 0; }
	.list li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--rule); }
	.list small { display: block; margin-top: 2px; color: var(--mute); font-size: 12.5px; }
	.pt { font-weight: 900; font-size: 20px; color: var(--red); }
	.more { display: inline-block; margin-top: 12px; font-size: 13px; }
	.ledger { margin-top: 18px; font-size: 13px; }
	.ledger > div { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; }
	.ledger .diff { color: var(--red); }
	.ledger .final { margin-top: 4px; padding-top: 8px; border-top: 1px solid var(--ink); font-weight: 800; }
	.small { font-size: 12px; margin: 14px 0 0; }
	.foot { margin-top: 16px; }
</style>
