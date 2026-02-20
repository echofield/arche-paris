import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const DOWNLOADS_DIR = "C:\\Users\\echof\\Downloads";
const OUT_DIR = path.join(process.cwd(), "tmp");
const OUT_JSON = path.join(OUT_DIR, "city_compute_report.json");
const OUT_MD = path.join(OUT_DIR, "city_compute_report.md");
const REFUSAL_ATTUNEMENT_THRESHOLD = 0.30;
const ATTUNEMENT_INERTIA = 0.5;
const ATTUNEMENT_MATCH_GAIN = 0.02;
const ATTUNEMENT_MISMATCH_PENALTY = 0.02;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const n = Number.parseFloat(String(value).replace(/^\+/, ""));
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function slugify(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function depluralizeSlug(slug) {
  return slug
    .split("_")
    .map((p) => (p.endsWith("s") && p.length > 3 ? p.slice(0, -1) : p))
    .join("_");
}

function parseCsvLine(line) {
  const cols = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cols.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols.map((c) => c.trim());
}

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function getByPath(obj, dottedPath) {
  return dottedPath.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

function resolveToken(token, ctx, policy) {
  const t = token.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1);
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === "true";
  if (/^[+-]?\d+(\.\d+)?$/.test(t)) return parseNumber(t);
  const globalVal = getByPath(policy, t);
  if (globalVal !== undefined) return globalVal;
  return getByPath(ctx, t);
}

function evalClause(clause, ctx, policy) {
  const m = clause.match(/^\s*([A-Za-z0-9_.]+)\s*(==|>=|<=|>|<)\s*(.+?)\s*$/);
  if (!m) return false;
  const left = resolveToken(m[1], ctx, policy);
  const op = m[2];
  const right = resolveToken(m[3], ctx, policy);
  if (left == null || right == null) return false;
  if (op === "==") return String(left) === String(right);
  if (op === ">=") return Number(left) >= Number(right);
  if (op === "<=") return Number(left) <= Number(right);
  if (op === ">") return Number(left) > Number(right);
  if (op === "<") return Number(left) < Number(right);
  return false;
}

function evaluateCondition(condition, ctx, policy) {
  const andParts = String(condition).split(/\s+AND\s+/i);
  return andParts.every((part) => evalClause(part, ctx, policy));
}

function seasonalKey(dt) {
  const m = dt.getUTCMonth() + 1;
  if (m >= 9 && m <= 11) return "autumn";
  if (m === 12 || m <= 2) return "winter";
  if (m >= 3 && m <= 5) return "spring";
  return "summer";
}

function getZoneOverride(policy, zoneId) {
  return (policy?.zones && policy.zones[zoneId]) || {};
}

function buildStatusLine(zone) {
  if (zone.resonance >= 0.85 && zone.entropy <= 0.45) return "Harmonic field holds; memory is coherent.";
  if (zone.guardian_decay >= 0.75) return "Guardianship is fraying; the zone leans toward refusal.";
  if (zone.entropy >= 0.8) return "Signal turbulence dominates; acts scatter before integrating.";
  if (zone.resonance <= 0.25) return "The zone remains muted; presence has not yet accumulated.";
  return "The zone is in active negotiation between order and drift.";
}

function topN(items, key, n = 10, desc = true) {
  const arr = [...items].sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]));
  return arr.slice(0, Math.min(n, arr.length));
}

function parseActiveHours(value) {
  const v = String(value || "").trim();
  if (!v.includes("-")) return null;
  const [start, end] = v.split("-");
  return { start, end };
}

function isHourInWindow(hour, window) {
  if (!window) return true;
  const start = Number.parseInt(window.start?.split(":")[0] || "0", 10);
  const end = Number.parseInt(window.end?.split(":")[0] || "23", 10);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return true;
  if (start <= end) return hour >= start && hour <= end;
  return hour >= start || hour <= end;
}

