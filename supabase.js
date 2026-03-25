/* ============================================================
   RYAN GAMES 3.0 — supabase.js
   Cole sua URL e chave anon do projeto Supabase abaixo.
   ============================================================ */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────
// Encontre esses valores em: Supabase → Settings → API
const SUPABASE_URL  = 'https://jnnlpwuppxhygwqwthud.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impubmxwd3VwcHhoeWd3cXd0aHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTU4MTAsImV4cCI6MjA4OTk3MTgxMH0.1LOxQ9OHZwenL3MyqM7pYXNoReg6B_A1t9-fqgaDbBw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);


// ============================================================
// AUTH — Login / Logout / Sessão
// ============================================================

/** Login com Google (popup) */
export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) console.error('Erro no login:', error.message);
}

/** Login com email + senha */
export async function loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
}

/** Cadastro com email + senha */
export async function signUpWithEmail(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
}

/** Logout */
export async function logout() {
    await supabase.auth.signOut();
}

/** Retorna o usuário logado ou null */
export async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
}

/** Escuta mudanças de sessão (login/logout) */
export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
}


// ============================================================
// GAMES — Lista e cliques
// ============================================================

/** Retorna todos os jogos ativos com total de cliques */
export async function fetchGames() {
    const { data, error } = await supabase
        .from('games_with_clicks')
        .select('*');
    if (error) throw error;
    return data;
}

/** Registra um clique em um jogo (via RPC segura) */
export async function registerClick(gameId) {
    const { error } = await supabase.rpc('increment_game_click', {
        p_game_id: gameId
    });
    if (error) console.error('Erro ao registrar clique:', error.message);
}

/** Top N jogos mais clicados (leaderboard) */
export async function fetchLeaderboard(limit = 5) {
    const { data, error } = await supabase
        .from('games_with_clicks')
        .select('id, name, icon, total_clicks')
        .order('total_clicks', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data;
}


// ============================================================
// FAVORITES — Favoritos do usuário logado
// ============================================================

/** Retorna os IDs dos jogos favoritos do usuário */
export async function fetchFavorites(userId) {
    const { data, error } = await supabase
        .from('user_favorites')
        .select('game_id')
        .eq('user_id', userId);
    if (error) throw error;
    return data.map(row => row.game_id);
}

/** Adiciona um jogo aos favoritos */
export async function addFavorite(userId, gameId) {
    const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, game_id: gameId });
    if (error) throw error;
}

/** Remove um jogo dos favoritos */
export async function removeFavorite(userId, gameId) {
    const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId);
    if (error) throw error;
}

/** Alterna favorito (adiciona se não tem, remove se tem) */
export async function toggleFavoriteDB(userId, gameId, isFav) {
    if (isFav) {
        await removeFavorite(userId, gameId);
    } else {
        await addFavorite(userId, gameId);
    }
}


// ============================================================
// ACHIEVEMENTS — Conquistas do usuário
// ============================================================

/** Retorna os IDs das conquistas desbloqueadas */
export async function fetchAchievements(userId) {
    const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);
    if (error) throw error;
    return data; // [{ achievement_id, unlocked_at }]
}

/** Desbloqueia uma conquista (ignora se já existe) */
export async function unlockAchievement(userId, achievementId) {
    const { error } = await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: achievementId })
        .throwOnError();

    // UNIQUE constraint ignora duplicatas — apenas loga o aviso
    if (error && error.code !== '23505') {
        console.error('Erro ao salvar conquista:', error.message);
    }
}


// ============================================================
// NEWS — Notícias
// ============================================================

/** Retorna notícias publicadas, mais recentes primeiro */
export async function fetchNews(limit = 10) {
    const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data;
}


// ============================================================
// PROFILE — Perfil do usuário
// ============================================================

/** Retorna o perfil do usuário */
export async function fetchProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

/** Atualiza o username do perfil */
export async function updateUsername(userId, username) {
    const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', userId);
    if (error) throw error;
}
