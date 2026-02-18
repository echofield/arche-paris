# ARCHÉ Legibility Plan: Making the World Readable

## Philosophy
The backend is rich. The UI is deliberately calm. But **calm ≠ invisible**.
We surface mechanics through **poetic indicators**, not numbers.

---

## 1. DIRECTION: "You Are Here" — LivingQuest

### Current: Homepage has 6 buttons, no guidance
### Fix: Add a **Living Quest Indicator** with strict priority

**Location**: Top of homepage, above the 6 buttons

**Component**: `LivingQuest.tsx`

### Priority Function: `getNextAction()`

```typescript
function getNextAction(): LiveAction | null {
  // 1. Active ritual in progress (timer running)
  const activeRitual = getRitualInProgress()
  if (activeRitual) return {
    type: 'ritual_active',
    label: `Terminer (${formatTime(activeRitual.remaining)})`,
    zone: activeRitual.zone
  }

  // 2. Zone entered but 0/2 rituals done
  const unsealed = getEnteredButUnsealedZone()
  if (unsealed) return {
    type: 'seal_presence',
    label: 'Sceller la présence',
    zone: unsealed.name
  }

  // 3. Engraving available (both rituals done, no inscription yet)
  const engravable = getEngravableZone()
  if (engravable) return {
    type: 'engrave',
    label: 'Laisser une phrase',
    zone: engravable.name
  }

  // 4. Custody expiring soon (< 7 days)
  const expiringCustody = getExpiringCustody()
  if (expiringCustody) return {
    type: 'renew_custody',
    label: `Renouveler garde (${expiringCustody.daysLeft}j)`,
    zone: expiringCustody.name
  }

  // 5. Incomplete meridian threshold
  const incompleteMeridian = getIncompleteMeridian()
  if (incompleteMeridian) return {
    type: 'meridian',
    label: 'Reprendre le méridien',
    threshold: incompleteMeridian.name
  }

  // 6. Default: nearest zone or start meridian
  const nearest = getNearestUnvisitedZone()
  if (nearest) return {
    type: 'explore',
    label: 'Explorer',
    zone: nearest.name
  }

  return {
    type: 'start',
    label: 'Le méridien t\'attend',
    action: 'meridiens'
  }
}
```

### Visual
```
┌─────────────────────────────────┐
│  ○ Sceller la présence          │
│  Marais                         │
│  [Continuer →]                  │
└─────────────────────────────────┘
```

**Data sources**:
- `ritual-service` → active rituals
- `zone-progress` API → entered/sealed state
- `mapState.inscriptions` → engravings
- `custody_expires_at` → expiry check
- `meridien-storage` → threshold state
- `useGeolocation` → nearest zone

---

## 2. MAP LAYERS: Distinguish "Mine" vs "City" vs "Rituels"

### Current: "Ma Carte" and "Le Champ" are separate screens
### Fix: **Layer Toggle** on PersonalMemoryMap

**Add to map header**:
```
[ Mes traces ] [ La Ville ] [ Rituels ]
```

### Layer Definitions:

#### Layer 1: Mes traces (default)
- My collection pins (bright, solid)
- My engravings (inscriptions, segments, proofs)
- My walked paths (solid lines)

#### Layer 2: La Ville (Le Champ)
- Anonymous community traces
- Faded, older = more transparent
- Dotted lines, no names
- No interaction (view only)

#### Layer 3: Rituels (MOST IMPORTANT)
Zone fill colors — no pins, just the arrondissements colored:

| State | Color | Meaning |
|-------|-------|---------|
| Jamais entré | `#e5e5e5` (grey) | Unknown territory |
| Entré | `#d4af37` (gold) | Visited, not sealed |
| Présence + Observation | `#4a7c59` (green) | Fully ritualized |
| Gardien | Gold glow border | You own this zone |

**This layer makes the city "alive" in 2 seconds.**

### Implementation:
```typescript
type MapLayer = 'traces' | 'ville' | 'rituels'
const [activeLayer, setActiveLayer] = useState<MapLayer>('traces')

// Zone fill logic for Rituels layer
function getZoneFill(zone: ZoneProgressItem): string {
  if (zone.is_custodian) return '#d4af37' // gold with glow
  if (zone.presence_at && zone.observation_at) return '#4a7c59' // green
  if (zone.entered_at) return '#d4af37' // gold
  return '#e5e5e5' // grey
}
```

---

## 3. PROGRESSION: Poetic Dots + Rare Numbers

### Current: AuraPage shows 3 rings with no context
### Fix: Add **dot indicators** and **one meaningful number**

### Design Principle: "Poetic, not numeric"
- Use dots (●●●○○○) not percentages
- **One rare number**: "Zones éveillées: 3/20"
- No "total points" or "score" — numbers must be *rare and signifiant*

### AuraPage Redesign:
```
┌─────────────────────────────────┐
│  [Complexion rings]              │
│                                  │
│  Présence  ●●●●○○               │
│  Sagesse   ●●○○○○               │
│  Ombre     ●○○○○○               │
│                                  │
│  ─────────────────────────       │
│  Zones éveillées: 3/20           │
│  ─────────────────────────       │
│                                  │
│  Prochain seuil:                 │
│  "2 rituels pour Sceau de Lutèce"│
└─────────────────────────────────┘
```

