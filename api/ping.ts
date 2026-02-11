// Simple test endpoint to verify Vercel functions work
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, time: new Date().toISOString() });
}
