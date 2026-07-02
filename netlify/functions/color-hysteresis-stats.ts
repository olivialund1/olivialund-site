import { getDatabase } from '@netlify/database';

interface StatsRow {
	count: number;
	avg_forward: string | null;
	avg_backward: string | null;
}

export default async (): Promise<Response> => {
	const { sql } = getDatabase();
	const rows = await sql<StatsRow>`
		SELECT
			COUNT(*)::int AS count,
			AVG(forward_switch) AS avg_forward,
			AVG(backward_switch) AS avg_backward
		FROM color_hysteresis_results
	`;

	const row = rows[0];
	const count = row?.count ?? 0;

	return new Response(
		JSON.stringify({
			count,
			avgForwardSwitch: row?.avg_forward ? Number(row.avg_forward) : 0,
			avgBackwardSwitch: row?.avg_backward ? Number(row.avg_backward) : 0,
		}),
		{ headers: { 'content-type': 'application/json' } },
	);
};
