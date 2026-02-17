# Analyse de Migration — ARCHÉ Paris

## 📊 Utilisation actuelle de Supabase

### 1. Base de données PostgreSQL

**Tables principales :**
- `cards` — Système de cartes physiques avec activation
- `journal_entries` — Entrées du carnet parisien
- `traces` — Traces partagées sur la carte
- `user_lieu_cards` — Inscriptions personnelles sur les lieux
- `rate_limits` — Rate limiting pour sécurité
- `card_quests` — Quêtes activées par carte
- `card_events` — Journal silencieux

**Complexité SQL :**
- ✅ **RLS (Row Level Security)** — Politiques de sécurité complexes
- ✅ **Fonctions PL/pgSQL** — `activate_card()`, `consume_rate_limit()`, etc.
- ✅ **Enums personnalisés** — `user_lieu_card_state`
- ✅ **Indexes** — Optimisations de performance
- ✅ **Contraintes** — UNIQUE, FOREIGN KEY, etc.
- ✅ **JSONB** — Stockage de données flexibles

**Migrations :**
- 17 fichiers SQL de migration
- Structure évolutive avec historique

### 2. Edge Functions (Deno/Hono)

**Fonctions actives :**
- `card-gate` — Authentification, gestion de session, refresh tokens
- `make-server-9060b10a` — Vérification de cartes, activation

**Complexité :**
- ✅ Gestion de cookies httpOnly
- ✅ Rate limiting côté serveur
- ✅ CORS personnalisé (actuellement problématique)
- ✅ Logique métier complexe

### 3. Client SDK

**Utilisation :**
- Client Supabase singleton (`utils/supabase/client.ts`)
- Appels API vers Edge Functions
- Gestion de tokens et sessions

---

## 🔄 Options de Migration

### Option 1 : Rester sur Supabase (Recommandé pour l'instant)

**Avantages :**
- ✅ **Pas de migration** — Tout fonctionne déjà
- ✅ **Infrastructure gérée** — Pas de serveur à maintenir
- ✅ **PostgreSQL natif** — Base solide et performante
- ✅ **Edge Functions** — Serverless sans gestion
- ✅ **RLS intégré** — Sécurité au niveau DB
- ✅ **Gratuit jusqu'à 500MB DB** — Suffisant pour débuter

**Inconvénients :**
- ❌ **Support limité** — Plan gratuit = pas de support garanti
- ❌ **CORS problématique** — Problème actuel (mais peut être résolu)
- ❌ **Vendor lock-in** — Dépendance à Supabase

**Coût :**
- **Gratuit** : 500MB DB, 2GB bandwidth, 2M Edge Function invocations/mois
- **Pro ($25/mois)** : 8GB DB, 50GB bandwidth, 2M invocations, **support prioritaire**

**Recommandation :**
- **Court terme** : Rester sur Supabase gratuit
- **Moyen terme** : Si le projet décolle → Passer au plan Pro ($25/mois) pour le support
- **Long terme** : Évaluer migration seulement si :
  - Coûts Supabase deviennent prohibitifs (>$100/mois)
  - Besoins spécifiques non couverts
  - Contrôle total nécessaire

---

### Option 2 : Migrer vers PostgreSQL auto-hébergé

**Stack proposée :**
- **Base de données** : PostgreSQL (Railway, Render, Neon, ou VPS)
- **Backend API** : Node.js/Express ou Deno/Hono (migration des Edge Functions)
- **Authentification** : JWT custom (remplacer le système de cartes)
- **Rate limiting** : Redis ou DB-backed

**Complexité de migration :**
- 🔴 **Très élevée** — 2-3 semaines de travail minimum
- 🔴 **Risques** : Perte de données, bugs de migration, downtime

**Étapes nécessaires :**
1. **Export des données** (pg_dump)
2. **Migration du schéma** (tables, RLS, fonctions)
3. **Réécriture des Edge Functions** en API REST
4. **Migration du client** (changer tous les appels API)
5. **Tests exhaustifs** (sécurité, performance, edge cases)
6. **Déploiement progressif** (blue/green deployment)

**Coût estimé :**
- **Railway** : ~$5-20/mois (PostgreSQL + API)
- **Render** : ~$7-25/mois
- **Neon** : ~$0-19/mois (serverless PostgreSQL)
- **VPS** (Hetzner/DigitalOcean) : ~$6-12/mois + maintenance

**Avantages :**
- ✅ Contrôle total
- ✅ Pas de limites arbitraires
- ✅ Support possible (selon provider)

**Inconvénients :**
- ❌ Maintenance serveur (backups, updates, monitoring)
- ❌ Pas de RLS intégré (à implémenter manuellement)
- ❌ Pas de Edge Functions (à héberger soi-même)
- ❌ Scaling manuel nécessaire

**Recommandation :**
- ❌ **Pas recommandé** sauf si :
  - Budget >$100/mois pour Supabase
  - Besoin de contrôle absolu
  - Équipe avec expertise DevOps

---

### Option 3 : Migrer vers Firebase/Appwrite/PlanetScale

**Firebase :**
- ❌ Pas de PostgreSQL natif (Firestore = NoSQL)
- ❌ Réécriture complète nécessaire
- ✅ Bon support gratuit

**Appwrite :**
- ✅ PostgreSQL compatible
- ✅ Edge Functions similaires
- ✅ Open source
- ⚠️ Moins mature que Supabase
- ⚠️ Migration similaire à Supabase → PostgreSQL

