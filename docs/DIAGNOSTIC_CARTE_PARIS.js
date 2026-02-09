/**
 * Script de diagnostic pour la carte Paris
 * 
 * Instructions:
 * 1. Ouvrez https://www.xn--arch-paris-e7a.com/?dev=true#champ
 * 2. Ouvrez DevTools (F12)
 * 3. Allez dans l'onglet "Console"
 * 4. Copiez-collez ce script entier
 * 5. Appuyez sur Entrée
 * 6. Partagez les résultats
 */

(function() {
  console.log('=== DIAGNOSTIC CARTE PARIS ===\n');

  // 1. Vérifier présence des éléments
  const svg = document.querySelector('#paris-map-strokes');
  const container = document.querySelector('.carte-variant-draw');
  const polyline = document.querySelector('#paris-map-strokes polyline');
  const path = document.querySelector('#paris-map-strokes path');

  console.log('1. PRÉSENCE DES ÉLÉMENTS:');
  console.log('   SVG (#paris-map-strokes):', svg ? '✅ Présent' : '❌ Absent');
  console.log('   Container (.carte-variant-draw):', container ? '✅ Présent' : '❌ Absent');
  console.log('   Polyline:', polyline ? '✅ Présent' : '❌ Absent');
  console.log('   Path:', path ? '✅ Présent' : '❌ Absent');
  console.log('');

  // 2. Dimensions
  console.log('2. DIMENSIONS:');
  if (svg) {
    const svgRect = svg.getBoundingClientRect();
    const svgComputed = getComputedStyle(svg);
    console.log('   SVG getBoundingClientRect():', `${svgRect.width.toFixed(2)}px × ${svgRect.height.toFixed(2)}px`);
    console.log('   SVG computed width:', svgComputed.width);
    console.log('   SVG computed height:', svgComputed.height);
    console.log('   SVG display:', svgComputed.display);
    console.log('   SVG visibility:', svgComputed.visibility);
    console.log('   SVG opacity:', svgComputed.opacity);
  } else {
    console.log('   ❌ SVG non trouvé, impossible de vérifier les dimensions');
  }

  if (container) {
    const containerRect = container.getBoundingClientRect();
    const containerComputed = getComputedStyle(container);
    console.log('   Container getBoundingClientRect():', `${containerRect.width.toFixed(2)}px × ${containerRect.height.toFixed(2)}px`);
    console.log('   Container computed width:', containerComputed.width);
    console.log('   Container computed height:', containerComputed.height);
    console.log('   Container aspect-ratio:', containerComputed.aspectRatio || 'non défini');
  } else {
    console.log('   ❌ Container non trouvé');
  }
  console.log('');

  // 3. Styles des strokes
  console.log('3. STYLES DES STROKES:');
  if (polyline) {
    const polylineStyle = getComputedStyle(polyline);
    console.log('   Polyline stroke:', polylineStyle.stroke);
    console.log('   Polyline stroke-width:', polylineStyle.strokeWidth);
    console.log('   Polyline stroke-dasharray:', polylineStyle.strokeDasharray);
    console.log('   Polyline stroke-dashoffset:', polylineStyle.strokeDashoffset);
    console.log('   Polyline opacity:', polylineStyle.opacity);
    console.log('   Polyline visibility:', polylineStyle.visibility);
    console.log('   Polyline display:', polylineStyle.display);
    
    // Vérifier si l'animation est appliquée
    const animationName = polylineStyle.animationName;
    const animationDuration = polylineStyle.animationDuration;
    const animationFillMode = polylineStyle.animationFillMode;
    console.log('   Polyline animation-name:', animationName || 'none');
    console.log('   Polyline animation-duration:', animationDuration || 'none');
    console.log('   Polyline animation-fill-mode:', animationFillMode || 'none');
    
    // Vérifier si stroke-dashoffset est à 2000 (invisible) ou 0 (visible)
    const dashOffset = parseFloat(polylineStyle.strokeDashoffset);
    if (dashOffset === 2000) {
      console.log('   ⚠️  stroke-dashoffset = 2000 → LIGNE INVISIBLE (animation pas démarrée ou bloquée)');
    } else if (dashOffset === 0) {
      console.log('   ✅ stroke-dashoffset = 0 → LIGNE VISIBLE');
    } else {
      console.log('   ⚠️  stroke-dashoffset =', dashOffset, '→ État intermédiaire');
    }
  } else {
    console.log('   ❌ Polyline non trouvé, impossible de vérifier les styles');
  }
  console.log('');

  // 4. Vérifier les keyframes
  console.log('4. KEYFRAMES CSS:');
  let keyframesFound = false;
  let keyframesCount = 0;
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'drawMap') {
            keyframesFound = true;
            keyframesCount++;
            console.log('   ✅ Keyframes "drawMap" trouvés dans:', sheet.href || 'inline style');
          }
        }
      } catch (e) {
        // Cross-origin stylesheet, ignore
      }
    }
  } catch (e) {
    console.log('   ⚠️  Erreur lors de la vérification des stylesheets:', e.message);
  }
  
  if (!keyframesFound) {
    console.log('   ❌ Keyframes "drawMap" NON TROUVÉS');
    console.log('   → Les styles inline ne sont peut-être pas injectés correctement');
  } else {
    console.log('   ✅ Keyframes trouvés:', keyframesCount, 'fois');
  }
  console.log('');

  // 5. Vérifier le SVG parent
  console.log('5. SVG PARENT:');
  if (svg && svg.parentElement) {
    const svgParent = svg.parentElement;
    const svgParentRect = svgParent.getBoundingClientRect();
    const svgParentComputed = getComputedStyle(svgParent);
    console.log('   SVG parent tag:', svgParent.tagName);
    console.log('   SVG parent class:', svgParent.className);
    console.log('   SVG parent dimensions:', `${svgParentRect.width.toFixed(2)}px × ${svgParentRect.height.toFixed(2)}px`);
    console.log('   SVG parent viewBox:', svgParent.getAttribute('viewBox') || 'non défini');
    console.log('   SVG parent preserveAspectRatio:', svgParent.getAttribute('preserveAspectRatio') || 'non défini');
  }
  console.log('');

  // 6. Résumé et recommandations
  console.log('6. RÉSUMÉ:');
  const issues = [];
  
  if (!svg) {
    issues.push('❌ SVG non présent dans le DOM');
  } else {
    const svgRect = svg.getBoundingClientRect();
    if (svgRect.height === 0) {
      issues.push('❌ SVG a height: 0 (problème de layout)');
    }
  }
  
  if (polyline) {
    const dashOffset = parseFloat(getComputedStyle(polyline).strokeDashoffset);
    if (dashOffset === 2000) {
      issues.push('❌ stroke-dashoffset = 2000 (animation ne s\'exécute pas)');
    }
  }
  
  if (!keyframesFound) {
    issues.push('❌ Keyframes "drawMap" non trouvés');
  }
  
  if (issues.length === 0) {
    console.log('   ✅ Aucun problème détecté');
    console.log('   → Si la carte n\'est toujours pas visible, vérifiez:');
    console.log('      - Couleur du stroke (devrait être #003D2C)');
    console.log('      - Opacity (devrait être 0.6)');
    console.log('      - Z-index (devrait être au-dessus du background)');
  } else {
    console.log('   ⚠️  PROBLÈMES DÉTECTÉS:');
    issues.forEach(issue => console.log('   ', issue));
  }
  
  console.log('\n=== FIN DU DIAGNOSTIC ===');
})();