function main() {
  ensureDir(OUT_DIR);
  const replayMultiplierArg = process.argv.find((arg) => arg.startsWith("--replay-multiplier="));
  const replayMultiplier = (() => {
    if (!replayMultiplierArg) return 1;
    const n = Number.parseInt(replayMultiplierArg.split("=")[1] || "1", 10);
    return Number.isFinite(n) ? Math.max(1, Math.min(20, n)) : 1;
  })();

  const zoneRows = parseCsvFile(path.join(DOWNLOADS_DIR, "zone_baseline.csv"));
  const artifactRows = parseCsvFile(path.join(DOWNLOADS_DIR, "urban_artifacts.csv"));
  const ritualRows = parseCsvFile(path.join(DOWNLOADS_DIR, "ritual_catalog.csv"));
  const eventRows = parseCsvFile(path.join(DOWNLOADS_DIR, "seed_events.csv"));
  const policy = YAML.parse(fs.readFileSync(path.join(DOWNLOADS_DIR, "policy.yaml"), "utf8"));

  const zones = {};
  const zoneState = {};
  for (const row of zoneRows) {
    const h3 = row.h3;
    zones[h3] = {
      h3,
      zone_id: row.zone_id,
      zone_label: row.zone_label,
      baseline_entropy: parseNumber(row.baseline_entropy),
      baseline_resonance: parseNumber(row.baseline_resonance),
      guardian_decay_init: parseNumber(row.guardian_decay_init),
    };
  zoneState[h3] = {
      entropy: parseNumber(row.baseline_entropy),
      resonance: parseNumber(row.baseline_resonance),
      guardian_decay: parseNumber(row.guardian_decay_init),
      presence: 0,
      wisdom: 0,
      shadow: 0,
      attunement: 0.5,
      last_status: "INIT",
      last_refusal_reason: null,
      refusal_count: 0,
    };
  }

  const artifactsByH3 = {};
  for (const row of artifactRows) {
    if (!artifactsByH3[row.h3]) artifactsByH3[row.h3] = [];
    artifactsByH3[row.h3].push({
      artifact_id: row.artifact_id,
      artifact_type: slugify(row.artifact_type),
      semantic_tags: String(row.semantic_tags || "")
        .split(",")
        .map((t) => slugify(t))
        .filter(Boolean),
      active_hours: parseActiveHours(row.active_hours),
    });
  }

  const ritualsBySlug = {};
  for (const row of ritualRows) {
    const baseSlug = slugify(row.ritual_name);
    const noThe = baseSlug.replace(/^the_/, "");
    const alt = depluralizeSlug(noThe);
    const ritual = {
      ritual_id: row.ritual_id,
      ritual_name: row.ritual_name,
      slug: noThe,
      allowed_artifact_types: String(row.allowed_artifact_types || "")
        .split(",")
        .map((t) => slugify(t))
        .filter(Boolean),
      canonical_acts: String(row.canonical_acts || "")
        .split(",")
        .map((t) => slugify(t))
        .filter(Boolean),
      min_duration_s: parseNumber(row.min_duration_s, 0),
      min_displacement_m: parseNumber(row.min_displacement_m, 0),
      entropy_delta: parseNumber(row.entropy_delta, 0),
      resonance_delta: parseNumber(row.resonance_delta, 0),
      shadow_delta: parseNumber(row.shadow_delta, 0),
    };
    [baseSlug, noThe, alt].forEach((k) => {
      ritualsBySlug[k] = ritual;
    });
  }

  const baseEvents = eventRows
    .map((e) => ({
      ...e,
      ts: new Date(e.ts),
      act_slug: slugify(e.act),
      delta_presence: parseNumber(e.delta_presence, 0),
      delta_wisdom: parseNumber(e.delta_wisdom, 0),
      delta_shadow: parseNumber(e.delta_shadow, 0),
    }))
    .filter((e) => Number.isFinite(e.ts.getTime()))
    .sort((a, b) => a.ts - b.ts);
  const dayMs = 24 * 60 * 60 * 1000;
  const events = [];
  for (let i = 0; i < replayMultiplier; i++) {
    for (const e of baseEvents) {
      events.push({
        ...e,
        ts: new Date(e.ts.getTime() + i * dayMs),
      });
    }
  }
  events.sort((a, b) => a.ts - b.ts);

  const actorState = {};
  const actorHistory = {};
  const zoneHistory = {};
  const refusedByZoneReason = {};
  const globalRules = policy.global_refusal_rules || [];

  for (const event of events) {
    const z = zones[event.h3];
    if (!z) continue;
    const state = zoneState[event.h3];
    const zoneId = z.zone_id;
    const zoneOverride = getZoneOverride(policy, zoneId);
    const zoneRules = zoneOverride.refusal_rules || [];

    const actor = event.actor_hash || "unknown";
    if (!actorState[actor]) actorState[actor] = { presence: 0, wisdom: 0, shadow: 0 };
    if (!actorHistory[actor]) actorHistory[actor] = [];
    if (!zoneHistory[event.h3]) zoneHistory[event.h3] = [];

    const dt = event.ts;
    const hour = dt.getUTCHours();
    const dayKey = dt.toISOString().slice(0, 10);
    const oneHourAgo = dt.getTime() - 3600 * 1000;
    const actorEvents1h = actorHistory[actor].filter((p) => p.ts >= oneHourAgo).length;
    const sameH3Today = actorHistory[actor].filter((p) => p.dayKey === dayKey && p.h3 === event.h3).length + 1;
    const visitsToday = actorHistory[actor].filter((p) => p.dayKey === dayKey && p.zone_id === zoneId).length + 1;
    const prevActorEvent = actorHistory[actor][actorHistory[actor].length - 1] || null;
    const priorAgeS = prevActorEvent ? Math.floor((dt.getTime() - prevActorEvent.ts) / 1000) : 999999;

    const ritual = ritualsBySlug[event.act_slug] || null;
    const durationS = ritual?.min_duration_s || 60;
    const displacementM = ritual?.min_displacement_m || 0;

    const season = seasonalKey(dt);
    const seasonCfg = policy?.seasonal_modifiers?.[season] || {};
    const globalTemporal = policy?.global_defaults?.friction?.temporal || {};
    const zoneTemporal = zoneOverride?.friction?.temporal || {};
    const nightMult = parseNumber(zoneTemporal.night_weight_multiplier ?? globalTemporal.night_weight_multiplier, 1);
    let timeMult = 1;
    if (hour >= 22 || hour <= 5) timeMult *= nightMult;
    if (seasonCfg.night_weight_extra && (hour >= 22 || hour <= 5)) {
      timeMult *= 1 + parseNumber(seasonCfg.night_weight_extra, 0);
    }

    const artifacts = artifactsByH3[event.h3] || [];
    const activeArtifacts = artifacts.filter((a) => isHourInWindow(hour, a.active_hours));
    const artifactTypes = new Set(activeArtifacts.map((a) => a.artifact_type));
    const semanticTags = new Set(activeArtifacts.flatMap((a) => a.semantic_tags));
    const dominantArtifactType = (() => {
      if (activeArtifacts.length === 0) return null;
      const counts = new Map();
      for (const a of activeArtifacts) counts.set(a.artifact_type, (counts.get(a.artifact_type) || 0) + 1);
      return [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] || null;
    })();

    let entropyDelta = ritual?.entropy_delta ?? 0;
    let resonanceDelta = ritual?.resonance_delta ?? 0;
    let shadowDelta = ritual?.shadow_delta ?? 0;

    const ctx = {
      actor: {
        presence: actorState[actor].presence,
        wisdom: actorState[actor].wisdom,
        shadow: actorState[actor].shadow,
        events_last_1h: actorEvents1h,
        visits_today: visitsToday,
      },
      act: event.act_slug,
      event_type: slugify(event.event_type),
      delta_presence: event.delta_presence,
      delta_wisdom: event.delta_wisdom,
      delta_shadow: event.delta_shadow,
      duration_s: durationS,
      same_h3_count_today: sameH3Today,
      hour,
      cluster_distance_m: 999,
      prior_same_actor_event_age_s: priorAgeS,
    };

    let refused = false;
    let refusalReason = null;
    let modifier = 1;

    const ritualMatchesZone =
      Boolean(ritual) &&
      Boolean(dominantArtifactType) &&
      ritual.allowed_artifact_types.includes(dominantArtifactType);
    const a = state.attunement;
    const targetAttunement = ritualMatchesZone
      ? a + ATTUNEMENT_MATCH_GAIN * (1 - a)
      : a - ATTUNEMENT_MISMATCH_PENALTY * a;
    state.attunement = clamp(
      a * ATTUNEMENT_INERTIA + targetAttunement * (1 - ATTUNEMENT_INERTIA),
      0,
      1
    );

    if (state.attunement < REFUSAL_ATTUNEMENT_THRESHOLD) {
      refused = true;
      refusalReason = "ATTUNEMENT:below_threshold";
      modifier = 0;
    }

    const allRules = [...globalRules, ...zoneRules];
    for (const rule of allRules) {
      if (refused) break;
      if (!rule?.condition) continue;
      if (!evaluateCondition(rule.condition, ctx, policy)) continue;
      const action = String(rule.action || "").toLowerCase();
      refusalReason = `${rule.id || zoneId}:${action}`;
      if (action === "friction_tax") {
        modifier *= clamp(parseNumber(rule.tax_multiplier, 1), 0, 1);
      } else if (
        action === "refuse" ||
        action === "hard_block" ||
        action === "defer" ||
        action === "nullify" ||
        action === "zero_delta"
      ) {
        refused = true;
        modifier = 0;
        break;
      } else if (action === "downgrade" || action === "downgrade_to_encounter") {
        modifier *= 0.35;
      }
    }

    let blockedRitual = false;
    if (ritual && ritual.allowed_artifact_types.length > 0) {
      const hasMatch = ritual.allowed_artifact_types.some((t) => artifactTypes.has(t));
      if (!hasMatch) blockedRitual = true;
    }

    if (refused) {
      state.last_status = "REFUSED";
      state.last_refusal_reason = refusalReason || "policy_refusal";
      state.refusal_count += 1;
      if (!refusedByZoneReason[zoneId]) refusedByZoneReason[zoneId] = {};
      const k = state.last_refusal_reason;
      refusedByZoneReason[zoneId][k] = (refusedByZoneReason[zoneId][k] || 0) + 1;
    } else {
      state.last_status = "APPLIED";
      state.last_refusal_reason = null;
    }

    const effectiveMult = timeMult * modifier;
    state.entropy = clamp(state.entropy + entropyDelta * effectiveMult, 0, 1);
    state.resonance = clamp(state.resonance + resonanceDelta * effectiveMult, 0, 1);
    state.shadow += (shadowDelta + event.delta_shadow) * effectiveMult;
    state.presence += event.delta_presence * effectiveMult;
    state.wisdom += event.delta_wisdom * effectiveMult;

    const entropyMismatch = Math.abs(state.entropy - z.baseline_entropy);
    const resonanceGap = Math.max(0, z.baseline_resonance - state.resonance);
    const shadowTagBias = semanticTags.has("shadow") || semanticTags.has("grief") ? 0.08 : 0;
    const ritualArtifactMismatch = blockedRitual ? 0.45 : ritual ? 0.08 : 0.2;
    const refusalPenalty = refused ? 0.4 : 0;
    const dissonanceScore = clamp(
      ritualArtifactMismatch + entropyMismatch * 0.35 + resonanceGap * 0.2 + shadowTagBias + refusalPenalty,
      0,
      1
    );
    const decayRate = parseNumber(
      zoneOverride?.guardian?.decay_rate_per_hour ?? policy?.global_defaults?.guardian?.decay_rate_per_hour,
      0.02
    );
    state.guardian_decay = clamp(state.guardian_decay + dissonanceScore * decayRate, 0, 1);

    actorState[actor].presence += event.delta_presence * effectiveMult;
    actorState[actor].wisdom += event.delta_wisdom * effectiveMult;
    actorState[actor].shadow += (shadowDelta + event.delta_shadow) * effectiveMult;

    actorHistory[actor].push({ ts: dt.getTime(), dayKey, h3: event.h3, zone_id: zoneId });
    zoneHistory[event.h3].push(dt.getTime());
  }

  const zonesReport = Object.entries(zones).map(([h3, z]) => {
    const s = zoneState[h3];
    return {
      h3,
      zone_id: z.zone_id,
      zone_label: z.zone_label,
      baseline: {
        entropy: z.baseline_entropy,
        resonance: z.baseline_resonance,
        guardian_decay: z.guardian_decay_init,
      },
      final_state: {
        entropy: Number(s.entropy.toFixed(4)),
        resonance: Number(s.resonance.toFixed(4)),
        guardian_decay: Number(s.guardian_decay.toFixed(4)),
        presence: Number(s.presence.toFixed(4)),
        wisdom: Number(s.wisdom.toFixed(4)),
        shadow: Number(s.shadow.toFixed(4)),
        attunement: Number(s.attunement.toFixed(4)),
        reveal_bias: Number((0.5 + s.attunement).toFixed(4)),
        last_status: s.last_status,
        last_refusal_reason: s.last_refusal_reason,
      },
      world_status_line: buildStatusLine(s),
      refused_events: s.refusal_count,
      refusal_reasons: refusedByZoneReason[z.zone_id] || {},
    };
  });

  const byResonance = topN(zonesReport.map((z) => ({ zone_id: z.zone_id, zone_label: z.zone_label, resonance: z.final_state.resonance })), "resonance", 10, true);
  const byEntropy = topN(zonesReport.map((z) => ({ zone_id: z.zone_id, zone_label: z.zone_label, entropy: z.final_state.entropy })), "entropy", 10, true);
  const byGuardianDecay = topN(
    zonesReport.map((z) => ({ zone_id: z.zone_id, zone_label: z.zone_label, guardian_decay: z.final_state.guardian_decay })),
    "guardian_decay",
    10,
    true
  );
  const byAttunement = topN(
    zonesReport.map((z) => ({ zone_id: z.zone_id, zone_label: z.zone_label, attunement: z.final_state.attunement })),
    "attunement",
    10,
    true
  );

  const totalRefused = zonesReport.reduce((sum, z) => sum + z.refused_events, 0);
  const attValues = zonesReport.map((z) => z.final_state.attunement);
  const attMean = attValues.reduce((s, v) => s + v, 0) / (attValues.length || 1);
  const attMin = Math.min(...attValues);
  const attMax = Math.max(...attValues);
  const refusalRate = events.length > 0 ? totalRefused / events.length : 0;

  const report = {
    generated_at: new Date().toISOString(),
    inputs: {
      zone_baseline: path.join(DOWNLOADS_DIR, "zone_baseline.csv"),
      urban_artifacts: path.join(DOWNLOADS_DIR, "urban_artifacts.csv"),
      ritual_catalog: path.join(DOWNLOADS_DIR, "ritual_catalog.csv"),
      seed_events: path.join(DOWNLOADS_DIR, "seed_events.csv"),
      policy: path.join(DOWNLOADS_DIR, "policy.yaml"),
      replay_multiplier: replayMultiplier,
      events_processed: events.length,
    },
    registries: {
      zones_count: Object.keys(zones).length,
      artifacts_h3_count: Object.keys(artifactsByH3).length,
      rituals_count: Object.keys(ritualsBySlug).length,
      policy_zone_overrides: Object.keys(policy?.zones || {}).length,
    },
    top_10: {
      resonance: byResonance,
      entropy: byEntropy,
      guardian_decay: byGuardianDecay,
      attunement: byAttunement,
    },
    refusal_summary: {
      total_refused_events: totalRefused,
      refusal_rate: Number(refusalRate.toFixed(4)),
      by_zone: zonesReport
        .filter((z) => z.refused_events > 0)
        .map((z) => ({
          zone_id: z.zone_id,
          zone_label: z.zone_label,
          refused_events: z.refused_events,
          reasons: z.refusal_reasons,
        })),
    },
    diagnostics: {
      attunement_mean: Number(attMean.toFixed(4)),
      attunement_min: Number(attMin.toFixed(4)),
      attunement_max: Number(attMax.toFixed(4)),
      refusal_rate: Number(refusalRate.toFixed(4)),
      refusal_threshold: REFUSAL_ATTUNEMENT_THRESHOLD,
      attunement_inertia: ATTUNEMENT_INERTIA,
      attunement_match_gain: ATTUNEMENT_MATCH_GAIN,
      attunement_mismatch_penalty: ATTUNEMENT_MISMATCH_PENALTY,
    },
    zones: zonesReport,
  };

  const md = [
    "# ARCHÉ City Compute v0 Report",
    "",
    `Generated: ${report.generated_at}`,
    `Events processed: ${events.length} (replay x${replayMultiplier})`,
    `Attunement mean/min/max: ${report.diagnostics.attunement_mean} / ${report.diagnostics.attunement_min} / ${report.diagnostics.attunement_max}`,
    `Refusal rate: ${report.diagnostics.refusal_rate}`,
    "",
    "## Top 10 Resonance",
    ...byResonance.map((z, i) => `${i + 1}. ${z.zone_id} (${z.zone_label}) — ${z.resonance}`),
    "",
    "## Top 10 Entropy",
    ...byEntropy.map((z, i) => `${i + 1}. ${z.zone_id} (${z.zone_label}) — ${z.entropy}`),
    "",
    "## Top 10 Guardian Decay",
    ...byGuardianDecay.map((z, i) => `${i + 1}. ${z.zone_id} (${z.zone_label}) — ${z.guardian_decay}`),
    "",
    "## Top 10 Attunement",
    ...byAttunement.map((z, i) => `${i + 1}. ${z.zone_id} (${z.zone_label}) — ${z.attunement}`),
    "",
    `## Refused Events: ${totalRefused}`,
    ...report.refusal_summary.by_zone.map(
      (z) => `- ${z.zone_id} (${z.zone_label}): ${z.refused_events} refused | reasons: ${Object.entries(z.reasons).map(([k, v]) => `${k}=${v}`).join(", ")}`
    ),
    "",
    "## Per-Zone Final State",
    ...zonesReport.map(
      (z) =>
        `- ${z.zone_id} [${z.h3}] ${z.zone_label}: entropy=${z.final_state.entropy}, resonance=${z.final_state.resonance}, guardian_decay=${z.final_state.guardian_decay}, attunement=${z.final_state.attunement}, reveal_bias=${z.final_state.reveal_bias}, status=${z.final_state.last_status}; ${z.world_status_line}`
    ),
    "",
  ].join("\n");

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(OUT_MD, md, "utf8");

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);
}

main();
