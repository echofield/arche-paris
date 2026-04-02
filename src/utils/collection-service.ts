/**
 * ARCHE - Collection service
 *
 * Manages local collection of discovered symbols.
 */

import { getStoredCard } from './card-service';
import { emitDiagnostic } from '../lib/runtime-diagnostics';
import {
  canUseCardScopedProgression,
  getProgressionArtifactUpdatedAt,
  normalizeIsoTimestamp,
  queueProgressionWrite,
  setProgressionArtifactUpdatedAt,
} from './progression-sync';

const COLLECTION_KEY = 'arche_collection';

export interface CollectedSymbol {
  symbolId: string;
  foundAt: string;
  note?: string;
}

export interface Collection {
  cardId: string;
  symbols: CollectedSymbol[];
  lastUpdated: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeCollection(raw: unknown, source: string): Collection | null {
  const record = asRecord(raw);
  if (!record) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'CollectionService',
        code: 'INVALID_ROOT',
        message: 'Collection payload is not an object; discarding persisted value.',
        details: { source, receivedType: typeof raw },
        degraded: true,
      },
      { onceKey: `CollectionService:INVALID_ROOT:${source}` },
    );
    return null;
  }

  const rawSymbols = Array.isArray(record.symbols) ? record.symbols : [];
  if (!Array.isArray(record.symbols)) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'CollectionService',
        code: 'MISSING_SYMBOLS_ARRAY',
        message: 'Collection payload missing symbols array; using empty fallback.',
        details: { source, keys: Object.keys(record) },
        degraded: true,
      },
      { onceKey: `CollectionService:MISSING_SYMBOLS_ARRAY:${source}` },
    );
  }

  const symbols: CollectedSymbol[] = [];
  let dropped = 0;
  rawSymbols.forEach((item, index) => {
    const symbolRecord = asRecord(item);
    if (!symbolRecord || typeof symbolRecord.symbolId !== 'string') {
      dropped += 1;
      emitDiagnostic(
        {
          level: 'warn',
          module: 'CollectionService',
          code: 'INVALID_SYMBOL_ITEM',
          message: 'Dropped malformed collected symbol entry.',
          details: { source, index },
          degraded: true,
        },
        { onceKey: `CollectionService:INVALID_SYMBOL_ITEM:${source}:${index}` },
      );
      return;
    }

    const symbolId = symbolRecord.symbolId;

    const foundAt = typeof symbolRecord.foundAt === 'string'
      ? symbolRecord.foundAt
      : new Date().toISOString();

    const note = typeof symbolRecord.note === 'string' ? symbolRecord.note : undefined;

    symbols.push({ symbolId, foundAt, ...(note ? { note } : {}) });
  });

  if (dropped > 0) {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'CollectionService',
        code: 'SYMBOL_ITEMS_DROPPED',
        message: 'Dropped malformed symbol items while normalizing collection.',
        details: { source, dropped, totalReceived: rawSymbols.length },
        degraded: true,
      },
      { onceKey: `CollectionService:SYMBOL_ITEMS_DROPPED:${source}:${dropped}:${rawSymbols.length}` },
    );
  }

  const storedCard = getStoredCard();
  const cardId = typeof record.cardId === 'string' && record.cardId.trim().length > 0
    ? record.cardId
    : (storedCard && storedCard.trim().length > 0 ? storedCard : 'anonymous');

  const fallbackLastUpdated = symbols[0]?.foundAt ?? getProgressionArtifactUpdatedAt('collection', new Date().toISOString());
  const lastUpdated = normalizeIsoTimestamp(record.lastUpdated, fallbackLastUpdated);

  return {
    cardId,
    symbols,
    lastUpdated,
  };
}

function parseStoredCollection(raw: string): Collection | null {
  try {
    return normalizeCollection(JSON.parse(raw), 'collection-service.getCollection');
  } catch {
    emitDiagnostic(
      {
        level: 'warn',
        module: 'CollectionService',
        code: 'JSON_PARSE_FAILED',
        message: 'Failed to parse persisted collection JSON.',
        details: { key: COLLECTION_KEY },
        degraded: true,
      },
      { onceKey: 'CollectionService:JSON_PARSE_FAILED' },
    );
    return null;
  }
}

function saveCollectionLocal(collection: Collection): void {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
}

function resolveCollectionCardId(cardId: string): string | null {
  if (cardId.trim().length > 0 && cardId !== 'anonymous') return cardId;
  const stored = getStoredCard();
  return stored && stored.trim().length > 0 ? stored : null;
}

function publishCollectionToServer(collection: Collection, source: string): void {
  const cardId = resolveCollectionCardId(collection.cardId);
  if (!canUseCardScopedProgression(cardId)) return;

  const updatedAt = setProgressionArtifactUpdatedAt('collection', collection.lastUpdated);
  if (collection.lastUpdated !== updatedAt) {
    collection.lastUpdated = updatedAt;
    saveCollectionLocal(collection);
  }

  queueProgressionWrite({
    cardId,
    artifact: 'collection',
    payload: collection,
    updatedAt,
    source,
  });
}

