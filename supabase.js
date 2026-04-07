import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CONFIG
const SUPABASE_URL  = 'https://jnnlpwuppxhygwqwthud.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impubmxwd3VwcHhoeWd3cXd0aHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTU4MTAsImV4cCI6MjA4OTk3MTgxMH0.1LOxQ9OHZwenL3MyqM7pYXNoReg6B_A1t9-fqgaDbBw'; // ⚠️ recomendo regenerar depois de expor

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);


// ============================================================
// AUTH
// ============================================================

/** Login com Google */
export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin // volta pro seu site
        }
    });

    if (error) console.error('Erro no login:', error.message);
}


/** IMPORTANTE: chamar isso ao carregar a página */
export async function handleAuthRedirect() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao recuperar sessão:', error.message);
        return null;
    }

    return data.session?.user ?? null;
}


/** Login com email */
export async function loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data.user;
}


/** Cadastro */
export async function signUpWithEmail(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) throw error;
    return data.user;
}


/** Logout */
export async function logout() {
    await supabase.auth.signOut();
}


/** Usuário atual */
export async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
}


/** Listener */
export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
}


// ============================================================
// GAMES
// ============================================================

export async function fetchGames() {
    const { data, error } = await supabase
        .from('games_with_clicks')
        .select('*');

    if (error) throw error;
    return data;
}

export async function registerClick(gameId) {
    const { error } = await supabase.rpc('increment_game_click', {
        p_game_id: gameId
    });

    if (error) console.error(error.message);
}

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
// FAVORITES
// ============================================================

export async function fetchFavorites(userId) {
    const { data, error } = await supabase
        .from('user_favorites')
        .select('game_id')
        .eq('user_id', userId);

    if (error) throw error;
    return data.map(r => r.game_id);
}

export async function addFavorite(userId, gameId) {
    const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, game_id: gameId });

    if (error) throw error;
}

export async function removeFavorite(userId, gameId) {
    const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId);

    if (error) throw error;
}

export async function toggleFavoriteDB(userId, gameId, isFav) {
    if (isFav) {
        await removeFavorite(userId, gameId);
    } else {
        await addFavorite(userId, gameId);
    }
}


// ============================================================
// ACHIEVEMENTS
// ============================================================

export async function fetchAchievements(userId) {
    const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data;
}

export async function unlockAchievement(userId, achievementId) {
    const { error } = await supabase
        .from('user_achievements')
        .insert({
            user_id: userId,
            achievement_id: achievementId
        });

    if (error && error.code !== '23505') {
        console.error(error.message);
    }
}


// ============================================================
// NEWS
// ============================================================

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
// PROFILE
// ============================================================

export async function fetchProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

export async function updateUsername(userId, username) {
    const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', userId);

    if (error) throw error;
}
