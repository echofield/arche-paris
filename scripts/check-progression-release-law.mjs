#!/usr/bin/env node

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const CONFIG_PATH = '.hardening/progression-release-law.json';

function runGit(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function splitLines(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\\/g, '/'));
}

function safeGitDiff(range) {
  try {
    return splitLines(runGit(`git diff --name-only ${range}`));
  } catch {
    return [];
  }
}

function getStatusChangedFiles() {
  try {
    const raw = runGit('git status --porcelain');
    return raw
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .map((line) => line.replace(/\\/g, '/'));
  } catch {
    return [];
  }
}

function getChangedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF;
  const localCombined = Array.from(new Set([
    ...safeGitDiff('HEAD'),
    ...getStatusChangedFiles(),
  ]));

  if (baseRef) {
    try {
      runGit(`git fetch --no-tags --depth=1 origin ${baseRef}`);
    } catch {
      // Continue; diff may still work in some CI clones.
    }

    const prDiff = safeGitDiff(`origin/${baseRef}...HEAD`);
    if (prDiff.length > 0) {
      return Array.from(new Set([...prDiff, ...localCombined]));
    }
  }

  const configuredRange = process.env.PROGRESSION_RELEASE_DIFF_RANGE;
  if (configuredRange) {
    const ranged = safeGitDiff(configuredRange);
    if (ranged.length > 0 || localCombined.length > 0) {
      return Array.from(new Set([...ranged, ...localCombined]));
    }
  }

  const headDiff = safeGitDiff('HEAD~1...HEAD');
  if (headDiff.length > 0 || localCombined.length > 0) {
    return Array.from(new Set([...headDiff, ...localCombined]));
  }

  return [];
}

function matchesPattern(path, pattern) {
  const normalizedPath = path.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  if (normalizedPattern.endsWith('/')) {
    return normalizedPath.startsWith(normalizedPattern);
  }

  return normalizedPath === normalizedPattern;
}

function hasMarker(recordText, marker) {
  return recordText.includes(marker);
}

function readMarkerValue(recordText, marker) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*(.+)`, 'i');
  const match = recordText.match(regex);
  if (!match) return null;
  return match[1].trim();
}

function isPlaceholder(value) {
  if (!value) return true;
  return /^(TBD|PENDING|N\/A|NA|NONE|UNKNOWN|UNSET|MISSING)$/i.test(value.trim());
}

function looksLikeEvidenceReference(value) {
  if (!value || isPlaceholder(value)) return false;
  const trimmed = value.trim();
  if (trimmed.length < 4) return false;
  return true;
}

function fail(message) {
  console.error(`[progression-release-law] FAIL: ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[progression-release-law] ${message}`);
}

const config = readJson(CONFIG_PATH);
const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
  info('No changed files detected; release-law guard skipped.');
  process.exit(0);
}

const progressionTouched = changedFiles.some((file) =>
  config.critical_path_prefixes.some((pattern) => matchesPattern(file, pattern)),
);

if (!progressionTouched) {
  info('No progression-critical surfaces changed.');
  process.exit(0);
}

info('Progression-critical surfaces changed; enforcing operator safeguards.');

const artifactIsChanged = (artifact) =>
  changedFiles.some((file) => {
    if (file === artifact) return true;
    if (file.endsWith('/')) return artifact.startsWith(file);
    return artifact.startsWith(`${file}/`);
  });

const missingArtifacts = config.required_operator_artifacts.filter(
  (artifact) => !artifactIsChanged(artifact),
);

if (missingArtifacts.length > 0) {
  fail(
    `Missing required operator artifact update(s): ${missingArtifacts.join(', ')}. ` +
      'Progression changes must include an updated validation record.',
  );
}

const recordPath = config.required_operator_artifacts[0];
if (!recordPath || !fs.existsSync(recordPath)) {
  fail(`Validation record not found: ${recordPath}`);
}

const recordText = fs.readFileSync(recordPath, 'utf8').replace(/^\uFEFF/, '');

for (const marker of config.required_record_markers) {
  if (!hasMarker(recordText, marker)) {
    fail(`Validation record is missing marker: ${marker}`);
  }
}

const strict = process.env.PROGRESSION_RELEASE_STRICT === '1';
if (strict) {
  const statusMarkers = [
    'LOCAL_VALIDATION_STATUS:',
    'LIVE_VALIDATION_STATUS:',
    'VALIDATION_STATUS:',
    'HARDENING_CHECKS:',
    'SMOKE_SCRIPT:',
    'BOOTSTRAP_TEST:',
    'CONFLICT_TEST:',
    'FALLBACK_TEST:',
  ];

  for (const marker of statusMarkers) {
    const value = readMarkerValue(recordText, marker);
    if (!value) fail(`Validation record has no value for ${marker}`);
    if (value.toUpperCase() !== 'PASS') {
      fail(`${marker} must be PASS in strict mode (found: ${value}).`);
    }
  }

  const evidenceMarkers = [
    'HARDENING_CHECKS_EVIDENCE:',
    'SMOKE_SCRIPT_EVIDENCE:',
    'BOOTSTRAP_TEST_EVIDENCE:',
    'CONFLICT_TEST_EVIDENCE:',
    'FALLBACK_TEST_EVIDENCE:',
  ];

  for (const marker of evidenceMarkers) {
    const value = readMarkerValue(recordText, marker);
    if (!looksLikeEvidenceReference(value)) {
      fail(`${marker} must contain a concrete evidence reference in strict mode (found: ${value ?? 'missing'}).`);
    }
  }

  const signoff = readMarkerValue(recordText, 'OPERATOR_SIGNOFF:');
  if (!signoff || signoff.toUpperCase() !== 'APPROVED') {
    fail(`OPERATOR_SIGNOFF must be APPROVED in strict mode (found: ${signoff ?? 'missing'}).`);
  }

  const signoffBy = readMarkerValue(recordText, 'OPERATOR_SIGNOFF_BY:');
  if (isPlaceholder(signoffBy)) {
    fail(`OPERATOR_SIGNOFF_BY must be explicit in strict mode (found: ${signoffBy ?? 'missing'}).`);
  }

  const signoffAt = readMarkerValue(recordText, 'OPERATOR_SIGNOFF_AT_UTC:');
  if (isPlaceholder(signoffAt)) {
    fail(`OPERATOR_SIGNOFF_AT_UTC must be explicit in strict mode (found: ${signoffAt ?? 'missing'}).`);
  }

  const parsedSignoffDate = signoffAt ? new Date(signoffAt) : null;
  if (!parsedSignoffDate || Number.isNaN(parsedSignoffDate.getTime())) {
    fail(`OPERATOR_SIGNOFF_AT_UTC must be a valid timestamp (found: ${signoffAt ?? 'missing'}).`);
  }
}

info('PASS');