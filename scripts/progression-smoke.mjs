#!/usr/bin/env node

import fs from 'node:fs';

const baseUrl = process.env.CARD_GATE_BASE_URL;
const accessToken = process.env.CARD_GATE_ACCESS_TOKEN;
const cardId = process.env.ARCHE_CARD_ID;
const artifact = process.env.PROGRESSION_SMOKE_ARTIFACT ?? 'collection';
const outputPath = process.env.PROGRESSION_SMOKE_OUTPUT ?? null;

function fail(message, details) {
  console.error(`SMOKE_RESULT status=FAIL reason=${message}`);
  if (details) {
    console.error('[smoke:progression] details:', details);
  }
  process.exit(1);
}

if (!baseUrl || !accessToken || !cardId) {
  fail('missing_env', {
    required: ['CARD_GATE_BASE_URL', 'CARD_GATE_ACCESS_TOKEN', 'ARCHE_CARD_ID'],
    optional: ['PROGRESSION_SMOKE_ARTIFACT', 'PROGRESSION_SMOKE_OUTPUT'],
  });
}

const source = `progression-smoke:${new Date().toISOString()}`;

function ensureJsonObject(value) {
  return value && typeof value === 'object' ? value : {};
}

async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-ARCHE-CARD-CODE': cardId,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let json;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { raw };
  }

  return {
    ok: response.ok,
    status: response.status,
    json: ensureJsonObject(json),
  };
}

function getItemVersion(payload, key) {
  const items = ensureJsonObject(payload.items);
  const item = ensureJsonObject(items[key]);
  const rawVersion = item.version;

  if (typeof rawVersion === 'number' && Number.isFinite(rawVersion)) {
    return Math.floor(rawVersion);
  }

  if (typeof rawVersion === 'string') {
    const parsed = Number.parseInt(rawVersion, 10);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function getConflictFor(payload, key) {
  const conflicts = Array.isArray(payload.conflicts) ? payload.conflicts : [];
  return conflicts.find((entry) => entry && typeof entry === 'object' && entry.artifact === key) ?? null;
}

function recordStep(summary, step, status, details = {}) {
  summary.steps.push({ step, status, ...details });
  console.log(`SMOKE_STEP step=${step} status=${status}`);
}

async function main() {
  const summary = {
    card_id: cardId,
    artifact,
    source,
    steps: [],
    verdict: 'FAIL',
    started_at: new Date().toISOString(),
    finished_at: null,
  };

  const baseline = await request('GET', '/progression/state');
  if (!baseline.ok) {
    recordStep(summary, 'baseline_get', 'FAIL', { status: baseline.status, body: baseline.json });
    fail('baseline_get_failed', baseline);
  }
  const baseVersion = getItemVersion(baseline.json, artifact);
  recordStep(summary, 'baseline_get', 'PASS', { status: baseline.status, base_version: baseVersion });

  const marker = `smoke-${Date.now()}`;
  const writeBody = {
    source,
    entries: [
      {
        artifact,
        payload: {
          smoke: {
            marker,
            ts: new Date().toISOString(),
            note: 'deployment smoke write',
          },
        },
        client_updated_at: new Date().toISOString(),
        base_version: baseVersion,
      },
    ],
  };

  const writeResult = await request('POST', '/progression/state', writeBody);
  if (!writeResult.ok) {
    recordStep(summary, 'cas_write', 'FAIL', { status: writeResult.status, body: writeResult.json });
    fail('cas_write_failed', writeResult);
  }

  const applied = Array.isArray(writeResult.json.applied) ? writeResult.json.applied : [];
  const unexpectedConflict = getConflictFor(writeResult.json, artifact);

  if (!applied.includes(artifact) || unexpectedConflict) {
    recordStep(summary, 'cas_write', 'FAIL', {
      status: writeResult.status,
      applied,
      conflict: unexpectedConflict,
      body: writeResult.json,
    });
    fail('cas_write_not_applied', writeResult.json);
  }

  recordStep(summary, 'cas_write', 'PASS', { status: writeResult.status });

  const verify = await request('GET', '/progression/state');
  if (!verify.ok) {
    recordStep(summary, 'version_increment', 'FAIL', { status: verify.status, body: verify.json });
    fail('verify_get_failed', verify);
  }

  const newVersion = getItemVersion(verify.json, artifact);
  if (newVersion <= baseVersion) {
    recordStep(summary, 'version_increment', 'FAIL', { baseVersion, newVersion, body: verify.json });
    fail('version_not_incremented', { baseVersion, newVersion });
  }
  recordStep(summary, 'version_increment', 'PASS', { baseVersion, newVersion });

  const staleConflictBody = {
    source: `${source}:stale-conflict`,
    entries: [
      {
        artifact,
        payload: {
          smoke: {
            marker: `${marker}-stale`,
            ts: new Date().toISOString(),
            note: 'stale write should conflict',
          },
        },
        client_updated_at: new Date().toISOString(),
        base_version: baseVersion,
      },
    ],
  };

  const staleWrite = await request('POST', '/progression/state', staleConflictBody);
  if (!staleWrite.ok) {
    recordStep(summary, 'stale_conflict', 'FAIL', { status: staleWrite.status, body: staleWrite.json });
    fail('stale_conflict_request_failed', staleWrite);
  }

  const staleConflict = getConflictFor(staleWrite.json, artifact);
  if (!staleConflict) {
    recordStep(summary, 'stale_conflict', 'FAIL', { status: staleWrite.status, body: staleWrite.json });
    fail('stale_conflict_missing', staleWrite.json);
  }

  recordStep(summary, 'stale_conflict', 'PASS', {
    server_version: staleConflict.server_version ?? null,
    reason: staleConflict.reason ?? null,
  });

  summary.verdict = 'PASS';
  summary.finished_at = new Date().toISOString();

  if (outputPath) {
    fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  }

  console.log('SMOKE_RESULT status=PASS');
}

main().catch((error) => {
  fail('unhandled_exception', {
    error: error instanceof Error ? error.message : String(error),
  });
});