// Retrieve current collection
export function getCollection(): Collection | null {
  try {
    const stored = localStorage.getItem(COLLECTION_KEY);
    if (!stored) return null;

    const normalized = parseStoredCollection(stored);
    if (!normalized) return null;

    const updatedAt = getProgressionArtifactUpdatedAt('collection', normalized.lastUpdated);
    if (normalized.lastUpdated !== updatedAt) {
      normalized.lastUpdated = updatedAt;
    }

    const normalizedSerialized = JSON.stringify(normalized);
    if (normalizedSerialized !== stored) {
      localStorage.setItem(COLLECTION_KEY, normalizedSerialized);
      emitDiagnostic(
        {
          level: 'info',
          module: 'CollectionService',
          code: 'STORAGE_MIGRATED',
          message: 'Collection storage was normalized and rewritten.',
          details: {
            symbolCount: normalized.symbols.length,
          },
        },
        { devOnly: true },
      );
    }

    return normalized;
  } catch {
    return null;
  }
}

export function getCollectionSyncSnapshot(): { payload: Collection; updatedAt: string } | null {
  const collection = getCollection();
  if (!collection) return null;
  const updatedAt = getProgressionArtifactUpdatedAt('collection', collection.lastUpdated);
  return {
    payload: {
      ...collection,
      lastUpdated: updatedAt,
    },
    updatedAt,
  };
}

export function applyCollectionSyncSnapshot(
  payload: unknown,
  updatedAt: string,
  source = 'collection-service.applyCollectionSyncSnapshot',
): boolean {
  const normalized = normalizeCollection(payload, source);
  if (!normalized) return false;

  const resolvedCard = resolveCollectionCardId(normalized.cardId);
  if (resolvedCard) normalized.cardId = resolvedCard;

  const resolvedUpdatedAt = setProgressionArtifactUpdatedAt('collection', updatedAt || normalized.lastUpdated);
  normalized.lastUpdated = resolvedUpdatedAt;

  try {
    saveCollectionLocal(normalized);
    emitDiagnostic(
      {
        level: 'info',
        module: 'CollectionService',
        code: 'SYNC_SNAPSHOT_APPLIED',
        message: 'Applied collection snapshot from card-scoped persistence.',
        details: {
          source,
          symbolCount: normalized.symbols.length,
          updatedAt: resolvedUpdatedAt,
        },
      },
      { devOnly: true },
    );
    return true;
  } catch {
    return false;
  }
}

// Initialize new collection
export function initCollection(): Collection {
  const cardId = getStoredCard();
  const lastUpdated = setProgressionArtifactUpdatedAt('collection', new Date().toISOString());
  const collection: Collection = {
    cardId: cardId || 'anonymous',
    symbols: [],
    lastUpdated,
  };
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  return collection;
}

// Add symbol to collection
export function collectSymbol(symbolId: string, note?: string): boolean {
  let collection = getCollection();
  if (!collection) {
    collection = initCollection();
  }

  if (collection.symbols.some((s) => s.symbolId === symbolId)) {
    return false;
  }

  collection.symbols.push({
    symbolId,
    foundAt: new Date().toISOString(),
    note,
  });
  collection.lastUpdated = setProgressionArtifactUpdatedAt('collection', new Date().toISOString());

  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  publishCollectionToServer(collection, 'collection-service.collectSymbol');
  return true;
}

// Check whether symbol is collected
export function isSymbolCollected(symbolId: string): boolean {
  const collection = getCollection();
  if (!collection) return false;
  return collection.symbols.some((s) => s.symbolId === symbolId);
}

// Get collected symbols by arrondissement
export function getCollectedByArrondissement(
  arrondissement: number,
  allSymbols: { id: string; arrondissement: number }[],
): string[] {
  const collection = getCollection();
  if (!collection) return [];

  const arrSymbols = allSymbols.filter((s) => s.arrondissement === arrondissement);
  return collection.symbols
    .filter((collectedSymbol) => arrSymbols.some((symbol) => symbol.id === collectedSymbol.symbolId))
    .map((collectedSymbol) => collectedSymbol.symbolId);
}

// Collection statistics
export function getCollectionStats(allSymbols: { id: string; arrondissement: number }[]): {
  total: number;
  collected: number;
  byArrondissement: Record<number, { total: number; collected: number }>;
} {
  const collection = getCollection();
  const collectedIds = new Set(collection?.symbols.map((s) => s.symbolId) || []);

  const byArr: Record<number, { total: number; collected: number }> = {};
  for (let i = 1; i <= 20; i++) {
    byArr[i] = { total: 0, collected: 0 };
  }

  allSymbols.forEach((symbol) => {
    byArr[symbol.arrondissement].total++;
    if (collectedIds.has(symbol.id)) {
      byArr[symbol.arrondissement].collected++;
    }
  });

  return {
    total: allSymbols.length,
    collected: collectedIds.size,
    byArrondissement: byArr,
  };
}

// Remove symbol from collection
export function uncollectSymbol(symbolId: string): boolean {
  const collection = getCollection();
  if (!collection) return false;

  const index = collection.symbols.findIndex((s) => s.symbolId === symbolId);
  if (index === -1) return false;

  collection.symbols.splice(index, 1);
  collection.lastUpdated = setProgressionArtifactUpdatedAt('collection', new Date().toISOString());
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  publishCollectionToServer(collection, 'collection-service.uncollectSymbol');
  return true;
}

