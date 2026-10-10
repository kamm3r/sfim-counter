<script lang="ts">
	import { onMount } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import type { ClubScore } from '$lib/types.js';
	import { calculated2026Split, official2026Split } from '$lib/official-standings.js';
	import { locale, getCopy, fill, formatPoints as localizedPoints, translateEventName } from '$lib/i18n.js';

	let { club, trophy, eventDates, sourceUrl, onclose }: { club: ClubScore; trophy: 'frihetspriset' | 'ungdomspokalen'; eventDates: ReadonlyMap<number, string>; sourceUrl?: string; onclose: () => void } = $props();
	let closeButton: HTMLButtonElement;
	let copy = $derived(getCopy($locale));
	let dialog: HTMLDivElement;
	let countedEvents = $derived(club.events.filter((entry) => entry.points > 0));
	let officialSplit = $derived(sourceUrl ? official2026Split(trophy, club.club.Name) : undefined);
	let calculatedSplit = $derived(officialSplit ? calculated2026Split(club, trophy, eventDates) : []);
	let splitLabels = $derived(trophy === 'frihetspriset' ? [`${copy.friday} · ${copy.senior.toLowerCase()}`, `${copy.friday} · ${copy.junior.toLowerCase()}`, `${copy.saturday} · ${copy.senior.toLowerCase()}`, `${copy.saturday} · ${copy.junior.toLowerCase()}`] : [copy.friday, copy.saturday]);

	function formatPoints(value: number): string {
		return localizedPoints(value, $locale);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') { onclose(); return; }
		if (event.key !== 'Tab') return;
		const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
		if (!focusable.length) return;
		if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
		else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
	}

	onMount(() => {
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		closeButton?.focus();
		return () => previous?.focus();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
	<button type="button" aria-label={copy.closeProtocol} onclick={onclose} class="absolute inset-0 w-full bg-[#092333]/75 backdrop-blur-[3px]"></button>
	<div bind:this={dialog} role="dialog" aria-modal="true" aria-labelledby="club-title" tabindex="-1" class="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden bg-[#f7f4ec] shadow-2xl">
		<header class="flex shrink-0 items-start justify-between gap-4 bg-[#15354b] px-5 py-5 text-white sm:px-7">
			<div>
				<p class="eyebrow text-[#a9c5cc]">{copy.clubProtocol}</p>
				<h2 id="club-title" class="display-font mt-1 text-4xl font-bold leading-none sm:text-5xl">{club.club.Name}</h2>
				<p class="mt-2 text-sm text-[#c5d7dc]">{fill(copy.countedResults, { count: countedEvents.length })} · {club.calculatedPoints !== undefined ? copy.officialFinal : copy.calculatedStanding}</p>
			</div>
			<button bind:this={closeButton} type="button" aria-label={copy.closeProtocol} onclick={onclose} class="border border-[#63808d] p-2 hover:bg-white/10"><X class="h-5 w-5" /></button>
		</header>
		<div class="overflow-y-auto">
			<div class="flex items-end justify-between gap-4 border-b border-[#d9dedb] bg-white px-5 py-4 sm:px-7">
				<div><p class="eyebrow text-[#607782]">{club.calculatedPoints !== undefined ? copy.publishedTotal : copy.totalPoints}</p><p class="score-number text-5xl font-bold leading-none">{formatPoints(club.totalPoints)} <span class="text-base font-semibold">p</span></p></div>
				{#if sourceUrl}<a class="text-right text-xs font-semibold text-[#27778a] underline-offset-4 hover:underline" href={sourceUrl} target="_blank" rel="noreferrer">{copy.organizerTable} ↗</a>{/if}
			</div>
			{#if officialSplit}
				<div class="border-b border-[#d9dedb] bg-[#eef3f2] px-5 py-4 sm:px-7">
					<p class="eyebrow mb-2 text-[#607782]">{copy.dayByDay}</p>
					<div class="grid gap-x-3 gap-y-1 text-xs sm:grid-cols-2">
						{#each officialSplit as official, index}
							{@const delta = official - calculatedSplit[index]}
							<div class="flex items-baseline justify-between gap-2 border-b border-[#d3dedc] py-1"><span>{splitLabels[index]}</span><span class="tabular-nums"><strong>{formatPoints(official)}</strong> {copy.official} / {formatPoints(calculatedSplit[index])} {copy.calculated}{#if delta !== 0} <span class="font-semibold text-[#a33e2f]">({delta > 0 ? '+' : ''}{formatPoints(delta)})</span>{/if}</span></div>
						{/each}
					</div>
				</div>
			{/if}
			<div class="divide-y divide-[#e4e8e5] bg-white sm:hidden">
				{#each countedEvents as entry}
					<div class="px-5 py-3">
						<div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="font-semibold">{translateEventName(entry.eventName, $locale)}</p><p class="text-xs text-[#607782]">{entry.athleteName}</p></div><span class="score-number shrink-0 text-2xl font-bold">+{formatPoints(entry.points)}</span></div>
						<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#607782]"><span>{copy.result} <strong class="text-[#15354b]">{entry.result || '–'}</strong></span><span>{copy.placementShort} {entry.placement} <strong class="text-[#15354b]">+{formatPoints(entry.placementPoints)}</strong></span><span>{copy.class} {entry.performanceClass === 'none' ? '–' : entry.performanceClass} <strong class="text-[#15354b]">+{formatPoints(entry.resultPoints)}</strong></span></div>
					</div>
				{/each}
			</div>
			<div class="hidden overflow-x-auto bg-white sm:block">
				<table class="w-full min-w-[600px] text-left text-sm">
					<thead class="border-b border-[#d9dedb] bg-[#eef3f2] text-[.68rem] uppercase tracking-wider text-[#607782]"><tr><th class="px-5 py-3 font-semibold sm:px-7">{copy.eventAthlete}</th><th class="px-3 py-3 font-semibold">{copy.result}</th><th class="px-3 py-3 text-right font-semibold">{copy.placing}</th><th class="px-3 py-3 text-right font-semibold">{copy.class}</th><th class="px-5 py-3 text-right font-semibold sm:px-7">{copy.points}</th></tr></thead>
					<tbody class="divide-y divide-[#e4e8e5]">
						{#each countedEvents as entry}
							<tr class="align-top">
								<td class="px-5 py-3 sm:px-7"><span class="font-semibold">{translateEventName(entry.eventName, $locale)}</span><span class="block text-xs text-[#607782]">{entry.athleteName}</span></td>
								<td class="px-3 py-3 tabular-nums">{entry.result || '–'}</td>
								<td class="px-3 py-3 text-right tabular-nums">{entry.placement}<span class="block text-xs text-[#607782]">+{formatPoints(entry.placementPoints)} p</span></td>
								<td class="px-3 py-3 text-right">{entry.performanceClass === 'none' ? '–' : entry.performanceClass}<span class="block text-xs text-[#607782]">+{formatPoints(entry.resultPoints)} p</span></td>
								<td class="score-number px-5 py-3 text-right text-xl font-bold sm:px-7">{formatPoints(entry.points)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if club.calculatedPoints !== undefined}
				<div class="border-t border-[#d9dedb] bg-[#f7f4ec] px-5 py-5 text-sm sm:px-7">
					<div class="flex justify-between gap-3"><span>{copy.eventRowsSum}</span><span class="font-semibold tabular-nums">{formatPoints(club.calculatedPoints)} p</span></div>
					{#if club.officialAdjustment !== 0}
						<div class="mt-2 flex justify-between gap-3 text-[#a33e2f]"><span>{copy.unallocatedDifference}</span><span class="font-semibold tabular-nums">{(club.officialAdjustment ?? 0) > 0 ? '+' : ''}{formatPoints(club.officialAdjustment ?? 0)} p</span></div>
					{/if}
					<div class="mt-3 flex justify-between gap-3 border-t border-[#c9d4d3] pt-3 font-bold"><span>{copy.officialFinal}</span><span class="tabular-nums">{formatPoints(club.totalPoints)} p</span></div>
				</div>
			{/if}
		</div>
	</div>
</div>
