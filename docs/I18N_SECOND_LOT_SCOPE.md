# i18n — Second lot (AUDIT 2025-02-23)

Périmètre proposé pour la PR « second lot » après validation du premier lot.

## Objectifs

- Couvrir les écrans restants (libellés en dur → clés dans `locales/fr` et `locales/en`).
- Déduplication finale via **async.*** et **back.*** (réutiliser les clés existantes partout où c’est pertinent).
- Transition douce : garder des fallbacks pour d’éventuelles anciennes clés si besoin (le `t()` maison peut accepter un second argument pour fallback si tu l’ajoutes).

## Écrans / zones restants (à traiter en second lot)

D’après le grep des chaînes en dur (voir historique de conversation) :

- **FormesAxe / FormesSeuil / FormesCoupole** : « Retour », « Retour à Axe/Seuil/Coupole », « ← Retour »
- **EtudesHub, EtudesLangages, EtudesFormes, Etudes, etc.** : « ← Retour », « Retour aux études »
- **InscriptionsPanel, ZoneDetailSheet, Codex, CardEntry** : « Chargement... »
- **Traces** : « Réessayer »
- **QueteDetail, MeridiensInterface, ArcheInterface, TresorCache** : « Retour »
- **SystemesPouvoir, SystemesCite, SystemesArchitecture, Langages*, ParisianGlyphs, etc.** : « ← Retour », « Retour à la carte »
- **CardLogin, CardActivation, CardGate, ActivationPage** : messages d’erreur et libellés (Connexion à votre carte, Bon retour., etc.)
- **RitualRunner, ZoneEntryFeedback, ChurchQuestRun, KeptSentences, MiroirSurface** : « Erreur », « Échec », etc.
- **utils (card-gate-client, card-service, inscriptions-service)** : messages d’erreur lancés ou retournés (à exposer côté UI via clés si affichés à l’utilisateur)

Stratégie : remplacer par `t('async.retry')`, `t('async.back')`, `t('back.arrow')`, `t('back.toCity')`, `t('async.loading')`, `t('async.errorTitle')` partout où le libellé est identique ; créer des clés spécifiques (ex. `etudes.backToHub`, `card.loginTitle`) pour les libellés métier.

## Fallback pour transition

Si le `t()` actuel ne prend qu’une clé : ajouter optionnellement un second paramètre `fallback?: string` pour les clés en migration, ex. `t('old.key', { fallback: 'Ancien libelé' })` ou `t('new.key') || 'Ancien libelé'` le temps de tout migrer.

## Lint

Exécuter avant/après le second lot :

```bash
npm run lint:i18n          # clés manquantes FR/EN
npm run lint:i18n:orphans  # + clés orphelines (liste blanche pour usage dynamique dans le script)
npm run lint:i18n:ci       # CI : exit 1 si clés manquantes (pas de scan orphelines)
```

- **lint:i18n** : signale les clés manquantes entre FR et EN (par fichier JSON).
- **lint:i18n:orphans** : en plus, clés des JSON jamais vues en `t('key')` (regex). Préfixes whitelist (ex. `map.`) dans le script pour usage dynamique.
- **lint:i18n:ci** : pour la CI ; échoue uniquement si des clés manquent entre FR et EN.

## Rappels pour le second lot

- Passer le linter avant/après pour garantir FR/EN complets.
- Harmoniser via **async.*** et **back.*** pour éviter les doublons.
- Si un fallback est introduit dans `t()`, garder une durée de transition courte et le supprimer une fois tout migré.
