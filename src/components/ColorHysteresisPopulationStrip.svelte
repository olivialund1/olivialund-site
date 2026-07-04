<script lang="ts">
	import { colorHysteresisPopulation } from '../stores/colorHysteresisPopulation';
	import { SHADES } from '../lib/colorHysteresis';
	import ColorHysteresisMarkerStrip, { type StripMarker } from './ColorHysteresisMarkerStrip.svelte';

	// Width of each bin, in whole shades. A width of 1 means each occupied bin
	// is a single shade; widening this later (e.g. to smooth out a very spiky
	// distribution) only changes this constant, not the binning logic below.
	const BIN_WIDTH_SHADES = 1;

	// Groups player tipping points into bins and renders one marker per
	// occupied bin, with the bin's player count as its label — this makes
	// on-gradient markers/labels well-separated even at moderate N, since
	// same-bin points collapse into a single marker instead of stacking raw
	// dots on top of each other. If bins get dense enough that adjacent count
	// labels start crowding even after the shared strip's own label
	// decluttering (roughly 20-30+ occupied bins), the planned fix is moving
	// markers off-gradient (or swapping to a smoothed density view) rather than
	// shrinking further.
	const markers = $derived<StripMarker[]>(
		(() => {
			if (!$colorHysteresisPopulation) return [];
			const counts = new Map<number, number>();
			for (const point of $colorHysteresisPopulation.points) {
				const bin = Math.round(point.tippingPoint / BIN_WIDTH_SHADES) * BIN_WIDTH_SHADES;
				counts.set(bin, (counts.get(bin) ?? 0) + 1);
			}
			return Array.from(counts.entries()).map(([bin, count]) => ({
				id: bin,
				frac: SHADES > 1 ? bin / (SHADES - 1) : 0.5,
				label: String(count),
				shape: 'circle' as const,
			}));
		})(),
	);
</script>

{#if !$colorHysteresisPopulation}
	<p class="loading">Loading population data…</p>
{:else}
	<ColorHysteresisMarkerStrip shades={SHADES} {markers} />

	<p class="sample-size">Based on the same {$colorHysteresisPopulation.count} samples</p>
{/if}

<style>
	.loading {
		color: rgb(var(--gray));
		font-style: italic;
	}

	.sample-size {
		margin-top: 0.75em;
		color: rgb(var(--gray));
		font-size: 0.9rem;
		text-align: center;
	}
</style>
