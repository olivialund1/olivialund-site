<script lang="ts">
	import { colorForIndex, toCanonicalIndex, type PassDirection } from '../lib/colorHysteresis';
	import type { ColorHysteresisResults } from '../stores/colorHysteresisResults';

	interface Props {
		results: ColorHysteresisResults;
	}

	let { results }: Props = $props();

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
	const gap = $derived(Math.abs(canonicalForward - canonicalBackward));
	const isTie = $derived(canonicalForward === canonicalBackward);

	const gradientStops = $derived(
		Array.from({ length: results.shades }, (_, i) =>
			colorForIndex('blue-to-green', i, results.shades),
		).join(', '),
	);

	const MIN_MARKER_SEPARATION_PX = 16;
	const LABEL_GAP_PX = 12;

	let stripWidth = $state(0);
	let forwardLabelWidth = $state(0);
	let backwardLabelWidth = $state(0);

	const fracForward = $derived(results.shades > 1 ? canonicalForward / (results.shades - 1) : 0.5);
	const fracBackward = $derived(results.shades > 1 ? canonicalBackward / (results.shades - 1) : 0.5);

	// The rendered marker position. Identical to the true data position
	// except in the exact-tie edge case, where a small forced separation
	// keeps both markers visible instead of one hiding the other.
	const markerPxForward = $derived.by(() => {
		const raw = fracForward * stripWidth;
		return isTie ? Math.max(0, raw - MIN_MARKER_SEPARATION_PX / 2) : raw;
	});
	const markerPxBackward = $derived.by(() => {
		const raw = fracBackward * stripWidth;
		return isTie ? Math.min(stripWidth, raw + MIN_MARKER_SEPARATION_PX / 2) : raw;
	});

	// Label centers start at the marker position, then get nudged apart
	// horizontally only if their rendered widths would otherwise overlap.
	// The leader line always points back at the true, unshifted marker.
	let labelCenterForward = $state(0);
	let labelCenterBackward = $state(0);

	$effect(() => {
		const halfF = forwardLabelWidth / 2;
		const halfB = backwardLabelWidth / 2;
		let cf = markerPxForward;
		let cb = markerPxBackward;
		const minCenterDistance = halfF + halfB + LABEL_GAP_PX;
		const distance = cb - cf;
		const absDistance = Math.abs(distance);
		if (absDistance < minCenterDistance) {
			const shortfall = minCenterDistance - absDistance;
			const dir = distance >= 0 ? 1 : -1;
			cf -= (shortfall / 2) * dir;
			cb += (shortfall / 2) * dir;
		}
		labelCenterForward = Math.min(Math.max(cf, halfF), Math.max(stripWidth - halfF, halfF));
		labelCenterBackward = Math.min(Math.max(cb, halfB), Math.max(stripWidth - halfB, halfB));
	});
</script>

<div class="chart">
	<div class="stat-row">
		<div class="stat">
			<span class="stat-label">forward switch</span>
			<span class="stat-value">shade {canonicalForward + 1}</span>
		</div>
		<div class="stat-divider"></div>
		<div class="stat">
			<span class="stat-label">gap</span>
			<span class="stat-value">{gap} {gap === 1 ? 'shade' : 'shades'}</span>
		</div>
		<div class="stat-divider"></div>
		<div class="stat">
			<span class="stat-label">backward switch</span>
			<span class="stat-value">shade {canonicalBackward + 1}</span>
		</div>
	</div>

	<div class="strip-wrapper" bind:clientWidth={stripWidth}>
		<div class="label-zone">
			<svg class="leader-lines" aria-hidden="true">
				<line x1={labelCenterForward} y1="20" x2={markerPxForward} y2="64" class="leader-line" />
				<line x1={labelCenterBackward} y1="44" x2={markerPxBackward} y2="64" class="leader-line" />
			</svg>
			<span
				class="marker-label"
				style={`left: ${labelCenterForward}px; top: 0;`}
				bind:clientWidth={forwardLabelWidth}
			>
				forward
			</span>
			<span
				class="marker-label"
				style={`left: ${labelCenterBackward}px; top: 24px;`}
				bind:clientWidth={backwardLabelWidth}
			>
				backward
			</span>
		</div>

		<div class="strip" style={`background: linear-gradient(to right, ${gradientStops});`}>
			<div class="marker marker-triangle" style={`left: ${markerPxForward}px`}></div>
			<div class="marker marker-circle" style={`left: ${markerPxBackward}px`}></div>
		</div>

		<div class="endpoints">
			<span>pure blue</span>
			<span>pure green</span>
		</div>
	</div>
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

	.strip-wrapper {
		position: relative;
		width: 100%;
	}

	.label-zone {
		position: relative;
		height: 64px;
	}

	.leader-lines {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.leader-line {
		stroke: var(--text-secondary);
		stroke-width: 1;
	}

	.marker-label {
		position: absolute;
		transform: translateX(-50%);
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.strip {
		position: relative;
		height: 64px;
		border-radius: 32px;
	}

	.marker {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.marker-triangle {
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-bottom: 13px solid var(--text-primary);
	}

	.marker-circle {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		background: var(--text-primary);
	}

	.endpoints {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5em;
		color: var(--text-secondary);
		font-size: 0.85rem;
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
