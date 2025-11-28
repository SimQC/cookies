import { supabase } from './supabase.js';

export async function getConfigurations(userId) {
  const { data, error } = await supabase
    .from('configurations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConfiguration(id) {
  const { data, error } = await supabase
    .from('configurations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createConfiguration(userId, config) {
  const { data, error } = await supabase
    .from('configurations')
    .insert([{
      user_id: userId,
      name: config.name,
      config_data: config.config_data,
      selected_services: config.selected_services,
      is_active: config.is_active !== false
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConfiguration(id, updates) {
  const { data, error } = await supabase
    .from('configurations')
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

export async function deleteConfiguration(id) {
  const { error } = await supabase
    .from('configurations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getBanners(configId) {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('config_id', configId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createBanner(banner) {
  const { data, error } = await supabase
    .from('banners')
    .insert([banner])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBanner(id, updates) {
  const { data, error } = await supabase
    .from('banners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBanner(id) {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
