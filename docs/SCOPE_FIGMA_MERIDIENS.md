# Scope Figma — Méridiens

**Destinataire :** Figma (design)  
**Projet :** ARCHÉ Paris  
**Objet :** Page Méridiens — design sensoriel et progressif, inspiré d’Aura.  
**Contexte :** Figma n’a pas la page Méridiens ; ce document décrit tout le scope pour qu’il puisse la concevoir en s’inspirant d’Aura (qu’il connaît).

---

## 1. Inspiration : Aura

**Référence principale : Aura.**

- C’est le projet que tu connais. **Inspire-toi de son flow**, pas en copiant le design, mais en transposant l’esprit :
  - **Étapes vécues** : Aura révèle par états, par paliers ; on sent un changement, une progression.
  - **Box-in-box sensoriel** : espaces imbriqués, respiration, densité qui varie — pas une interface plate.
  - **Langage incarné** : Aura parle à l’intérieur ; pas de jargon technique, pas de “l’app”, pas de “fonctionnalité”.

**Pour Méridiens, on veut la même qualité de progression vécue, mais tournée vers le corps et la marche :**

- Aura → intérieur (état, miroir, complexion).  
- Méridiens → **corps** (approcher le lieu, la ligne répond, le lieu te reconnaît).

Donc : **étapes, box-in-box sensoriel, densité et respiration**, comme Aura — mais appliqués à un parcours physique (se rapprocher de la ligne, des lieux).

---

## 2. Ce qu’est Méridiens (concept)

- **Trois lieux** sur le méridien de Paris : **Saint-Sulpice**, **Tour de l’Horloge**, **Point Zéro**.  
- L’idée : **le lieu ne te localise pas, il te reconnaît.** Ce n’est pas “l’app qui détecte” ; c’est **ta présence qui entre dans le seuil du lieu**, et le lieu répond.  
- **Processus réel (pour toi, ne pas afficher)** : la position réelle de la personne (sur le terrain) détermine des états (Égaré → Proche → Sur la ligne → Aligné). Quand elle est dans le rayon du lieu, le lieu “reconnaît”. Rien ne se débloque à distance.  
- **Ton ARCHÉ (non-négociable)** : jamais “l’app”, “l’utilisateur”, “fonctionnalité”, “ARCHÉ détecte”. Préférer : “ARCHÉ te reconnaît”, “le lieu reconnaît ta présence”, “la ligne répond”. Langage incarné, jamais technique. ARCHÉ ne parle jamais comme un logiciel.

---

## 3. Contenu et structure actuels (scope à designer)

### 3.1 Vue principale “Méridiens” (celle à repenser en priorité)

C’est la première chose que la personne voit en entrant sur Méridiens.

**Éléments existants :**

- **Titre** : “Méridiens” (petit chapô au-dessus).
- **Carte** : silhouette de Paris (schématique), avec une **ligne verticale** (le méridien) et **trois points** (les trois lieux). Pas de carte réaliste ; épuré.
- **État courant** (un seul mot/phrase) :  
  - **Égaré.** (loin de la ligne)  
  - **Proche.**  
  - **Sur la ligne.**  
  - **Aligné.** (sur la ligne + orientation N/S)
- **Liste des trois lieux**, chacun avec :
  - Nom : **Saint-Sulpice** | **Tour de l’Horloge** | **Point Zéro**
  - Statut : **Reconnu** ou **Non reconnu** (selon que la personne a été “dans le seuil” du lieu).
- **Phrase de sens** :  
  - “Le lieu ne te localise pas. Il te reconnaît.”  
  - À ajouter (déjà validée) juste en dessous :  
    - **FR :** “Approche du lieu. Lorsque ta présence entre dans son seuil, il te reconnaît.”  
    - **EN :** “Approach the place. When your presence enters its threshold, it recognizes you.”
- **Bouton d’action** : “Trouver la ligne” (entrée vers la quête / la marche).

**Comportement actuel (invisible en design mais à garder en tête) :**

- Si la personne n’a pas encore autorisé la localisation : on affiche quand même la phrase “Le lieu ne te localise pas. Il te reconnaît.” (et la phrase d’approche). Pas de message technique du type “GPS désactivé”.
- La **ligne** et un **halo** sur la carte peuvent varier en opacité / intensité selon l’état (Égaré → Aligné) pour donner une sensation de “la ligne répond” sans rien expliquer en mètres ou en technique.

**Ce qui manque aujourd’hui (et que le design doit résoudre) :**

