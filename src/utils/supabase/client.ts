/**
 * ARCHÉ — Client Supabase Singleton
 *
 * Instance unique partagée pour éviter les multiples GoTrueClient.
 *
 * Résilience : si les variables d'environnement Supabase sont absentes
 * (build sans clé, backend hors-ligne), on NE jette PAS à l'import — sinon
 * toute l'application affiche un écran blanc ("supabaseKey is required").
 * On construit un client avec une URL/clé neutres ; les appels réseau
 * échouent proprement et les appelants gèrent déjà { data: null, error }.
 * Utilisez `isSupabaseConfigured` pour court-circuiter les appels inutiles.
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

export const isSupabaseConfigured = Boolean(projectId && publicAnonKey);

const supabaseUrl = isSupabaseConfigured
  ? `https://${projectId}.supabase.co`
  : 'https://unconfigured.supabase.co';

// createClient exige une clé non-vide ; on fournit un marqueur lisible
// quand la configuration manque pour éviter un throw au chargement du module.
const supabaseKey = isSupabaseConfigured ? publicAnonKey : 'unconfigured-anon-key';

if (!isSupabaseConfigured && typeof console !== 'undefined') {
  console.warn(
    '[ARCHÉ] Supabase non configuré (VITE_SUPABASE_PROJECT_ID / VITE_SUPABASE_ANON_KEY absents). ' +
      'L\'application fonctionne en mode local ; les fonctionnalités serveur sont désactivées.',
  );
}

// Client singleton - une seule instance pour toute l'app
export const supabase = createClient(supabaseUrl, supabaseKey);
