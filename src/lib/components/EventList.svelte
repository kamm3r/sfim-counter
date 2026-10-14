<script lang="ts">
	import type { EventDetail, ScoredResult, TrophyResult } from '$lib/types.js';
	import { isCombinedEvent, isJuniorGroup } from '$lib/classification.js';
	import { locale, getCopy, fill, formatPoints } from '$lib/i18n.js';
	import Search from '@lucide/svelte/icons/search';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	type EventRow = EventDetail & { date: string; displayName: string };
	let { events, frihetBreakdown, youthBreakdown }: {
		events: EventRow[];
		frihetBreakdown: TrophyResult['eventBreakdown'];
		youthBreakdown: TrophyResult['eventBreakdown'];
	} = $props();

	let query = $state('');
	let copy = $derived(getCopy($locale));
	let category = $state<'all' | 'junior' | 'senior'>('all');
	let openEvent = $state<number | null>(null);
	let frihetById = $derived(new Map(frihetBreakdown.map((event) => [event.eventId, event.results])));
	let youthById = $derived(new Map(youthBreakdown.map((event) => [event.eventId, event.results])));
	let filtered = $derived(events.filter((event) => {
		const junior = isJuniorGroup(event.Group || event.Name);
		if (category === 'junior' && !junior) return false;
		if (category === 'senior' && junior) return false;
		const term = query.trim().toLocaleLowerCase('sv-FI');
		if (!term) return true;
		return event.displayName.toLocaleLowerCase('sv-FI').includes(term) || event.Name.toLocaleLowerCase('sv-FI').includes(term) ||
			(frihetById.get(event.Id) ?? []).some((result) =>
				result.athleteName.toLocaleLowerCase('sv-FI').includes(term) || result.club.Name.toLocaleLowerCase('sv-FI').includes(term));
	}));

	function ordered(results: ScoredResult[]): ScoredResult[] {
		return [...results].sort((a, b) => (a.isValid === b.isValid ? a.placement - b.placement : a.isValid ? -1 : 1));
	}
</script>

