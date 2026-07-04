import { getDatabase } from '@netlify/database';
import { SHADES } from '../../src/lib/colorHysteresis';

interface StatsRow {
	count: number;
	avg_forward: string | null;
	avg_backward: string | null;
	magnitude_gap: string | null;
	median_tipping_point: string | null;
}

export default async (): Promise<Response> => {
	const { sql } = getDatabase();
	const maxIndex = SHADES - 1;

	// forward_switch/backward_switch are stored pass-relative, so their index
	// spaces are mirrored depending on each row's direction_first. Canonicalize
	// both onto the fixed blue(0)->green(last) axis before aggregating,
	// matching the per-row logic in colorHysteresis.ts's toCanonicalIndex.
	const rows = await sql<StatsRow>`
		WITH canonical AS (
			SELECT
				CASE WHEN direction_first = 'blue-to-green' THEN forward_switch ELSE ${maxIndex} - forward_switch END AS canonical_forward,
				CASE WHEN direction_first = 'blue-to-green' THEN ${maxIndex} - backward_switch ELSE backward_switch END AS canonical_backward
			FROM color_hysteresis_results
		)
		SELECT
			COUNT(*)::int AS count,
			AVG(canonical_forward) AS avg_forward,
			AVG(canonical_backward) AS avg_backward,
			AVG(ABS(canonical_backward - canonical_forward)) AS magnitude_gap,
			-- Median isn't a built-in aggregate like AVG; PERCENTILE_CONT is the
			-- correct way to compute it in Postgres, chosen over AVG here
			-- specifically because it's far less distorted by a handful of
			-- outlier players (spam-clicking, colorblind, etc.), which matters
			-- more at low N.
			PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (canonical_forward + canonical_backward) / 2.0) AS median_tipping_point
		FROM canonical
	`;

	const row = rows[0];
	const count = row?.count ?? 0;

	return new Response(
		JSON.stringify({
			count,
			avgCanonicalForward: row?.avg_forward ? Number(row.avg_forward) : 0,
			avgCanonicalBackward: row?.avg_backward ? Number(row.avg_backward) : 0,
			magnitudeGap: row?.magnitude_gap ? Number(row.magnitude_gap) : 0,
			medianTippingPoint: row?.median_tipping_point ? Number(row.median_tipping_point) : 0,
		}),
		{ headers: { 'content-type': 'application/json' } },
	);
};
