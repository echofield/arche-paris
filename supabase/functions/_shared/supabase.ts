import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const getServiceClient = () => {
  return createClient(supabaseUrl, serviceRoleKey);
};

export const getAnonClient = () => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(supabaseUrl, anonKey);
};
