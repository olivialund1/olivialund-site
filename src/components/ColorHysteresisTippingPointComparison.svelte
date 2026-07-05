<script lang="ts">
	import { colorHysteresisResults } from '../stores/colorHysteresisResults';
	import { colorHysteresisStats } from '../stores/colorHysteresisStats';
	import { MIN_SAMPLE_SIZE, SHADES, colorForIndex, personalTippingPoint } from '../lib/colorHysteresis';

	// Reuses the same personalTippingPoint math already applied to this
	// player's results in section #3 (the personal chart) — not a second,
	// independently-derived number.
	const yourTippingPoint = $derived(
		$colorHysteresisResults
			? personalTippingPoint(
					$colorHysteresisResults.directionFirst,
					$colorHysteresisResults.forwardSwitch,
					$colorHysteresisResults.backwardSwitch,
					$colorHysteresisResults.shades,
				)
			: null,
	);

	// Rounds to the nearest whole shade, matching the population strip's
	// binning convention, then looks up that shade's actual color so the box
	// can be filled with it directly rather than only naming it.
	const yourIndex = $derived(yourTippingPoint !== null ? Math.round(yourTippingPoint) : null);
	const medianIndex = $derived(
		$colorHysteresisStats ? Math.round($colorHysteresisStats.medianTippingPoint) : null,
	);

	const yourShade = $derived(yourIndex !== null ? yourIndex + 1 : null);
	const medianShade = $derived(medianIndex !== null ? medianIndex + 1 : null);

	const yourColor = $derived(yourIndex !== null ? colorForIndex('blue-to-green', yourIndex, SHADES) : null);
	const medianColor = $derived(
		medianIndex !== null ? colorForIndex('blue-to-green', medianIndex, SHADES) : null,
	);
</script>

{#if yourShade === null || !$colorHysteresisStats}
	<p class="loading">Loading comparison…</p>
{:else}
	<div class="comparison">
		<div class="box" style={`background-color: ${yourColor};`}>
			<span class="box-label">Your Tipping Point</span>
			<span class="box-value">Shade {yourShade}</span>
		</div>
		<div class="box" style={`background-color: ${medianColor};`}>
			<span class="box-label">Median Tipping Point</span>
			<span class="box-value">Shade {medianShade}</span>
		</div>
	</div>

	{#if $colorHysteresisStats.count < MIN_SAMPLE_SIZE}
		<p class="caveat">Check back as more people play.</p>
	{/if}
{/if}

<style>
	.loading {
		color: rgb(var(--gray));
		font-style: italic;
	}

	.comparison {
		display: flex;
		justify-content: center;
		gap: 1.5em;
		flex-wrap: wrap;
		margin-bottom: 1.5em;
	}

	.box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
		min-width: 220px;
		padding: 1.5em 2em;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
	}

	/*
	 * Text color is fixed rather than tied to the site's light/dark theme
	 * variables: the box background is always a fixed-lightness color from the
	 * blue-to-green gradient, so it needs contrast against that color specifically,
	 * not against the page background.
	 */
	.box-label {
		color: rgba(0, 0, 0, 0.6);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.box-value {
		color: rgba(0, 0, 0, 0.85);
		font-size: 1.5rem;
		font-weight: 700;
	}

	.caveat {
		margin-top: 1em;
		color: rgb(var(--gray));
		font-size: 0.85rem;
		font-style: italic;
		text-align: center;
	}
</style>
