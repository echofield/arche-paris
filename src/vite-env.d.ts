/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_DEBUG_TERRITORY?: string;
  readonly VITE_CARD_GATE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
