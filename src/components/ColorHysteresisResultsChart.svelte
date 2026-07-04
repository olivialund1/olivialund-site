<script lang="ts">
	import { toCanonicalIndex, type PassDirection } from '../lib/colorHysteresis';
	import type { ColorHysteresisResults } from '../stores/colorHysteresisResults';
	import ColorHysteresisMarkerStrip, { type StripMarker } from './ColorHysteresisMarkerStrip.svelte';

	interface Props {
		results: ColorHysteresisResults;
		// The top-center stat is always the magnitude gap (labeled simply "gap").
		// For a single run, |forward - backward| already *is* the magnitude gap,
		// so this is only needed by aggregate callers (whose true magnitude gap —
		// the average of each row's own |backward - forward| — can't be
		// recovered from the two averaged marker positions alone).
		magnitudeGapOverride?: number;
		// Only meaningful for a single player's own run — shows a "you started
		// here" marker on whichever end of the strip they actually began at.
		// Aggregate callers (whose results object is a computed stand-in, not a
		// real player) leave this off.
		showStartSide?: boolean;
	}

	let { results, magnitudeGapOverride, showStartSide = false }: Props = $props();

	const backwardDirection = $derived<PassDirection>(
		results.directionFirst === 'blue-to-green' ? 'green-to-blue' : 'blue-to-green',
	);

	// Both switch points expressed on the same fixed blue->green axis, so
	// they're directly comparable regardless of which direction ran first.
	const canonicalForward = $derived(
		toCanonicalIndex(results.directionFirst, results.forwardSwitch, results.shades),
	);
	const canonicalBackward = $derived(
		toCanonicalIndex(backwardDirection, results.backwardSwitch, results.shades),
	);
	const magnitudeGap = $derived(magnitudeGapOverride ?? Math.abs(canonicalForward - canonicalBackward));

	// Personal switch points are always whole shade indices, but this component
	// is also reused for aggregate (averaged) values, which are fractional.
	function formatShade(value: number): string {
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}

	const fracForward = $derived(results.shades > 1 ? canonicalForward / (results.shades - 1) : 0.5);
	const fracBackward = $derived(results.shades > 1 ? canonicalBackward / (results.shades - 1) : 0.5);

	const markers = $derived<StripMarker[]>([
		{ id: 'forward', frac: fracForward, label: 'forward', shape: 'circle' },
		{ id: 'backward', frac: fracBackward, label: 'backward', shape: 'circle' },
		...(showStartSide
			? [
					{
						id: 'start',
						frac: results.directionFirst === 'blue-to-green' ? 0 : 1,
						// Star sits on the outside edge: leading on the blue (left)
						// side, trailing on the green (right) side.
						label:
							results.directionFirst === 'blue-to-green'
								? '★ You started here'
								: 'You started here ★',
						shape: 'circle' as const,
						labelOnly: true,
					},
				]
			: []),
	]);
</script>

<div class="chart">
	<div class="stat-row">
		<div class="stat">
			<span class="stat-label">forward switch</span>
			<span class="stat-value">shade {formatShade(canonicalForward + 1)}</span>
		</div>
		<div class="stat-divider"></div>
		<div class="stat">
			<span class="stat-label">gap</span>
			<span class="stat-value">{formatShade(magnitudeGap)} {magnitudeGap === 1 ? 'shade' : 'shades'}</span>
		</div>
		<div class="stat-divider"></div>
		<div class="stat">
			<span class="stat-label">backward switch</span>
			<span class="stat-value">shade {formatShade(canonicalBackward + 1)}</span>
		</div>
	</div>

	<ColorHysteresisMarkerStrip shades={results.shades} {markers} />
</div>

<style>
	.chart {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2em;
		margin: 1em 0 2em;
	}

	.stat-row {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35em;
		padding: 0 1.75em;
	}

	.stat-divider {
		width: 1px;
		height: 2.5em;
		background: rgba(var(--gray-light), 1);
	}

	.stat-label {
		color: var(--text-secondary);
		font-size: 0.85rem;
	}

	.stat-value {
		color: var(--text-primary);
		font-size: 1.5rem;
		font-weight: 700;
	}

	@media (max-width: 720px) {
		.stat {
			padding: 0 1em;
		}

		.stat-value {
			font-size: 1.15rem;
		}
	}
</style>
