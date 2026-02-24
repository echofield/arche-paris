#!/usr/bin/env node
/**
 * AUDIT 2025-02-23: Lint i18n keys — détecte clés manquantes entre fr/en et optionnellement orphelines.
 * Usage: node scripts/lint-i18n-keys.mjs [--orphans] [--fail-on-missing]
 *   --orphans         : scanne src pour t('key') et signale les clés des JSON jamais utilisées (regex simple).
 *   --fail-on-missing : exit 1 si des clés manquent entre FR/EN (pour CI). N'exécute pas le scan orphelines.
 *
 * Liste blanche orphelines : les clés dont le préfixe est listé ci-dessous ne sont pas signalées comme
 * orphelines (usage dynamique possible, ex. t(`map.${key}`)).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOCALES_FR = path.join(ROOT, 'src/locales/fr');
const LOCALES_EN = path.join(ROOT, 'src/locales/en');
const SRC = path.join(ROOT, 'src');

const checkOrphans = process.argv.includes('--orphans');
const failOnMissing = process.argv.includes('--fail-on-missing');

/** Préfixes de clés considérés comme utilisés dynamiquement (ex. t(`map.${key}`)) — pas signalés comme orphelins. */
const ORPHAN_WHITELIST_PREFIXES = ['map.'];

function loadJson(dir, filename) {
  const file = path.join(dir, filename);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Error parsing ${file}:`, e.message);
    return null;
  }
}

function keysFlat(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...keysFlat(v, key));
    } else {
      out.push(key);
    }
  }
  return out;
}

// Nos fichiers JSON sont plats (clés "home.xxx", "async.xxx")
function allKeys(obj) {
  return Object.keys(obj);
}

const frFiles = fs.readdirSync(LOCALES_FR).filter((f) => f.endsWith('.json'));
const enFiles = fs.readdirSync(LOCALES_EN).filter((f) => f.endsWith('.json'));
const allFiles = [...new Set([...frFiles, ...enFiles])];

let exitCode = 0;

console.log('--- Clés manquantes FR/EN ---\n');

for (const file of allFiles.sort()) {
  const fr = loadJson(LOCALES_FR, file);
  const en = loadJson(LOCALES_EN, file);
  const frKeys = fr ? allKeys(fr) : [];
  const enKeys = en ? allKeys(en) : [];

  const missingInEn = frKeys.filter((k) => !enKeys.includes(k));
  const missingInFr = enKeys.filter((k) => !frKeys.includes(k));

  if (missingInEn.length || missingInFr.length) {
    exitCode = 1;
    console.log(`Fichier: ${file}`);
    if (missingInEn.length) {
      console.log(`  Manquantes en EN (présentes en FR): ${missingInEn.length}`);
      missingInEn.slice(0, 20).forEach((k) => console.log(`    - ${k}`));
      if (missingInEn.length > 20) console.log(`    ... et ${missingInEn.length - 20} autres`);
    }
    if (missingInFr.length) {
      console.log(`  Manquantes en FR (présentes en EN): ${missingInFr.length}`);
      missingInFr.slice(0, 20).forEach((k) => console.log(`    - ${k}`));
      if (missingInFr.length > 20) console.log(`    ... et ${missingInFr.length - 20} autres`);
    }
    console.log('');
  }
}

if (exitCode === 0 && !checkOrphans) {
  console.log('Aucune clé manquante entre FR et EN pour les fichiers comparés.\n');
}
if (failOnMissing && exitCode === 0) {
  console.log('CI (--fail-on-missing): vérification clés FR/EN OK.\n');
}

if (checkOrphans && !failOnMissing) {
  console.log('--- Scan des clés utilisées dans src (t("key") / t(\'key\')) ---\n');
  const usedKeys = new Set();
  const keyRe = /t\s*\(\s*['"]([^'"]+)['"]/g;
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && e.name !== 'node_modules') {
        scan(full);
      } else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts') || e.name.endsWith('.jsx') || e.name.endsWith('.js')) {
        const text = fs.readFileSync(full, 'utf8');
        let m;
        while ((m = keyRe.exec(text)) !== null) usedKeys.add(m[1]);
      }
    }
  }
  scan(SRC);

  const allJsonKeys = new Set();
  for (const file of allFiles) {
    const fr = loadJson(LOCALES_FR, file);
    const en = loadJson(LOCALES_EN, file);
    if (fr) Object.keys(fr).forEach((k) => allJsonKeys.add(k));
    if (en) Object.keys(en).forEach((k) => allJsonKeys.add(k));
  }

  const isWhitelisted = (key) => ORPHAN_WHITELIST_PREFIXES.some((p) => key.startsWith(p));
  const orphanKeys = [...allJsonKeys].filter((k) => !usedKeys.has(k) && !isWhitelisted(k));
  if (orphanKeys.length) {
    console.log(`Clés présentes dans les JSON mais non trouvées dans src (t("key")): ${orphanKeys.length}`);
    orphanKeys.slice(0, 40).forEach((k) => console.log(`  - ${k}`));
    if (orphanKeys.length > 40) console.log(`  ... et ${orphanKeys.length - 40} autres`);
    console.log('\n(Regex simple: peut rater t(key) avec variable ou concaténation. Préfixes ignorés: ' + ORPHAN_WHITELIST_PREFIXES.join(', ') + ')');
  } else {
    console.log('Aucune clé orpheline détectée (regex t("key") / t(\'key\')). Préfixes whitelist: ' + ORPHAN_WHITELIST_PREFIXES.join(', '));
  }
}

process.exit(exitCode);
