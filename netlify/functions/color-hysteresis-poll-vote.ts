import { getDatabase } from '@netlify/database';

const VALID_THEORIES = ['sharp-boundary', 'gap', 'overlap'] as const;
type Theory = (typeof VALID_THEORIES)[number];

interface VotePayload {
	theory: Theory;
}

function isValidPayload(body: unknown): body is VotePayload {
	if (typeof body !== 'object' || body === null) return false;
	const { theory } = body as Record<string, unknown>;
	return typeof theory === 'string' && (VALID_THEORIES as readonly string[]).includes(theory);
}

export default async (req: Request): Promise<Response> => {
	if (req.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (!isValidPayload(body)) {
		return new Response('Invalid payload', { status: 400 });
	}

	const { theory } = body;
	const { sql } = getDatabase();
	await sql`
		INSERT INTO color_hysteresis_poll_votes (theory)
		VALUES (${theory})
	`;

	return new Response(null, { status: 204 });
};
