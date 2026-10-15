<script lang="ts">
	import type { EventDetail, ScoredResult, TrophyResult } from '$lib/types.js';
	import { isCombinedEvent, isJuniorGroup } from '$lib/classification.js';
	import { locale, getCopy, fill, formatPoints, formatDay, formatClock } from '$lib/i18n.js';

	type EventRow = EventDetail & { date: string; displayName: string };
	let { events, frihetBreakdown, youthBreakdown, onclub }: {
		events: EventRow[];
		frihetBreakdown: TrophyResult['eventBreakdown'];
		youthBreakdown: TrophyResult['eventBreakdown'];
		onclub: (id: number, name: string) => void;
	} = $props();

	let copy = $derived(getCopy($locale));
	let query = $state('');
	let day = $state('all');
	let category = $state<'all' | 'senior' | 'junior'>('all');
	let openEvent = $state<number | null>(null);
	let frihetById = $derived(new Map(frihetBreakdown.map((event) => [event.eventId, event.results])));
	let youthById = $derived(new Map(youthBreakdown.map((event) => [event.eventId, event.results])));
	const medals = ['#ffb000', '#b9c0c8', '#c98a55'];

	// Competition days in start order, keyed by local date.
	let days = $derived([...new Map(events.filter((event) => event.BeginDateTimeWithTZ).map((event) => [event.BeginDateTimeWithTZ.slice(0, 10), formatDay(event.BeginDateTimeWithTZ, $locale)])).entries()]);
	let filtered = $derived(events.filter((event) => {
		const junior = isJuniorGroup(event.Group || event.Name);
		if (category === 'junior' && !junior) return false;
		if (category === 'senior' && junior) return false;
		if (day !== 'all' && event.BeginDateTimeWithTZ?.slice(0, 10) !== day) return false;
		const term = query.trim().toLocaleLowerCase('sv-FI');
		if (!term) return true;
		return event.displayName.toLocaleLowerCase('sv-FI').includes(term) || event.Name.toLocaleLowerCase('sv-FI').includes(term) ||
			(frihetById.get(event.Id) ?? []).some((result) =>
				result.athleteName.toLocaleLowerCase('sv-FI').includes(term) || result.club.Name.toLocaleLowerCase('sv-FI').includes(term));
	}));

	function ordered(results: ScoredResult[]): ScoredResult[] {
		return [...results].sort((a, b) => (a.isValid === b.isValid ? a.placement - b.placement : a.isValid ? -1 : 1));
	}
	function youthFor(event: number, result: ScoredResult) {
		return (youthById.get(event) ?? []).find((item) => item.athleteName === result.athleteName && item.club.Id === result.club.Id && item.result === result.result);
	}
	let points = (value: number) => formatPoints(value, $locale);
</script>

