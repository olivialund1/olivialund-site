import { getDatabase } from '@netlify/database';

interface SubmitPayload {
	forwardSwitch: number;
	backwardSwitch: number;
	directionFirst: 'blue-to-green' | 'green-to-blue';
}

function isValidPayload(body: unknown): body is SubmitPayload {
	if (typeof body !== 'object' || body === null) return false;
	const { forwardSwitch, backwardSwitch, directionFirst } = body as Record<string, unknown>;
	return (
		Number.isInteger(forwardSwitch) &&
		Number.isInteger(backwardSwitch) &&
		(directionFirst === 'blue-to-green' || directionFirst === 'green-to-blue')
	);
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

	const { forwardSwitch, backwardSwitch, directionFirst } = body;
	const { sql } = getDatabase();
	await sql`
		INSERT INTO color_hysteresis_results (forward_switch, backward_switch, direction_first)
		VALUES (${forwardSwitch}, ${backwardSwitch}, ${directionFirst})
	`;

	return new Response(null, { status: 204 });
};
