import { getDatabase } from '@netlify/database';
import { SHADES } from '../../src/lib/colorHysteresis';

interface PopulationRow {
	id: number;
	tipping_point: string | null;
}

export default async (): Promise<Response> => {
	const { sql } = getDatabase();
	const maxIndex = SHADES - 1;

	// Same canonicalization as the stats endpoint (forward_switch/backward_switch
	// are mirrored per row depending on direction_first), averaged per row into
	// a single tipping point on the fixed blue(0)->green(last) axis.
	const rows = await sql<PopulationRow>`
		SELECT
			id,
			(
				(CASE WHEN direction_first = 'blue-to-green' THEN forward_switch ELSE ${maxIndex} - forward_switch END)
				+
				(CASE WHEN direction_first = 'blue-to-green' THEN ${maxIndex} - backward_switch ELSE backward_switch END)
			) / 2.0 AS tipping_point
		FROM color_hysteresis_results
		ORDER BY id
	`;

	return new Response(
		JSON.stringify({
			count: rows.length,
			points: rows.map((row) => ({
				id: row.id,
				tippingPoint: row.tipping_point ? Number(row.tipping_point) : 0,
			})),
		}),
		{ headers: { 'content-type': 'application/json' } },
	);
};
