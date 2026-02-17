# Plan complet — Quêtes (Méridiens, Lieux) + AURA branchée backend

Document unique qui consolide tout le scope décidé : quêtes église (code + chrono + questionnaire), hub Quêtes (Méridiens, Lieux), AURA branchée sur toute la progression backend, modèle mathématique, évolutions visuelles et récompenses.

---

## 1. Navigation et structure

- **Quêtes** = entrée unique (hub). Ne pas ajouter "Marches" comme sous-menu.
- **Sous Quêtes** :
  - **Méridiens** → carte des lieux (adresses) ; par lieu : choix **Experience Méridiens** (live) ou **Quête** (code → chrono → 3 questions).
  - **Lieux** → quêtes sur place (même format : code + questionnaire), éventuellement d’autres lieux que les églises méridien.
  - **Extensible** → autres formats de quêtes plus tard, sans refonte.
- **Marches** (Lutèce, 1789, Table) restent isolées comme aujourd’hui (éventuellement renommées "Découvertes" plus tard).

---

## 2. Quêtes église (présence + timer)

- **Déclenchement** : option B — **code du lieu** (ex. IHS, MÉRIDIEN). Pas de GPS pour le MVP.
- **Flow** : entrée du code → backend crée une session (`started_at`, `expires_at` = +3m30) → 3 questions (texte / MCQ) → à la fin ou au timeout : **complete**. Si `now > expires_at` : on peut terminer mais **sans sceau** (mode "trop tard").
- **Données** :
  - **Quest** (définition) : id, title, place_name, onsite_code, duration_sec, questions[], rewards (aura_points, seals, status_unlock).
  - **Quest run** (session) : id, card_id, quest_id, started_at, expires_at, completed_at, state (running | completed | expired), answers, score, earned_seal.
- **Backend** : Card Gate — `POST /quest/start`, `POST /quest/answer`, `POST /quest/complete`. Tables `church_quest_runs` et `aura_profiles` (migration).

---

## 3. AURA branchée sur toute la progression backend

- **Une seule source de vérité** : `aura_profiles` (card_id, aura_level, aura_points, status, last_quest_at, seals).
- **Qui alimente AURA** (au fil du temps) :
  - Quêtes église (complétion, earned_seal) → points, sceaux, statut.
  - Marches (run fermé, segment gravé) → à brancher si on le décide.
  - Méridiens (preuve validée) → idem.
  - Inscriptions / traces → idem.
- **Page AURA** : affiche statut, micro-marques (• • •), dernier sceau ; **couleur / style évoluent** avec le niveau ou le statut (règles à définir côté UI).

---

## 4. Modèle mathématique (aura + statut)

- **Déterministe** : aura et statut dérivés de **valeurs numériques** (aura_points, nombre de sceaux, nombre de quêtes, "lieu revisité", "activité sur N semaines", etc.).
- **Règles en seuils** (exemples) :
  - Quiet : 0 quête complétée.
  - Marcheur : ≥ 1 quête complétée.
  - Lecteur de signes : ≥ 1 quête église avec earned_seal.
  - Habitant du seuil : ≥ 3 sceaux + 1 lieu revisité (même quête après 7 jours).
  - Gardien discret : ≥ 7 sceaux + régularité (ex. 1 quête/semaine sur 3 semaines).
- **Récompenses** : à méditer ; le modèle peut prévoir un champ ou des seuils "déblocage" (ex. status_unlock, ou "unlock when status ≥ X") pour plus tard.

---

## 5. Évolutions visuelles et micro-animations

- **Couleur / statut** : évoluent selon les valeurs backend (niveau, statut) — map déterministe côté front (ex. status → couleur, level → intensité).
- **Mini-animations** : au moment d’un accomplissement (quête terminée, sceau gagné, statut qui change) — discret, court, cohérent avec l’ambiance ARCHÉ. Détails (durée, type, déclencheurs) à préciser plus tard.

---

## 6. Implémentation technique (rappel)

- **Backend** : mêmes tuyaux (Card Gate via proxy), nouvelles routes et tables ; pas d’appel Supabase direct supplémentaire.
- **Front** : hub Quêtes (écran avec Méridiens, Lieux), carte Méridiens avec adresses et choix Experience / Quête par lieu, écran quête église (code → timer → 3 Q → complete), AURA qui lit `GET /aura/profile` (ou map-state étendu) et affiche statut + marques + dernier sceau.
- **Stabilité** : pas de refonte des marches ; tout nouveau flux passe par le proxy et le JWT existants.

---

## 7. Fichiers / livrables (ordre logique)

1. Types + données : `src/types/church-quest.ts`, `src/data/church-quests.ts` (2 quêtes : IHS, Seuil).
2. Migration : `church_quest_runs`, `aura_profiles` + RLS.
3. Card Gate : `POST /quest/start`, `/quest/answer`, `/quest/complete`, `GET /aura/profile` (ou dans map-state) ; calcul statut/points dans complete.
4. Client : appels quest + getAuraProfile (card-gate-client ou church-quest-client).
5. UI : hub Quêtes (Méridiens, Lieux) ; Méridiens = carte + détail lieu (Experience / Quête) ; ChurchQuestRun (code → timer → 3 Q → result).
6. AURA : fetch profil, affichage statut + marques + dernier sceau ; évolution couleur/statut selon modèle.
7. Plus tard : mini-animations sur accomplissement ; règles récompenses ; branchement marches/méridiens/inscriptions sur aura_profiles.

---

*Dernière mise à jour : consolidation des échanges — hub Quêtes (Méridiens, Lieux), AURA = vitrine unique branchée backend, modèle mathématique, animations et récompenses à détailler.*
