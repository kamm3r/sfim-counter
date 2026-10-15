<script lang="ts">
	import { locale, getCopy, fill, formatPoints } from '$lib/i18n.js';
	import { scoringExamples, TROPHY_RULES, MAX_PLACEMENT_POINTS, type GuideRule } from '$lib/scoring-guide.js';
	import { FRIHET_JUNIOR_BONUS_MAX_PLACE } from '$lib/scoring.js';
	import { TROPHIES } from '$lib/trophies.js';

	let copy = $derived(getCopy($locale));
	const examples = scoringExamples();
	const formula = examples[0].frihetspriset;
	// Guide colours: red = Frihetspriset, black = Ungdomspokalen (matches .pt-fp / .pt-up).
	const STYLE = {
		frihetspriset: { color: 'var(--red)', pointsClass: 'pt-fp' },
		ungdomspokalen: { color: 'var(--ink)', pointsClass: 'pt-up' },
	} as const;
	const trophies = TROPHIES.map((trophy) => ({ ...trophy, ...STYLE[trophy.key] }));
	type GuideTrophy = (typeof trophies)[number];
	const BAR_HEIGHT = 56;
</script>


<div class="mt-8 flex items-start gap-x-3 num sm:gap-x-5">
	{#each [[formula.placementPoints, copy.scoringPartPlace], [formula.resultPoints, copy.scoringPartBonus], [formula.totalPoints, copy.scoringPartTotal]] as [value, label], index}
		{#if index > 0}<span class="text-2xl leading-[40px] font-black sm:text-3xl sm:leading-[52px] text-[var(--mute)]" aria-hidden="true">{index === 1 ? '+' : '='}</span>{/if}
		<div>
			<span class="block text-[40px] leading-none sm:text-[52px] font-black tracking-[-.04em] {index === 2 ? 'text-[var(--red)]' : ''}">{formatPoints(Number(value), $locale)}</span>
			<span class="mt-2 block text-sm font-semibold">{label}</span>
		</div>
	{/each}
</div>
<p class="mt-3 max-w-xl sw-mute">{copy.scoringSumUp}</p>


{#snippet ruleBlock(rule: GuideRule, trophy: GuideTrophy)}
	<div class="mt-2 flex w-full max-w-[13.5rem] items-end gap-[3px]" style:height="{BAR_HEIGHT + 40}px" role="img" aria-label={rule.placing.map((points, index) => `${index + 1}: ${points}`).join(', ')}>
		{#each rule.placing as points, index}
			<div class="flex min-w-0 max-w-8 flex-1 flex-col items-center">
				<span class="num text-xs font-bold {points ? '' : 'sw-mute'}">{points}</span>
				<div class="mt-1 w-full rounded-t-[4px]" style:height="{(points / MAX_PLACEMENT_POINTS) * BAR_HEIGHT}px" style:background={trophy.color}></div>
				<span class="num w-full border-t border-black pt-1 text-center text-xs sw-mute">{index + 1}</span>
			</div>
		{/each}
	</div>
	<!-- Bonus row uses the examples' striped square, so striped always means result bonus. -->
	<p class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" role="group" aria-label={copy.scoringPartBonus}>
		{#each rule.bonuses as bonus}
			<span class="inline-flex items-center gap-1.5">
				<span class="unit-bonus h-4 w-4 rounded-[3px]" style:--c={trophy.color} aria-hidden="true"></span>
				<span class="font-extrabold {trophy.pointsClass}">{bonus.level} <span class="num">+{bonus.points}</span></span>
			</span>
		{/each}
	</p>
{/snippet}

<div class="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
	{#each trophies as trophy}
		{@const rules = TROPHY_RULES[trophy.key]}
		<div class="border-t-4 pt-2 {rules.length > 1 ? 'md:col-span-2' : ''}" style:border-color={trophy.color}>
			<h3 class="text-[22px] font-extrabold tracking-[-.03em]">{trophy.name}</h3>
			<div class="mt-5 grid gap-x-10 gap-y-8 {rules.length > 1 ? 'sm:grid-cols-2' : ''}">
				{#each rules as rule}
					<div>
						<p class="text-sm font-bold">{rule.age === 'senior' ? copy.scoringSenior : copy.scoringJunior}</p>
						{@render ruleBlock(rule, trophy)}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
<div class="mt-6 max-w-3xl space-y-1 text-sm">
	<p>{copy.scoringLevelHelp}</p>
	<p>{fill(copy.scoringBonusWhen, { n: FRIHET_JUNIOR_BONUS_MAX_PLACE })}</p>
</div>

<div class="mt-10 flex flex-wrap items-baseline justify-between gap-3">
	<h3 class="text-[22px] font-extrabold tracking-[-.03em]">{copy.scoringExamples}</h3>
	<p class="flex items-center gap-4 text-xs" aria-hidden="true">
		<span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded-[2px] bg-black"></span>{copy.scoringPartPlace}</span>
		<span class="inline-flex items-center gap-1.5"><span class="unit-bonus h-3 w-3 rounded-[2px]" style:--c="var(--ink)"></span>{copy.scoringPartBonus}</span>
	</p>
</div>
<div class="mt-4 grid gap-x-6 md:grid-cols-3">
	{#each examples as example}
		<div class="border-t border-black py-4">
			<h4 class="font-bold">{copy[example.label]}</h4>
			<p class="mt-0.5 num text-sm sw-mute">100 m · {example.mark.replace('.', $locale === 'en' ? '.' : ',')} s</p>
			<!-- Only trophies where the result scores; the card title carries the situation. -->
			<div class="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
			{#each trophies as trophy}
				{@const result = example[trophy.key]}
				{#if result && result.totalPoints > 0}
					<div>
					<p class="text-xs font-semibold">{trophy.name}</p>
					<div class="mt-1 flex items-center gap-3">
						<span class="flex flex-wrap gap-[2px]" role="img" aria-label="{copy.scoringPartPlace} {formatPoints(result.placementPoints, $locale)} + {copy.scoringPartBonus} {formatPoints(result.resultPoints, $locale)}">
							{#each Array.from({ length: Math.round(result.placementPoints) }) as _}<span class="h-3 w-3 rounded-[2px]" style:background={trophy.color}></span>{/each}
							{#each Array.from({ length: Math.round(result.resultPoints) }) as _}<span class="unit-bonus h-3 w-3 rounded-[2px]" style:--c={trophy.color}></span>{/each}
						</span>
						<span class="num text-lg font-black {trophy.pointsClass}">{formatPoints(result.totalPoints, $locale)}</span>
					</div>
					</div>
				{/if}
			{/each}
			</div>
		</div>
	{/each}
</div>

<details class="mt-8 max-w-3xl border-y border-black py-4">
	<summary class="cursor-pointer text-lg font-bold">{copy.scoringDetails}</summary>
	<div class="mt-4 space-y-4 leading-6">
		{#each [copy.scoringGroups, copy.scoringTies, copy.scoringWind, copy.scoringRounds, copy.scoringRefresh, copy.scoringOfficial, copy.scoringLimits] as paragraph}
			<p>{paragraph}</p>
		{/each}
	</div>
</details>

<style>
	.unit-bonus { background: repeating-linear-gradient(45deg, var(--c) 0 2px, transparent 2px 4px); box-shadow: inset 0 0 0 1px var(--c); }
</style>