<div class="border border-[#d9dedb] bg-white">
	<div class="grid gap-3 border-b border-[#d9dedb] p-4 sm:grid-cols-[1fr_auto] sm:p-5">
		<label class="flex items-center gap-2 border border-[#c9d4d3] bg-[#f7f4ec] px-3 py-2.5 text-[#607782] focus-within:border-[#27778a]">
			<Search class="h-4 w-4 shrink-0" aria-hidden="true" />
			<span class="sr-only">{copy.searchPlaceholder}</span>
			<input type="search" bind:value={query} placeholder={copy.searchPlaceholder} class="w-full min-w-0 bg-transparent text-sm text-[#15354b] outline-none placeholder:text-[#71868e]" />
		</label>
		<div class="flex gap-1 border border-[#c9d4d3] p-1" role="group" aria-label={copy.filterClass}>
			{#each [['all', copy.all], ['senior', copy.senior], ['junior', copy.junior]] as [value, label]}
				<button type="button" onclick={() => category = value as typeof category} aria-pressed={category === value} class:!bg-[#15354b]={category === value} class:!text-white={category === value} class="px-3 py-1.5 text-xs font-semibold text-[#607782] hover:bg-[#eef3f2]">{label}</button>
			{/each}
		</div>
	</div>
	<div class="border-b border-[#d9dedb] bg-[#fbfaf6] px-4 py-2 text-xs text-[#607782] sm:px-5">{fill(copy.eventCount, { shown: filtered.length, total: events.length })}</div>
	<div class="divide-y divide-[#e4e8e5]">
		{#each filtered as event (event.Id)}
			{@const results = ordered(frihetById.get(event.Id) ?? [])}
			{@const youthResults = youthById.get(event.Id) ?? []}
			{@const isJunior = isJuniorGroup(event.Group || event.Name)}
			<div>
				<button type="button" onclick={() => openEvent = openEvent === event.Id ? null : event.Id} aria-expanded={openEvent === event.Id} class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f3f6f4] sm:px-5">
					<span class="flex h-7 w-7 shrink-0 items-center justify-center border border-[#d9dedb] text-[#27778a]"><ChevronDown class={openEvent === event.Id ? 'h-4 w-4 transition-transform' : 'h-4 w-4 -rotate-90 transition-transform'} /></span>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm font-semibold">{event.displayName}</span>
						<span class="text-xs text-[#607782]">{isJunior ? copy.junior : copy.senior} · {event.date}{isCombinedEvent(event.Name) ? ` · ${copy.notInFrihetspriset}` : ''}</span>
					</span>
					<span class="score-number text-lg font-semibold text-[#607782]">{results.filter((r) => r.isValid).length}</span>
				<span class="hidden text-xs text-[#607782] sm:inline">{copy.resultCount}</span>
				</button>
				{#if openEvent === event.Id}
					<div class="divide-y divide-[#e4e8e5] border-t border-[#d9dedb] bg-[#fbfaf6] sm:hidden">
						{#each results as result}
							{@const youth = youthResults.find((item) => item.athleteName === result.athleteName && item.club.Id === result.club.Id && item.result === result.result)}
							<div class="px-4 py-3">
								<div class="flex items-start gap-3"><span class="score-number w-6 shrink-0 text-xl font-bold text-[#607782]">{result.isValid ? result.placement : '–'}</span><div class="min-w-0 flex-1"><p class="text-sm font-semibold">{result.athleteName}</p><p class="text-xs text-[#607782]">{result.club.Name} · {copy.class} {result.performanceClass === 'none' ? '–' : result.performanceClass}</p></div><span class="shrink-0 text-sm font-semibold tabular-nums">{result.result || '–'}</span></div>
								<div class="mt-2 grid gap-2 pl-9" class:grid-cols-2={isJunior}><div class="bg-white px-2 py-1"><span class="block text-[.63rem] font-bold uppercase tracking-wide text-[#607782]">Frihetspriset</span><span class="score-number text-xl font-bold">{formatPoints(result.totalPoints, $locale)}</span><span class="ml-2 text-xs text-[#607782]">{formatPoints(result.placementPoints, $locale)} {copy.placementShort} + {formatPoints(result.resultPoints, $locale)} {copy.classShort}</span></div>{#if isJunior}<div class="bg-white px-2 py-1"><span class="block text-[.63rem] font-bold uppercase tracking-wide text-[#607782]">Ungdomspokalen</span><span class="score-number text-xl font-bold">{formatPoints(youth?.totalPoints ?? 0, $locale)}</span><span class="ml-2 text-xs text-[#607782]">{formatPoints(youth?.placementPoints ?? 0, $locale)} + {formatPoints(youth?.resultPoints ?? 0, $locale)}</span></div>{/if}</div>
							</div>
						{/each}
					</div>
					<div class="hidden overflow-x-auto border-t border-[#d9dedb] bg-[#fbfaf6] sm:block">
						<table class="w-full min-w-[700px] text-left text-sm">
							<thead class="border-b border-[#d9dedb] text-[.67rem] uppercase tracking-wider text-[#607782]"><tr>
								<th class="px-4 py-3 font-semibold sm:px-5">#</th><th class="px-3 py-3 font-semibold">{copy.athleteClub}</th><th class="px-3 py-3 font-semibold">{copy.result}</th><th class="px-3 py-3 font-semibold">{copy.class}</th><th class="px-3 py-3 text-right font-semibold">Frihetspriset<br />{copy.placementShort} + {copy.classShort}</th>{#if isJunior}<th class="px-4 py-3 text-right font-semibold sm:px-5">Ungdomspokalen<br />{copy.placementShort} + {copy.classShort}</th>{/if}
							</tr></thead>
							<tbody class="divide-y divide-[#e4e8e5]">
								{#each results as result}
									{@const youth = youthResults.find((item) => item.athleteName === result.athleteName && item.club.Id === result.club.Id && item.result === result.result)}
									<tr class="align-top">
										<td class="score-number px-4 py-3 text-lg text-[#607782] sm:px-5">{result.isValid ? result.placement : '–'}</td>
										<td class="px-3 py-3"><span class="font-semibold">{result.athleteName}</span><span class="block text-xs text-[#607782]">{result.club.Name}</span></td>
										<td class="px-3 py-3 font-medium tabular-nums">{result.result || '–'}</td>
										<td class="px-3 py-3 text-[#27778a]">{result.performanceClass === 'none' ? '–' : result.performanceClass}</td>
										<td class="px-3 py-3 text-right"><span class="score-number text-xl font-bold">{formatPoints(result.totalPoints, $locale)}</span><span class="block text-xs text-[#607782]">{formatPoints(result.placementPoints, $locale)} + {formatPoints(result.resultPoints, $locale)}</span></td>
										{#if isJunior}<td class="px-4 py-3 text-right sm:px-5"><span class="score-number text-xl font-bold">{formatPoints(youth?.totalPoints ?? 0, $locale)}</span><span class="block text-xs text-[#607782]">{formatPoints(youth?.placementPoints ?? 0, $locale)} + {formatPoints(youth?.resultPoints ?? 0, $locale)}</span></td>{/if}
									</tr>
								{/each}
							</tbody></table>
					</div>
				{/if}
			</div>
		{/each}
		{#if filtered.length === 0}<p class="p-8 text-center text-sm text-[#607782]">{copy.noSearchResults}</p>{/if}
	</div>
</div>
