<script lang="ts">
	import { onMount } from 'svelte';
	import ClubDetail from './ClubDetail.svelte';
	import type { ClubEntry, Trophy } from '$lib/club-entries.js';

	let { entries, trophy, eventDates, sourceUrls, onclose }: {
		entries: Partial<Record<Trophy, ClubEntry>>;
		trophy: Trophy;
		eventDates: ReadonlyMap<number, string>;
		sourceUrls?: Record<Trophy, string>;
		onclose: () => void;
	} = $props();

	let dialog: HTMLDialogElement;

	// The native dialog gives Esc, focus trapping and the backdrop; focus the dialog
	// itself so the close button does not flash a focus ring on open.
	onMount(() => {
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialog.showModal();
		dialog.focus();
		return () => previous?.focus();
	});
</script>

<!-- Clicking the backdrop closes; Esc is handled natively by <dialog>. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class="club-dialog" tabindex="-1" aria-labelledby="club-detail-name" onclose={onclose} onclick={(event) => { if (event.target === dialog) dialog.close(); }}>
	<div class="px-6 pb-6 pt-5">
		<ClubDetail {entries} {trophy} {eventDates} {sourceUrls} onclose={() => dialog.close()} />
	</div>
</dialog>