<div class="sw-filters">
	<div class="sw-seg" role="group" aria-label={copy.allDays}>
		<button type="button" aria-pressed={day === 'all'} onclick={() => day = 'all'}>{copy.allDays}</button>
		{#each days as [key, label]}<button type="button" aria-pressed={day === key} onclick={() => day = key}>{label}</button>{/each}
	</div>
	<div class="sw-seg" role="group" aria-label={copy.filterClass}>
		{#each [['all', copy.allClasses], ['senior', copy.senior], ['junior', copy.junior]] as [value, label]}
			<button type="button" aria-pressed={category === value} onclick={() => category = value as typeof category}>{label}</button>
		{/each}
	</div>
	<span class="sw-mute num">{fill(copy.eventsShown, { shown: filtered.length, total: events.length })}</span>
	<input type="search" class="sw-search" bind:value={query} placeholder={copy.searchPlaceholder} aria-label={copy.searchPlaceholder} />
</div>

<div class="grid gap-x-6 md:grid-cols-2 xl:grid-cols-3">
	{#each filtered as event (event.Id)}
		{@const results = ordered(frihetById.get(event.Id) ?? [])}
		{@const valid = results.filter((result) => result.isValid)}
		{@const podium = valid.filter((result) => result.placement <= 3)}
		{@const isJunior = isJuniorGroup(event.Group || event.Name)}
		{@const open = openEvent === event.Id}
		<article class="border-t border-black pb-6 pt-3 {open ? 'md:col-span-2 xl:col-span-3' : ''}">
			<h3 class="mb-2.5 flex items-baseline justify-between gap-3 text-[18px] font-bold leading-tight">
				<span>{event.displayName}</span>
				<span class="shrink-0 text-[13px] font-medium capitalize text-[var(--mute)]">{event.BeginDateTimeWithTZ ? `${formatDay(event.BeginDateTimeWithTZ, $locale)} ${formatClock(event.BeginDateTimeWithTZ, $locale)}` : event.date}</span>
			</h3>
			{#if isCombinedEvent(event.Name)}<p class="mb-2 text-xs text-[var(--mute)]">{copy.notInFrihetspriset}</p>{/if}

			{#if !open}
				<ol class="m-0 list-none p-0">
					{#each podium as result}
						{@const youth = youthFor(event.Id, result)}
						<li class="grid grid-cols-[10px_minmax(0,1fr)_auto_auto] items-center gap-2.5 py-1">
							<span class="h-2.5 w-2.5 rounded-full" style:background={medals[Math.min(result.placement, 3) - 1]}></span>
							<span class="min-w-0 truncate">{result.athleteName} <button type="button" class="text-[var(--mute)] transition-colors hover:text-[var(--red)]" onclick={() => onclub(result.club.Id, result.club.Name)}>{result.club.Name}</button></span>
							<span class="num">{result.result}</span>
							<span class="flex min-w-[3.5rem] justify-end gap-1.5 num">
								{#if result.totalPoints > 0}<span class="pt-fp" title="Frihetspriset">+{points(result.totalPoints)}</span>{/if}
								{#if isJunior && (youth?.totalPoints ?? 0) > 0}<span class="pt-up" title="Ungdomspokalen">+{points(youth?.totalPoints ?? 0)}</span>{/if}
							</span>
						</li>
					{:else}
						<li class="py-1 text-[var(--mute)]">{copy.noResults}</li>
					{/each}
				</ol>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full min-w-[640px] border-collapse text-left text-sm">
						<thead class="sw-cap text-[var(--mute)]"><tr class="border-b border-black">
							<th class="py-2 pr-3 font-bold">#</th><th class="py-2 pr-3 font-bold">{copy.athleteClub}</th><th class="py-2 pr-3 font-bold">{copy.result}</th><th class="py-2 pr-3 font-bold">{copy.class}</th>
							<th class="py-2 pr-3 text-right font-bold">Frihetspriset</th>{#if isJunior}<th class="py-2 text-right font-bold">Ungdomspokalen</th>{/if}
						</tr></thead>
						<tbody>
							{#each results as result}
								{@const youth = youthFor(event.Id, result)}
								<tr class="border-b border-[var(--rule)] align-top">
									<td class="py-2 pr-3 text-[var(--mute)] num">{result.isValid ? result.placement : '–'}</td>
									<td class="py-2 pr-3"><span class="font-semibold">{result.athleteName}</span> <button type="button" class="block text-xs text-[var(--mute)] transition-colors hover:text-[var(--red)]" onclick={() => onclub(result.club.Id, result.club.Name)}>{result.club.Name}</button></td>
									<td class="py-2 pr-3 num">{result.result || '–'}</td>
									<td class="py-2 pr-3">{result.performanceClass === 'none' ? '–' : result.performanceClass}</td>
									<td class="py-2 pr-3 text-right num"><span class="pt-fp">{points(result.totalPoints)}</span><span class="block text-xs text-[var(--mute)]">{points(result.placementPoints)} {copy.placementShort} + {points(result.resultPoints)} {copy.classShort}</span></td>
									{#if isJunior}<td class="py-2 text-right num"><span class="pt-up">{points(youth?.totalPoints ?? 0)}</span><span class="block text-xs text-[var(--mute)]">{points(youth?.placementPoints ?? 0)} + {points(youth?.resultPoints ?? 0)}</span></td>{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
			{#if results.length}
				<button type="button" class="mt-2 text-xs font-semibold text-[var(--mute)] transition-colors hover:text-black" aria-expanded={open} onclick={() => openEvent = open ? null : event.Id}>
					{open ? copy.hideResults : fill(copy.showAllResults, { count: valid.length })} {open ? '↑' : '→'}
				</button>
			{/if}
		</article>
	{:else}
		<p class="col-span-full py-10 text-[var(--mute)]">{copy.noSearchResults}</p>
	{/each}
</div>
