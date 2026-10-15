<script lang="ts">
	import { onMount } from 'svelte';
	import type { TrophyResult } from '$lib/types.js';
	import { clubPositions } from '$lib/scoring.js';
	import { clubEntries, type Trophy } from '$lib/club-entries.js';
	import { locale, getCopy, formatPoints } from '$lib/i18n.js';
	import ClubDetail from './ClubDetail.svelte';

	let { trophies, eventDates, sourceUrls, onopen }: {
		trophies: Record<Trophy, TrophyResult | null>;
		eventDates: ReadonlyMap<number, string>;
		sourceUrls?: Record<Trophy, string>;
		// Narrow screens have no room for the side panel, so the page opens a dialog instead.
		onopen: (name: string, trophy: Trophy) => void;
	} = $props();

	let copy = $derived(getCopy($locale));
	let board = $state<Trophy>('frihetspriset');
	let rankings = $derived(trophies[board]?.rankings ?? []);
	let positions = $derived(clubPositions(rankings));
	// Only the name is kept, so the panel follows each live refresh.
	let picked = $state<string | null>(null);
	let current = $derived(picked !== null && rankings.some((entry) => entry.club.Name === picked) ? picked : rankings[0]?.club.Name ?? null);
	let entries = $derived(current === null ? {} : clubEntries(trophies, { name: current }));

	let wide = $state(true);
	onMount(() => {
		const query = matchMedia('(min-width: 1024px)');
		wide = query.matches;
		const update = () => wide = query.matches;
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	function label(index: number): string {
		const position = String(positions[index]).padStart(2, '0');
		const tied = positions[index - 1] === positions[index] || positions[index + 1] === positions[index];
		return tied ? `=${position}` : position;
	}
	function pick(name: string) {
		if (wide) picked = name;
		else onopen(name, board);
	}
</script>

<div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
	<div class="led-board">
		<div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-[#3a2a00] pb-3">
			<div class="led-tabs" role="tablist" aria-label={copy.standings}>
				{#each [['frihetspriset', 'FRIHETSPRISET'], ['ungdomspokalen', 'UNGDOMSPOKALEN']] as const as [key, title]}
					<button type="button" role="tab" aria-selected={board === key} disabled={!trophies[key]} onclick={() => { board = key; picked = null; }}>{title}</button>
				{/each}
			</div>
			<span class="led led-dim text-[15px]">{copy.pointsLegend.toUpperCase()}</span>
		</div>
		<div class="mt-3">
			{#each rankings as entry, index (entry.club.Name)}
				<button type="button" class="led-row led" style:--i={index} aria-current={entry.club.Name === current && wide} onclick={() => pick(entry.club.Name)}>
					<span>{label(index)}</span>
					<span class="name">{entry.club.Name}</span>
					<span class="pts led {index < 3 ? 'led-green' : 'led-white'}">{formatPoints(entry.totalPoints, $locale)}</span>
				</button>
			{:else}
				<p class="led led-dim py-6 text-center">{copy.noPoints}</p>
			{/each}
		</div>
	</div>

	{#if wide && current}
		<aside class="sticky top-6 border-t-8 border-black pt-4" aria-live="polite">
			{#key current + board}
				<div class="sw-rise">
					<ClubDetail {entries} trophy={board} {eventDates} {sourceUrls} />
				</div>
			{/key}
		</aside>
	{/if}
</div>
