# Prompt pour Claude — Débogage de la carte Paris dans "Le Champ"

## Contexte du projet

ARCHÉ est une application React + Vite qui affiche une carte animée de Paris dans la section "Le Champ". La carte provient du projet `petitsouvenir` et a été extraite dans le composant `CarteInteractive.tsx`.

**IMPORTANT : Nous avons mis Supabase en pause** pour contourner les problèmes CORS. L'application fonctionne maintenant en mode développement avec `/demo` qui bypass complètement l'authentification.

## Problème actuel

La carte de Paris ne s'affiche **pas visuellement** dans "Le Champ", même si :
- Le mode dev fonctionne (`/demo` bypass l'authentification)
- Le composant `ChampMapSection` est toujours rendu (même sans données)
- Le composant `CarteInteractive` est importé et appelé
- Aucune erreur JavaScript dans la console
- Le build passe sans erreur

L'utilisateur voit uniquement le texte "Les traces apparaitront ici." mais pas la carte SVG elle-même.

## Architecture des composants

```
ChampScreen.tsx
  └─> ChampMapSection.tsx (toujours rendu)
       └─> CarteInteractive.tsx (variant="draw")
            └─> SVG inline avec animations CSS
```

### Fichiers clés

1. **`src/components/ChampScreen.tsx`** (lignes 110-165)
   - Rend toujours `<ChampMapSection />` même si `items.length === 0`
   - Affiche "Les traces apparaitront ici." séparément si pas d'items

2. **`src/components/ChampMapSection.tsx`** (lignes 98-180)
   - Wrapper autour de `CarteInteractive`
   - Ajoute des overlays SVG pour les points de phrases (mais ça ne devrait pas affecter la carte de base)
   - Structure : `<div>` → `<CarteInteractive />` → `<svg overlay>` (conditionnel)

3. **`src/components/CarteInteractive.tsx`**
   - Composant qui doit **NEVER be modified** (extrait de petitsouvenir)
   - Rend un `<div>` avec classe `carte-variant-draw`
   - Contient un SVG inline avec `id="paris-map-strokes"`
   - CSS animations via `@keyframes drawMap`
   - ViewBox: `2037.566 x 1615.5`

4. **`src/App.tsx`** (lignes 60-78)
   - Mode dev détecte `/demo` ou `/demo`
   - Bypass complètement `initializeCard()`
   - Supprime `?card=` de l'URL en mode dev
   - Met `appState` à `'ready'` directement

## Ce qui a été vérifié

✅ Le code de `ChampScreen.tsx` rend toujours `ChampMapSection`  
✅ Le code de `ChampMapSection.tsx` rend toujours `CarteInteractive`  
✅ Le build passe sans erreur (`npm run build`)  
✅ Aucune erreur TypeScript  
✅ Le mode dev fonctionne (bypass auth)  
✅ Les imports sont corrects  

## Ce qui n'a PAS été vérifié (besoin de débogage)

❓ Le SVG est-il présent dans le DOM ?  
❓ Les styles CSS sont-ils appliqués ?  
❓ Y a-t-il des conflits de styles qui cachent la carte ?  
❓ Le viewBox/width/height du SVG sont-ils corrects ?  
❓ Les animations CSS bloquent-elles le rendu ?  
❓ Y a-t-il un problème de z-index/positioning ?  
❓ Le SVG est-il rendu mais invisible (opacity: 0, display: none) ?  

## Questions pour Claude

1. **Pourquoi la carte SVG ne s'affiche-t-elle pas visuellement ?**
   - Est-ce un problème de CSS (display, visibility, opacity) ?
   - Est-ce un problème de dimensions (width: 0, height: 0) ?
   - Est-ce un problème de z-index ou de positionnement ?
   - Est-ce que le SVG est rendu mais en dehors du viewport ?

2. **Comment déboguer efficacement ?**
   - Quels éléments DevTools vérifier en priorité ?
   - Quels styles CSS sont suspects ?
   - Y a-t-il des conflits entre les styles de `CarteInteractive` et `ChampMapSection` ?

3. **Quelle est la solution ?**
   - Faut-il modifier les styles CSS ?
   - Faut-il ajuster le viewBox ou les dimensions ?
   - Faut-il changer la structure HTML/DOM ?
   - Y a-t-il un problème avec les animations CSS qui empêchent le rendu initial ?

## Informations techniques

- **Framework**: React 18 + Vite
- **Build**: `npm run build` (production)
- **Deployment**: Vercel
- **URL de test**: `https://www.xn--arch-paris-e7a.com//demo`
- **Mode dev**: Bypass complet de Supabase (pas d'appels API)
- **Navigateur**: Chrome/Edge (Windows)

## Code à analyser

### ChampScreen.tsx (extrait)
```typescript
{loading ? (
  <div>…</div>
) : (
  <>
    {/* Always show map, even if no items */}
    <ChampMapSection 
      items={items} 
      onSelect={(item) => setSelectedItem(item)}
      selectedId={selectedItem?.id ?? null}
      mapVariant="draw"
    />
    {/* Show message if no items */}
    {items.length === 0 && (
      <div>
        <p>Les traces apparaitront ici.</p>
      </div>
    )}
  </>
)}
```

### ChampMapSection.tsx (extrait)
```typescript
return (
  <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
    {/* Animated Paris Map */}
    <CarteInteractive variant={mapVariant} />
    
    {/* Sentence dots overlay */}
    {showOverlay && (
      <svg viewBox="0 0 2037.566 1615.5" style={{ position: 'absolute', ... }}>
        {/* dots */}
      </svg>
    )}
  </div>
);
```

### CarteInteractive.tsx (structure)
```typescript
return (
  <div className={`carte-variant-${variant}`} style={{ width: '100%', ... }}>
    <style>{/* CSS animations */}</style>
    <svg viewBox="0 0 2037.566 1615.5" id="paris-map-strokes">
      {/* SVG paths, polylines, polygons */}
    </svg>
  </div>
);
```

## Actions attendues de Claude

1. **Analyser le code** pour identifier pourquoi le SVG ne s'affiche pas
2. **Proposer des solutions concrètes** avec code à modifier
3. **Expliquer la cause racine** du problème
4. **Fournir des commandes de débogage** pour vérifier dans DevTools

## Note importante

**Supabase est en pause** — ne pas suggérer de solutions liées à Supabase ou aux appels API. Le problème est purement frontend/rendering.
