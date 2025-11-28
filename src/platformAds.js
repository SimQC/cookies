import { supabase } from './supabase.js';

export async function getPlatformAds() {
  const { data, error } = await supabase
    .from('platform_ads')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllPlatformAds() {
  const { data, error } = await supabase
    .from('platform_ads')
    .select('*')
    .order('created_at', { ascending: false });

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

export async function getGlobalStats() {
  const { data: configs, error: configError } = await supabase
    .from('configurations')
    .select('id', { count: 'exact', head: true });

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { data: ads, error: adsError } = await supabase
    .from('platform_ads')
    .select('views, clicks');

  return {
    totalConfigurations: configs?.length || 0,
    totalUsers: profiles?.length || 0,
    totalViews: ads?.reduce((sum, ad) => sum + (ad.views || 0), 0) || 0,
    totalClicks: ads?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0,
    activeAds: ads?.filter(ad => ad.is_active).length || 0
  };
}
