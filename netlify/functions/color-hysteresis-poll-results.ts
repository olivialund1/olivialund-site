import { getDatabase } from '@netlify/database';

interface ResultsRow {
	theory: string;
	count: number;
}

export default async (): Promise<Response> => {
	const { sql } = getDatabase();
	const rows = await sql<ResultsRow>`
		SELECT theory, COUNT(*)::int AS count
		FROM color_hysteresis_poll_votes
		GROUP BY theory
	`;

	const counts: Record<string, number> = { 'sharp-boundary': 0, gap: 0, overlap: 0 };
	let total = 0;
	for (const row of rows) {
		if (row.theory in counts) {
			counts[row.theory] = row.count;
		}
		total += row.count;
	}

	return new Response(JSON.stringify({ total, counts }), {
		headers: { 'content-type': 'application/json' },
	});
};
