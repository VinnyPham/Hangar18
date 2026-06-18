import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Sign in with Google OAuth.
 * In Supabase dashboard: Authentication → Providers → Google → enable + add credentials.
 * Add your site URL to the redirect allow-list.
 */
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const onAuthChange = (callback) =>
  supabase.auth.onAuthStateChange((_event, session) => callback(session));

// ─── Profiles ─────────────────────────────────────────────────────────────────
// Table: profiles (id uuid PK → auth.users.id, username text, avatar_url text, bio text, created_at timestamptz)

export const getProfile = (userId) =>
  supabase.from('profiles').select('*').eq('id', userId).single();

export const upsertProfile = (profile) =>
  supabase.from('profiles').upsert(profile, { onConflict: 'id' });

export const updateProfile = (userId, updates) =>
  supabase.from('profiles').update(updates).eq('id', userId);

// ─── Routes ───────────────────────────────────────────────────────────────────
// Table: routes (id uuid PK, name text, grade text, color text, wall_section text,
//                setter text, set_date date, is_active bool, description text, created_at timestamptz)

export const getActiveRoutes = () =>
  supabase
    .from('routes')
    .select('*')
    .eq('is_active', true)
    .order('set_date', { ascending: false });

export const getRoute = (routeId) =>
  supabase
    .from('routes')
    .select(`
      *,
      sends (id, user_id, send_type, attempts, notes, date,
        profiles (id, username, avatar_url)),
      clips (id, user_id, video_url, thumbnail_url, caption, created_at,
        profiles (id, username, avatar_url))
    `)
    .eq('id', routeId)
    .single();

export const createRoute = (route) =>
  supabase.from('routes').insert(route).select().single();

export const archiveRoute = (routeId) =>
  supabase.from('routes').update({ is_active: false }).eq('id', routeId);

// ─── Sends ────────────────────────────────────────────────────────────────────
// Table: sends (id uuid PK, user_id uuid → profiles.id, route_id uuid → routes.id,
//               send_type text CHECK ('flash','send','attempt'), attempts int,
//               notes text, date date, created_at timestamptz)

export const logSend = ({ userId, routeId, sendType, attempts = 1, notes = '', date }) =>
  supabase
    .from('sends')
    .insert({
      user_id: userId,
      route_id: routeId,
      send_type: sendType,       // 'flash' | 'send' | 'attempt'
      attempts,
      notes,
      date: date ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

export const deleteSend = (sendId) =>
  supabase.from('sends').delete().eq('id', sendId);

export const getUserSends = (userId) =>
  supabase
    .from('sends')
    .select(`
      *,
      routes (id, name, grade, color, wall_section, is_active)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

export const getRecentSends = (limit = 30) =>
  supabase
    .from('sends')
    .select(`
      *,
      profiles (id, username, avatar_url),
      routes (id, name, grade, color, wall_section)
    `)
    .in('send_type', ['flash', 'send'])
    .order('created_at', { ascending: false })
    .limit(limit);

export const getRouteSends = (routeId) =>
  supabase
    .from('sends')
    .select(`*, profiles (id, username, avatar_url)`)
    .eq('route_id', routeId)
    .order('created_at', { ascending: false });

// ─── Clips ────────────────────────────────────────────────────────────────────
// Table: clips (id uuid PK, user_id uuid → profiles.id, route_id uuid → routes.id,
//               video_url text, thumbnail_url text, caption text, created_at timestamptz)

export const postClip = ({ userId, routeId, videoUrl, thumbnailUrl = null, caption = '' }) =>
  supabase
    .from('clips')
    .insert({
      user_id: userId,
      route_id: routeId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      caption,
    })
    .select()
    .single();

export const deleteClip = (clipId) =>
  supabase.from('clips').delete().eq('id', clipId);

export const getRecentClips = (limit = 20) =>
  supabase
    .from('clips')
    .select(`
      *,
      profiles (id, username, avatar_url),
      routes (id, name, grade, color, wall_section)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

export const getUserClips = (userId) =>
  supabase
    .from('clips')
    .select(`*, routes (id, name, grade, color, wall_section)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

export const getRouteClips = (routeId) =>
  supabase
    .from('clips')
    .select(`*, profiles (id, username, avatar_url)`)
    .eq('route_id', routeId)
    .order('created_at', { ascending: false });

// ─── Storage helpers (clips bucket) ──────────────────────────────────────────

export const uploadClipVideo = async (userId, file) => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('clips').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('clips').getPublicUrl(path);
  return data.publicUrl;
};