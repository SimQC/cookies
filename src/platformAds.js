import { supabase } from './supabase.js';

export async function getPlatformAds() {
  const { data, error } = await supabase
    .from('platform_ads')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAllPlatformAds() {
  const { data, error } = await supabase
    .from('platform_ads')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createPlatformAd(ad) {
  const { data, error } = await supabase
    .from('platform_ads')
    .insert([{
      ...ad,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlatformAd(id, updates) {
  const { data, error } = await supabase
    .from('platform_ads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlatformAd(id) {
  const { error } = await supabase
    .from('platform_ads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function isAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}