### Dot Logic:
```typescript
// 6 dots per axis, thresholds at 0, 5, 15, 30, 50, 75 points
function pointsToDots(points: number): number {
  if (points >= 75) return 6
  if (points >= 50) return 5
  if (points >= 30) return 4
  if (points >= 15) return 3
  if (points >= 5) return 2
  if (points > 0) return 1
  return 0
}
```

### Next Seal Logic:
```typescript
function getNextSeal(stats: ZoneStats, seals: string[]): string | null {
  if (!seals.includes('lutece') && stats.total_rituals >= 5)
    return `${5 - stats.total_rituals} rituels pour Sceau de Lutèce`
  if (!seals.includes('meridien') && stats.zones_complete >= 3)
    return `${3 - stats.zones_complete} zones pour Sceau du Méridien`
  // etc.
  return null
}
```

---

## 4. CUSTODY: Glow + Homepage Summary

### Current: `is_custodian` stored but never displayed
### Fix: **Gold glow** on owned zones + **homepage summary**

### Map Changes (PersonalMemoryMap):
```typescript
// In zone rendering
{zone.is_custodian && (
  <filter id={`glow-${zone.id}`}>
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge>
      <feMergeNode in="blur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
)}
<path
  d={zone.path}
  fill={getZoneFill(zone)}
  filter={zone.is_custodian ? `url(#glow-${zone.id})` : undefined}
  stroke={zone.is_custodian ? '#d4af37' : '#ccc'}
  strokeWidth={zone.is_custodian ? 2 : 1}
/>
```

### Homepage Addition:
```
┌─────────────────────────────────┐
│  Tes Gardes                      │
│  ○ Marais — 12j                  │
│  ○ Bastille — ∞                  │
└─────────────────────────────────┘
```

If no custody: don't show section (calm, not cluttered).

---

## 5. INSCRIPTIONS TIMELINE + NAV RENAMING

### Inscription Timeline in Carnet:
```
┌─────────────────────────────────┐
│  Tes Inscriptions                │
│  ─────────────────────────       │
│  17 fév — Saint-Sulpice          │
│  "La ligne invisible..."         │
│  ─────────────────────────       │
│  15 fév — Bastille               │
│  "Ici le sol tremble encore"     │
└─────────────────────────────────┘
```

### Navigation Renaming:
| Old | New | Purpose |
|-----|-----|---------|
| Ma Carte | **Mon Paris** | Personal map with traces, pins, engravings |
| Le Champ | **La Ville** | Anonymous collective map (now a layer toggle) |
| Collection | **Mes Symboles** | Gallery of collected artifacts |
| Voir la Carte | Remove | Redundant |

---

## Implementation Order

### Phase 1: LivingQuest (Direction)
1. Create `src/components/LivingQuest.tsx`
2. Implement `getNextAction()` with strict priority
3. Add to homepage above buttons
4. Wire to: `ritual-service`, zone-progress API, `meridien-storage`, `mapState`

### Phase 2: Map Layers + Rituels (Biggest Visual Impact)
5. Add layer toggle UI to `PersonalMemoryMap.tsx`
6. Implement `Rituels` layer with zone coloring (grey/gold/green)
7. Implement `La Ville` layer with faded community traces
8. Add custody glow (gold border) to owned zones

### Phase 3: Aura Progression
9. Add dot indicators to `AuraPage.tsx`
10. Add "Zones éveillées: X/20" (one rare number)
11. Add "Prochain seuil" goal indicator

### Phase 4: Custody + Homepage
12. Add "Tes Gardes" section to homepage (conditional)
13. Update `ZoneDetailSheet.tsx` to show custody status

### Phase 5: Timeline + Polish
14. Add inscription timeline to `CarnetParisien.tsx`
15. Rename navigation items in `App.tsx`
16. Remove redundant "Voir la Carte"

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/LivingQuest.tsx` | **NEW** - quest indicator with priority logic |
| `src/pages/Homepage.tsx` | Add LivingQuest, custody summary |
| `src/components/PersonalMemoryMap.tsx` | Layer toggle, Rituels layer, custody glow |
| `src/pages/AuraPage.tsx` | Dot indicators, zones count, next seal |
| `src/components/ZoneDetailSheet.tsx` | Show custody status |
| `src/pages/CarnetParisien.tsx` | Inscription timeline |
| `src/App.tsx` | Rename navigation labels |

---

## Design Principles

1. **Poetic, not numeric**: Use dots (●○) not percentages
2. **Rare numbers**: Only "Zones: 3/20" — no scores
3. **Contextual**: Show progress where relevant, not dashboards
4. **Mine vs City**: Clear visual distinction via layers
5. **Living, not static**: Show decay, expiry, next goal
6. **Calm, not cluttered**: Surface only what matters now
7. **Priority order**: LivingQuest follows strict rules, never random
