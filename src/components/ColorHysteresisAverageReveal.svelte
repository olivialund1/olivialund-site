<script lang="ts">
	import { colorHysteresisStats } from '../stores/colorHysteresisStats';
	import { SHADES, type PassDirection } from '../lib/colorHysteresis';
	import type { ColorHysteresisResults } from '../stores/colorHysteresisResults';
	import ColorHysteresisResultsChart from './ColorHysteresisResultsChart.svelte';

	const directionFirst: PassDirection = 'blue-to-green';

	// The chart component expects pass-relative forward/backward switch values
	// (the same shape produced by a single player's run) and canonicalizes them
	// itself. Feeding it 'blue-to-green' as directionFirst makes forwardSwitch
	// pass through unchanged, so it can carry the already-canonical average
	// directly; backwardSwitch is back-converted so the chart's own
	// canonicalization reproduces the already-canonical average backward value.
	const aggregateResults = $derived<ColorHysteresisResults | null>(
		$colorHysteresisStats
			? {
					shades: SHADES,
					forwardSwitch: $colorHysteresisStats.avgCanonicalForward,
					backwardSwitch: SHADES - 1 - $colorHysteresisStats.avgCanonicalBackward,
					directionFirst,
				}
			: null,
	);
</script>

{#if !aggregateResults || !$colorHysteresisStats}
	<p class="loading">Loading aggregate results…</p>
{:else}
	<ColorHysteresisResultsChart
		results={aggregateResults}
		magnitudeGapOverride={$colorHysteresisStats.magnitudeGap}
	/>

	<p class="sample-size">Sample size: {$colorHysteresisStats.count}</p>
{/if}

<style>
	.loading {
		color: rgb(var(--gray));
		font-style: italic;
	}

	.sample-size {
		margin-top: -1em;
		color: rgb(var(--gray));
		font-size: 0.9rem;
		text-align: center;
	}
</style>