**PlanetScale :**
- ✅ MySQL compatible (pas PostgreSQL)
- ✅ Serverless
- ⚠️ Migration SQL nécessaire (PostgreSQL → MySQL)
- ⚠️ Pas d'Edge Functions intégrées

**Recommandation :**
- ❌ **Pas recommandé** — Trop de travail pour peu de bénéfices

---

## 💰 Analyse Coût/Bénéfice

### Scénario 1 : Rester sur Supabase Gratuit
- **Coût** : $0/mois
- **Travail** : 0 jour
- **Risque** : Faible (problème CORS à résoudre)
- **Support** : Communauté Discord/GitHub

### Scénario 2 : Passer au Plan Pro Supabase
- **Coût** : $25/mois (~$300/an)
- **Travail** : 0 jour (juste upgrade)
- **Risque** : Très faible
- **Support** : Prioritaire, ticket SU-323600 suivi

### Scénario 3 : Migrer vers PostgreSQL auto-hébergé
- **Coût** : $10-25/mois (~$120-300/an)
- **Travail** : 15-20 jours (développement + tests + migration)
- **Risque** : Élevé (bugs, downtime, perte de données)
- **Support** : Selon provider (Railway/Render ont du support)

**ROI Scénario 2 vs 3 :**
- **Économie** : $0-15/mois ($0-180/an)
- **Coût de migration** : 15-20 jours × taux journalier
- **Break-even** : Si taux = $200/jour → $3000-4000 de coût de migration
- **Conclusion** : Il faudrait 16-27 ans pour rentabiliser la migration ! 🚫

---

## 🎯 Recommandation Finale

### ✅ **Court terme (0-6 mois)**
1. **Rester sur Supabase gratuit**
2. **Contourner le problème CORS** avec le mode dev (`/demo`)
3. **Utiliser la communauté** (Discord/GitHub) pour le support
4. **Documenter les problèmes** (comme vous l'avez fait)

### ✅ **Moyen terme (6-12 mois)**
1. **Si le projet décolle** → Passer au plan Pro ($25/mois)
   - Support prioritaire
   - Plus de ressources
   - Résolution du ticket SU-323600
2. **Si le projet stagne** → Rester gratuit

### ❌ **Long terme (12+ mois)**
1. **Évaluer migration seulement si** :
   - Coûts Supabase >$100/mois
   - Besoins spécifiques non couverts
   - Équipe avec expertise DevOps
2. **Sinon** → Rester sur Supabase Pro

---

## 🤔 Besoin d'une tierce personne ?

### Pour migrer vers PostgreSQL auto-hébergé
- ✅ **Oui, recommandé** si vous choisissez cette option
- **Profil** : Développeur full-stack avec expérience :
  - PostgreSQL (migrations, RLS, fonctions)
  - Node.js/Deno (API backend)
  - DevOps (Docker, déploiement, monitoring)
- **Budget estimé** : $2000-4000 pour migration complète

### Pour rester sur Supabase
- ❌ **Non nécessaire** — Vous pouvez gérer vous-même
- **Optionnel** : Consultant Supabase pour résoudre le CORS ($500-1000)

### Pour passer au plan Pro
- ❌ **Non nécessaire** — Juste un clic dans le dashboard

---

## 📋 Checklist de Décision

- [ ] **Budget mensuel disponible** : $0 / $25 / $50+ ?
- [ ] **Volume de données attendu** : <500MB / 500MB-8GB / >8GB ?
- [ ] **Besoins de support** : Communauté OK / Besoin prioritaire ?
- [ ] **Expertise DevOps** : Aucune / Moyenne / Élevée ?
- [ ] **Timeline** : Urgent / Flexible ?

**Si budget <$25/mois et expertise DevOps faible** → ✅ Rester gratuit Supabase  
**Si budget $25-50/mois** → ✅ Passer au plan Pro Supabase  
**Si budget >$50/mois et expertise DevOps élevée** → ⚠️ Considérer migration (mais ROI douteux)

---

## 🔗 Alternatives Supabase (si vraiment nécessaire)

1. **Neon** — PostgreSQL serverless, compatible Supabase
   - Migration plus facile (même SQL)
   - Pas d'Edge Functions intégrées
   - Coût similaire

2. **Railway** — PostgreSQL + déploiement simple
   - Migration Edge Functions → API Node.js
   - Coût ~$10-20/mois
   - Support communautaire

3. **Render** — Similaire à Railway
   - PostgreSQL + API
   - Coût ~$7-25/mois

---

## 💡 Conclusion

**Supabase reste le meilleur choix pour ARCHÉ** car :
1. ✅ Infrastructure déjà en place et fonctionnelle
2. ✅ Coût très faible (gratuit ou $25/mois)
3. ✅ Migration = 15-20 jours de travail pour économiser $0-15/mois
4. ✅ ROI négatif sur migration
5. ✅ Support communautaire disponible (Discord/GitHub)

**Action immédiate :**
- Rester sur Supabase gratuit
- Utiliser mode dev pour contourner CORS
- Si projet décolle → Upgrade vers Pro ($25/mois)
- Ne pas migrer sauf contrainte majeure

**Supabase est-il le meilleur ?**
- Pour votre cas d'usage : **Oui** ✅
- Alternatives valables : Neon (si migration nécessaire), Railway (si contrôle total requis)
- Mais migration = beaucoup de travail pour peu de bénéfices
