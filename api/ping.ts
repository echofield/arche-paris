// Simple test endpoint to verify Vercel Edge functions work
export const config = {
  runtime: 'edge',
};

export function GET() {
  return new Response(JSON.stringify({ ok: true, time: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
