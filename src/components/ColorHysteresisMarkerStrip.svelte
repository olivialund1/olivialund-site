<script lang="ts">
	import { colorForIndex } from '../lib/colorHysteresis';

	export type MarkerShape = 'circle';

	export interface StripMarker {
		id: string | number;
		frac: number; // position along the strip, 0 (pure blue) to 1 (pure green)
		label: string;
		shape: MarkerShape;
		// Renders only the label (no leader line, no dot on the strip) — for
		// context markers like "you started here" that aren't pointing at a
		// specific data value. Still takes part in label decluttering.
		labelOnly?: boolean;
	}

	interface Props {
		shades: number;
		markers: StripMarker[];
	}

	let { shades, markers }: Props = $props();

	const gradientStops = $derived(
		Array.from({ length: shades }, (_, i) => colorForIndex('blue-to-green', i, shades)).join(', '),
	);

	// A few muted reference points along the strip so shade numbers read as a
	// scale, not just two arbitrary marker positions. Evenly spaced in
	// quarters; ties round down (24.5 -> 24, not 25) so a 50-shade strip reads
	// 1 / 13 / 25 / 38 / 50 rather than 1 / 13 / 26 / 38 / 50 — 25 lands
	// exactly on the intuitive midpoint of a 1-50 range.
	const TICK_COUNT = 5;
	const tickLabels = $derived(
		Array.from({ length: TICK_COUNT }, (_, i) => {
			const frac = i / (TICK_COUNT - 1);
			const index = Math.ceil(frac * (shades - 1) - 0.5);
			return index + 1;
		}),
	);

	const MIN_MARKER_SEPARATION_PX = 10;
	const LABEL_GAP_PX = 10;

	let stripWidth = $state(0);
	let labelWidths = $state<Record<string, number>>({});

	const sortedMarkers = $derived([...markers].sort((a, b) => a.frac - b.frac));
	const rawMarkerPx = $derived(sortedMarkers.map((m) => m.frac * stripWidth));

	// Two-pass (forward then backward) minimum-spacing declutter: nudges any
	// positions closer than their required gap apart, while leaving
	// well-separated positions untouched. Used both for the markers themselves
	// (fixed pixel gap) and for their labels (gap depends on measured label
	// widths), so any number of markers can share the strip without visually
	// colliding — not just the two (forward/backward) this was originally
	// written for.
	function declutter(positions: number[], minGap: (i: number) => number, bounds: [number, number]): number[] {
		const adjusted = positions.slice();
		for (let i = 1; i < adjusted.length; i++) {
			const gap = minGap(i - 1);
			if (adjusted[i] - adjusted[i - 1] < gap) {
				adjusted[i] = adjusted[i - 1] + gap;
			}
		}
		for (let i = adjusted.length - 2; i >= 0; i--) {
			const gap = minGap(i);
			if (adjusted[i + 1] - adjusted[i] < gap) {
				adjusted[i] = adjusted[i + 1] - gap;
			}
		}
		const [min, max] = bounds;
		return adjusted.map((p) => Math.min(Math.max(p, min), max));
	}

	const markerPx = $derived(declutter(rawMarkerPx, () => MIN_MARKER_SEPARATION_PX, [0, stripWidth]));

	// Labels start centered above their (already decluttered) marker, then get
	// nudged apart further if their actual rendered widths would overlap.
	const labelCenters = $derived.by(() => {
		const widths = sortedMarkers.map((m) => labelWidths[m.id] ?? 0);
		const minGap = (i: number) => widths[i] / 2 + widths[i + 1] / 2 + LABEL_GAP_PX;
		const bounds: [number, number] = [0, stripWidth];
		const centers = declutter(markerPx, minGap, bounds);
		return centers.map((c, i) => {
			const half = widths[i] / 2;
			return Math.min(Math.max(c, half), Math.max(stripWidth - half, half));
		});
	});
</script>

<div class="strip-wrapper" bind:clientWidth={stripWidth}>
	<div class="label-zone">
		<svg class="leader-lines" aria-hidden="true">
			{#each sortedMarkers as marker, i (marker.id)}
				{#if !marker.labelOnly}
					<line x1={labelCenters[i]} y1="16" x2={markerPx[i]} y2="40" class="leader-line" />
				{/if}
			{/each}
		</svg>
		{#each sortedMarkers as marker, i (marker.id)}
			<span
				class="marker-label"
				style={`left: ${labelCenters[i]}px;`}
				bind:clientWidth={labelWidths[marker.id]}
			>
				{marker.label}
			</span>
		{/each}
	</div>

	<div class="strip" style={`background: linear-gradient(to right, ${gradientStops});`}>
		{#each sortedMarkers as marker, i (marker.id)}
			{#if !marker.labelOnly}
				<div class={`marker marker-${marker.shape}`} style={`left: ${markerPx[i]}px`}></div>
			{/if}
		{/each}
	</div>

	<div class="ticks">
		{#each tickLabels as label, i}
			<div
				class="tick"
				class:tick-first={i === 0}
				class:tick-last={i === tickLabels.length - 1}
			>
				<div class="tick-mark"></div>
				<span class="tick-label">{label}</span>
			</div>
		{/each}
	</div>

	<div class="endpoints">
		<span>pure blue</span>
		<span>pure green</span>
	</div>
</div>

<style>
	.strip-wrapper {
		position: relative;
		width: 100%;
	}

	.label-zone {
		position: relative;
		height: 40px;
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
		top: -5px;
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

	.marker-circle {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-primary);
	}

	.ticks {
		display: flex;
		justify-content: space-between;
		margin-top: 0.4em;
	}

	.tick {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25em;
	}

	.tick-first {
		align-items: flex-start;
	}

	.tick-last {
		align-items: flex-end;
	}

	.tick-mark {
		width: 1px;
		height: 6px;
		background: rgb(var(--gray));
	}

	.tick-label {
		color: rgb(var(--gray));
		font-size: 0.75rem;
	}

	.endpoints {
		display: flex;
		justify-content: space-between;
		margin-top: 0.35em;
		color: var(--text-secondary);
		font-size: 0.85rem;
	}
</style>
