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

export async function trackAdView(adId) {
  const { error } = await supabase.rpc('increment_ad_views', { ad_id: adId });
  if (error) console.error('Error tracking ad view:', error);
}

export async function trackAdClick(adId) {
  const { error } = await supabase.rpc('increment_ad_clicks', { ad_id: adId });
  if (error) console.error('Error tracking ad click:', error);
}

export async function getGlobalStats() {
  const { count: configCount, error: configError } = await supabase
    .from('configurations')
    .select('*', { count: 'exact', head: true });

  const { count: profileCount, error: profileError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: ads, error: adsError } = await supabase
    .from('platform_ads')
    .select('views, clicks, is_active');

  return {
    totalConfigurations: configCount || 0,
    totalUsers: profileCount || 0,
    totalViews: ads?.reduce((sum, ad) => sum + (ad.views || 0), 0) || 0,
    totalClicks: ads?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0,
    activeAds: ads?.filter(ad => ad.is_active).length || 0
  };
}