- La page est **conceptuelle et statique**. On comprend l’ambiance mais pas **l’action physique** : qu’est-ce que je fais concrètement ?
- Il manque une **progression vécue** :  
  Égaré → Tu approches → La ligne se précise → Le lieu commence à répondre → Reconnu.  
  Pas à expliquer par du texte technique, mais à **rendre sensible** par la structure visuelle et les micro-phrases.

### 3.2 Autres vues (à connaître, pas à refaire en détail dans un premier temps)

- **Vue “seuil” (sur place)** : quand la personne est dans le rayon d’un lieu, on bascule sur un écran dédié à ce lieu (titre poétique, texte d’arrivée, invites à “Observer”, bouton “Inscrire”). Tu peux l’envisager comme une **boîte plus intime** (box-in-box) qui s’ouvre quand le lieu reconnaît.
- **Vue “inscription”** : formulaire minimal (réponse + phrase personnelle) pour graver le passage. Reste sobre, incarné.
- **Vue “traversée”** : quand les trois lieux ont été reconnus et qu’une “traversée” est enregistrée : “Tu as traversé.” / “De l’heure solaire à l’espace absolu.” — moment de respiration, conclusion d’étape.

Tu peux proposer une cohérence visuelle et sensorielle entre la **vue principale Méridiens** et ces autres vues (même grammaire de boîtes, de densité, de respiration), sans tout détailler en premier rendu.

---

## 4. Direction de design demandée

### 4.1 États vivants

- Faire **varier subtilement** le contenu ou la composition selon l’état : **Égaré | Proche | Sur la ligne | Aligné**.
- Par exemple : micro-phrases différentes, poids typo, opacité de la ligne ou du halo, “respiration” du bloc carte. L’idée : on **sent** qu’on avance, sans afficher de distance ni de métrique.

### 4.2 Lecture en couches

- **Premier niveau** : simple, immédiat (ex. “Approche.” ou l’équivalent).
- **Niveau plus profond** : qui n’apparaît ou ne s’affirme que quand la personne est **proche** (ex. “La ligne devient perceptible.”). Pas obligatoire d’avoir deux lignes partout ; l’idée est une révélation progressive, comme sur Aura.

### 4.3 Mouvement implicite

- Sans animation lourde : **variation de densité**, **apparition progressive**, **respiration visuelle** (espace, marges, poids des blocs) pour que la page ne soit plus statique. La personne doit avoir l’impression que “la ligne répond” et que “le lieu répond” quand elle approche.

### 4.4 Phrase-pont (déjà validée — à intégrer)

- Sous “Le lieu ne te localise pas. Il te reconnaît.” ajouter :
  - **FR :** “Approche du lieu. Lorsque ta présence entre dans son seuil, il te reconnaît.”
  - **EN :** “Approach the place. When your presence enters its threshold, it recognizes you.”
- Le design doit donner à cette phrase sa place (hiérarchie, respiration) pour qu’elle fasse le lien entre la poésie et l’action physique.

---

## 5. Contraintes techniques (pour cohérence dev)

- **Responsive** : mobile-first, lisible sur petit écran (la carte et la liste doivent rester clairs).
- **Accessibilité** : contrastes et tailles de texte conformes aux usages (on peut détailler en phase 2 si besoin).
- **Pas de copy technique** : pas de “GPS”, “mètres”, “localisation” dans les textes visibles. ARCHÉ montre le **geste** (approcher, entrer dans le seuil), jamais le calcul.

---

## 6. Livrables attendus (à préciser avec toi)

- **Vue principale Méridiens** : structure, hiérarchie, états (Égaré / Proche / Sur la ligne / Aligné), placement de la phrase-pont et du bouton “Trouver la ligne”. Proposition de **box-in-box sensoriel** et de **progression vécue** (respiration, densité).
- **Optionnel en première phase** : pistes pour la cohérence avec la vue “seuil” et la vue “traversée” (même langage visuel, pas nécessairement tous les écrans en détail).
- **Ton** : toutes les micro-copies proposées doivent respecter le ton ARCHÉ (incarné, pas technique, pas “l’app”).

---

## 7. Résumé en une phrase

**Méridiens doit faire sentir la progression corporelle (Égaré → approche → la ligne répond → reconnu) dans un cadre box-in-box sensoriel inspiré d’Aura, sans jamais expliquer la technique — seulement le geste et le seuil.**

Si tu veux, on peut ajouter des captures ou des maquettes Aura en référence dans un second temps. Pour l’instant, ce document contient tout le scope nécessaire pour focaliser sur Méridiens en t’inspirant des étapes et du sensoriel d’Aura.
