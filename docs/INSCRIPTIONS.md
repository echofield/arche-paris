# ARCHÉ — Inscriptions Personnelles

## Vue d'ensemble

Les inscriptions transforment la relation au lieu : d'un simple point sur la carte à un espace personnel où le temps s'accumule.

**Philosophie** : Ce n'est pas du journaling. C'est un miroir du lieu. La ville offre une surface où le marcheur peut s'inscrire.

## Architecture

```
src/
├── types/
│   └── inscriptions.ts        # Types + prompts data
├── utils/
│   └── inscriptions-service.ts # Service layer + NextPromptEngine
├── components/
│   └── InscriptionsPanel.tsx   # UI overlay (panel + ritual input)
supabase/
└── migrations/
    └── 20260126_user_lieu_cards.sql  # Table + RLS
```

## Installation

### 1. Appliquer la migration Supabase

```bash
# Option A: Via Supabase CLI
supabase db push

# Option B: Via SQL Editor dans le dashboard Supabase
# Copier-coller le contenu de supabase/migrations/20260126_user_lieu_cards.sql
```

### 2. Vérifier les variables d'environnement

Assurez-vous que `src/utils/supabase/info.tsx` contient les bonnes valeurs :
- `projectId` : votre ID de projet Supabase
- `publicAnonKey` : votre clé publique anonyme

## Comment tester

### 1. Utilisateur connecté

L'utilisateur doit être authentifié pour voir ses inscriptions. Le système utilise `auth.uid()` pour isoler les données.

### 2. Accès via la carte

1. Ouvrir la **Collection Map**
2. Cliquer sur un arrondissement avec des symboles
3. Cliquer sur un symbole pour ouvrir le détail
4. Cliquer sur **"Inscrire un fragment..."**
5. Le panel d'inscriptions s'ouvre en overlay

### 3. Flow de test complet

1. **Premier accès** (état `glimpsed`)
   - Le panel montre "Nouveau lieu"
   - CTA : "Inscrire un fragment"

2. **Première inscription**
   - Question J1 : "Qu'as-tu remarqué ici que d'autres ne voient pas ?"
   - Écrire un texte (min 3 caractères)
   - Cliquer "Graver"
   - L'état devient `inscribed`

3. **Retour après 2+ jours** (simulé)
   - Question J3 disponible : "Quel souvenir ce lieu contient maintenant pour toi ?"
   - Si < 2 jours : alternative "question" proposée

4. **3+ inscriptions**
   - L'état devient `claimed` ("Lieu à toi")

## États

| État | Visuel | Déclencheur |
|------|--------|-------------|
| `glimpsed` | ○ (cercle vide) | Ouverture du panel, pas encore d'inscription |
| `inscribed` | ◐ (demi-cercle) | Au moins 1 inscription |
| `claimed` | ● (cercle plein) | 3+ inscriptions |

**Note** : `glimpsed` est un état UI uniquement. Aucun enregistrement DB n'est créé tant qu'aucune inscription n'est faite.

## Prompts (FR)

### J1 — Perception
> Qu'as-tu remarqué ici que d'autres ne voient pas ?

Whispers :
- Un seul détail suffit.
- Décris une texture, une phrase, une lumière.

### J3 — Souvenir (après 2+ jours)
> Quel souvenir ce lieu contient maintenant pour toi ?

Whispers :
- Même une image mentale.
- Une sensation suffit.

### J7 — Projection (après 4+ jours)
> Si tu revenais dans 10 ans, qu'espérerais-tu trouver inchangé ?

Whispers :
- Une chose, pas plus.
- Un geste, une ambiance, une promesse.

### Alternative — Question (toujours disponible)
> Quelle question laisses-tu au futur toi ?

## Structure des données

### Table `user_lieu_cards`

```sql
id UUID
user_id UUID (FK auth.users)
lieu_id TEXT
state ENUM ('glimpsed', 'inscribed', 'claimed')
inscriptions JSONB
last_touched TIMESTAMPTZ
created_at TIMESTAMPTZ
```

### Format inscription (JSONB array)

```json
{
  "id": "abc123xyz",
  "layer": "perception",
  "prompt_id": "lieu-v1-perception",
  "text": "La lumière dorée sur les mosaïques...",
  "created_at": "2026-01-26T14:30:00Z",
  "meta": {
    "fallback_used": false,
    "source": "user"
  }
}
```

## RLS (Row Level Security)

- Seul `auth.uid() = user_id` peut SELECT/INSERT/UPDATE/DELETE
- Aucun accès cross-user

## Fichiers clés

| Fichier | Responsabilité |
|---------|----------------|
| `src/types/inscriptions.ts` | Types TypeScript + données des prompts |
| `src/utils/inscriptions-service.ts` | API Supabase + logique NextPrompt |
| `src/components/InscriptionsPanel.tsx` | UI overlay + état local |
| `src/components/CollectionMap.tsx` | Intégration (bouton + état panel) |

## Offline-first (Phase 2)

Structure préparée pour :
- Queue localStorage en cas d'offline
- Sync à la reconnexion
- IDs stables pour éviter doublons

Non implémenté dans cette version.

## Debug

```typescript
// Dans la console du navigateur
import { getUserLieuCard, getAllUserLieuCards } from './utils/inscriptions-service';

// Voir la carte d'un lieu
const card = await getUserLieuCard('sym-2-01');
console.log(card);

// Voir toutes les cartes de l'utilisateur
const all = await getAllUserLieuCards();
console.log(all);
```
