<script lang="ts">
	import type { ClubScore } from '$lib/types.js';
	import { locale, getCopy, fill, formatPoints } from '$lib/i18n.js';
	let copy = $derived(getCopy($locale));

	let { title, variant, rankings, sourceUrl, onclubclick }: {
		title: string;
		variant: 'frihet' | 'youth';
		rankings: ClubScore[];
		sourceUrl?: string;
		onclubclick: (club: ClubScore) => void;
	} = $props();

	let leader = $derived(rankings[0]);
	let topThree = $derived(rankings.slice(0, 3));
	let remainder = $derived(rankings.slice(3));
</script>

<section class="overflow-hidden border border-[#d9dedb] bg-white" aria-label={title}>
	<div class="flex items-center justify-between gap-3 border-b border-[#d9dedb] px-5 py-4 sm:px-6">
		<div class="flex items-center gap-3">
			<span class:!bg-[#c64f3d]={variant === 'frihet'} class="h-8 w-1 bg-[#27778a]"></span>
			<div>
				<p class="eyebrow text-[#607782]">{variant === 'frihet' ? copy.seniorJunior : copy.juniorClasses}</p>
				<h3 class="display-font text-[2rem] font-bold leading-none">{title}</h3>
			</div>
		</div>
		{#if sourceUrl}<a class="text-xs font-semibold text-[#27778a] underline-offset-4 hover:underline" href={sourceUrl} target="_blank" rel="noreferrer">{copy.officialTable} ↗</a>{/if}
	</div>
	{#if leader}
		<button type="button" onclick={() => onclubclick(leader)} class="group flex w-full items-end justify-between gap-3 bg-[#15354b] px-5 py-5 text-left text-white hover:bg-[#21465b] sm:px-6">
			<div class="min-w-0">
				<p class="eyebrow text-[#adc7ce]">01 / {copy.leader}</p>
				<p class="display-font mt-1 truncate text-[2rem] font-bold leading-none sm:text-[2.35rem]">{leader.club.Name}</p>
				<p class="mt-2 text-xs text-[#c7d9db]">{copy.showScoringResults} ↗</p>
			</div>
			<div class="shrink-0 text-right">
				<span class="score-number text-[3.3rem] font-bold leading-none text-[#f2b74c]">{formatPoints(leader.totalPoints, $locale)}</span>
				<span class="block text-[.65rem] font-bold uppercase tracking-widest text-[#adc7ce]">{copy.points}</span>
			</div>
		</button>
	{/if}
	<div class="divide-y divide-[#e4e8e5]">
		{#each topThree.slice(1) as club, i}
			<button type="button" onclick={() => onclubclick(club)} class="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-[#f7f4ec] sm:px-6">
				<span class="score-number w-7 text-xl font-bold text-[#607782]">0{i + 2}</span>
				<span class="min-w-0 flex-1 truncate text-sm font-semibold">{club.club.Name}</span>
				<span class="score-number text-2xl font-bold">{formatPoints(club.totalPoints, $locale)}</span>
				<span class="text-xs text-[#607782]" aria-hidden="true">↗</span>
			</button>
		{/each}
	</div>
	{#if remainder.length > 0}
		<details class="border-t border-[#d9dedb]">
			<summary class="cursor-pointer px-5 py-3 text-sm font-semibold text-[#27778a] hover:bg-[#eef3f2] sm:px-6">{fill(copy.showFullTable, { count: rankings.length })}</summary>
			<div class="divide-y divide-[#e4e8e5] border-t border-[#d9dedb]">
				{#each remainder as club, i}
					<button type="button" onclick={() => onclubclick(club)} class="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-[#f7f4ec] sm:px-6">
						<span class="score-number w-7 text-lg font-semibold text-[#607782]">{String(i + 4).padStart(2, '0')}</span>
						<span class="min-w-0 flex-1 truncate text-sm">{club.club.Name}</span>
						<span class="score-number text-xl font-semibold">{formatPoints(club.totalPoints, $locale)}</span>
						<span class="text-xs text-[#607782]" aria-hidden="true">↗</span>
					</button>
				{/each}
			</div>
		</details>
	{/if}
	{#if rankings.length === 0}<p class="p-6 text-sm text-[#607782]">{copy.noPoints}</p>{/if}
</section>
