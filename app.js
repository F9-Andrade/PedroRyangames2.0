/* ============================================================
   RYAN GAMES 3.0 — app.js  (versão atualizada)
   ============================================================ */

// ─── SUPABASE ─────────────────────────────────────────────────
const SUPABASE_URL  = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON = 'sua-anon-key-aqui';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── ESTADO ───────────────────────────────────────────────────
let currentUser      = null;
let allGames         = [];
let userFavorites    = [];
let userAchievements = new Set();
let sortMode         = 'name'; // 'name' | 'clicks' | 'newest'

const Pref = {
  lang:       () => localStorage.getItem('rg_lang')   || 'pt-br',
  theme:      () => localStorage.getItem('rg_theme')  || 'dark',
  visits:     () => parseInt(localStorage.getItem('rg_visits') || '0'),
  saveLang:   (v) => localStorage.setItem('rg_lang',   v),
  saveTheme:  (v) => localStorage.setItem('rg_theme',  v),
  saveVisits: (n) => localStorage.setItem('rg_visits', n),
};

// ─── JOGOS (fallback local — usados se Supabase não configurado) ──
const LOCAL_GAMES = [
  { id:'3kh0s',         slug:'3kh0s',         name:'3kh0s Games',       url:'https://3kh0s.github.io/games/index.html',              icon:'🎮', category:'Geral',      featured:true,  total_clicks:0, added_at: '2025-11-01' },
  { id:'andrewclark',   slug:'andrewclark',   name:'AndrewClark Games', url:'https://andrewclark3244.github.io/games/',              icon:'🚀', category:'Ação',       featured:false, total_clicks:0, added_at: '2025-11-01' },
  { id:'buttertoasty',  slug:'buttertoasty',  name:'ButterToasty Bowl', url:'https://buttertoasty.github.io/Bowl/',                  icon:'🥣', category:'Casual',     featured:false, total_clicks:0, added_at: '2025-11-01' },
  { id:'gamedump',      slug:'gamedump',      name:'Game Dump PC',      url:'https://gamedump.github.io/pc.html',                    icon:'💾', category:'PC',         featured:false, total_clicks:0, added_at: '2025-11-01' },
  { id:'quiz40',        slug:'quiz40',        name:'Quiz 40 Games',     url:'https://quiz-40.github.io/',                            icon:'🧠', category:'Quiz',       featured:false, total_clicks:0, added_at: '2025-11-01' },
  { id:'gamessite',     slug:'gamessite',     name:'Games Site',        url:'https://games-site.github.io/',                         icon:'⭐', category:'Geral',      featured:true,  total_clicks:0, added_at: '2025-11-01' },
  { id:'stickmanclimb', slug:'stickmanclimb', name:'Stickman Climb 2',  url:'https://stickmanclimb2.github.io/',                     icon:'🧗', category:'Plataforma', featured:true,  total_clicks:0, added_at: '2025-11-01' },
  { id:'superhot',      slug:'superhot',      name:'SUPERHOT Prototype',url:'https://githubgames.gitlab.io/game/superhot-prototype.html', icon:'🔴', category:'Ação',  featured:false, total_clicks:0, added_at: '2025-11-01' },
  { id:'ucbg',          slug:'ucbg',          name:'UCBG Games',        url:'https://ucbg.github.io/',                               icon:'🌐', category:'Geral',      featured:false, total_clicks:0, added_at: '2025-11-01' },
  { id:'mineeeeeee',    slug:'mineeeeeee',    name:'Mineeeeeee',        url:'https://quiz-40.github.io/mineeeeeee/',                 icon:'⛏️', category:'Construção', featured:false, total_clicks:0, added_at: '2025-11-01' },
  // ── NOVOS ──
  { id:'vortexgames',   slug:'vortexgames',   name:'Vortex Games',      url:'https://vortexgames07.netlify.app',                     icon:'🌀', category:'Geral',      featured:true,  total_clicks:0, added_at: '2025-12-01' },
  { id:'githubgames',   slug:'githubgames',   name:'GitHub Games',      url:'https://githubgames.gitlab.io',                         icon:'🐙', category:'Geral',      featured:true,  total_clicks:0, added_at: '2025-12-01' },
];

// ─── CONQUISTAS ───────────────────────────────────────────────
const ACHIEVEMENTS_DEF = [
  { id:'welcome',      icon:'👋', trigger:'always',
    title_pt:'Bem-vindo(a)!',       title_en:'Welcome!',
    desc_pt:'Abriu o site.',        desc_en:'Opened the site.' },
  { id:'first_click',  icon:'🖱️', trigger:'click',
    title_pt:'Primeiro Clique',     title_en:'First Click',
    desc_pt:'Clicou em um jogo.',   desc_en:'Clicked a game.' },
  { id:'explorer',     icon:'🗺️', trigger:'clicks_5',
    title_pt:'Explorador',          title_en:'Explorer',
    desc_pt:'Clicou em 5 jogos.',   desc_en:'Clicked 5 games.' },
  { id:'collector',    icon:'⭐',  trigger:'favorites_3',
    title_pt:'Colecionador',        title_en:'Collector',
    desc_pt:'3 favoritos.',         desc_en:'3 favorites.' },
  { id:'veteran',      icon:'🥉',  trigger:'visits_5',
    title_pt:'Veterano',            title_en:'Veteran',
    desc_pt:'5 visitas ao site.',   desc_en:'5 site visits.' },
  { id:'night_owl',    icon:'🦉',  trigger:'night',
    title_pt:'Coruja Noturna',      title_en:'Night Owl',
    desc_pt:'Acessou após meia-noite.', desc_en:'Visited after midnight.' },
  { id:'master',       icon:'🏆',  trigger:'all',
    title_pt:'Mestre',              title_en:'Master',
    desc_pt:'Todas as conquistas.', desc_en:'All achievements.' },
];

// ─── TRADUÇÕES ────────────────────────────────────────────────
const T = {
  'pt-br': {
    nav_games:'JOGOS', nav_achievements:'CONQUISTAS', nav_news:'NOVIDADES',
    nav_leaderboard:'RANKING', nav_about:'SOBRE',
    hero_eyebrow:'// PORTAL DE JOGOS v3.0', hero_title_1:'RYAN', hero_title_2:'GAMES',
    hero_sub:'Sua coleção de jogos favoritos em um só lugar.',
    hero_btn_main:'Ver Jogos', hero_btn_sec:'Ranking',
    section_games:'BIBLIOTECA', title_games:'Jogos',
    section_ach:'PROGRESSO', title_ach:'Conquistas',
    section_news:'ATUALIZAÇÕES', title_news:'Novidades',
    section_lb:'COMPETIÇÃO', title_lb:'Ranking de Jogos',
    section_about:'PROJETO', title_about:'Sobre',
    tab_all:'Todos', tab_fav:'Favoritos',
    search_ph:'Buscar jogo... (Ctrl+K)', filter_all:'Todos',
    sort_label:'Ordenar:', sort_name:'A–Z', sort_clicks:'Mais jogados', sort_newest:'Mais novos',
    click_lbl:'visitas', visit_btn:'Jogar →', featured:'EM DESTAQUE', new_badge:'NOVO',
    no_results:'Nenhum jogo encontrado.',
    no_fav:'Nenhum favorito ainda. Clique na ⭐ para adicionar.',
    ach_locked:'Bloqueada', ach_unlocked_lbl:'Desbloqueada',
    ach_unlock_msg:'🏅 Conquista desbloqueada!',
    lb_rank:'#', lb_game:'Jogo', lb_clicks:'Visitas', lb_empty:'Nenhum jogo jogado ainda.',
    about_p1:'O Ryan Games 3.0 é um portal pessoal para reunir os melhores links de jogos em um único lugar, com favoritos, conquistas, ranking e muito mais.',
    about_p2:'Desenvolvido e mantido por Ryan.',
    stat_games:'Jogos', stat_favs:'Favoritos', stat_visits:'Visitas',
    settings_title:'Configurações', cfg_lang:'Idioma', cfg_theme:'Tema',
    cfg_theme_btn:'Alternar', cfg_reset_ach:'Resetar Conquistas',
    cfg_clear:'Limpar Dados Locais', cfg_reset_btn:'Resetar', cfg_clear_btn:'Limpar',
    btn_login:'Entrar com Google', btn_logout:'Sair',
    toast_theme_dark:'⚫ Modo Escuro ativado', toast_theme_light:'☀️ Modo Claro ativado',
    toast_reset_ach:'🔄 Conquistas resetadas', toast_cleared:'🗑️ Dados apagados',
    toast_fav_add:'⭐ Adicionado aos favoritos', toast_fav_rem:'✕ Removido dos favoritos',
    toast_login_required:'🔒 Entre para salvar favoritos',
    footer_status:'Online', footer_copy:'© 2025 Ryan Games 3.0 — Todos os direitos reservados',
    loading:'Carregando...', shortcut_hint:'Ctrl+K para buscar',
  },
  'en': {
    nav_games:'GAMES', nav_achievements:'ACHIEVEMENTS', nav_news:'NEWS',
    nav_leaderboard:'RANKING', nav_about:'ABOUT',
    hero_eyebrow:'// GAMES PORTAL v3.0', hero_title_1:'RYAN', hero_title_2:'GAMES',
    hero_sub:'Your favorite games collection in one place.',
    hero_btn_main:'Browse Games', hero_btn_sec:'Ranking',
    section_games:'LIBRARY', title_games:'Games',
    section_ach:'PROGRESS', title_ach:'Achievements',
    section_news:'UPDATES', title_news:"What's New",
    section_lb:'COMPETITION', title_lb:'Game Ranking',
    section_about:'PROJECT', title_about:'About',
    tab_all:'All', tab_fav:'Favorites',
    search_ph:'Search game... (Ctrl+K)', filter_all:'All',
    sort_label:'Sort:', sort_name:'A–Z', sort_clicks:'Most played', sort_newest:'Newest',
    click_lbl:'visits', visit_btn:'Play →', featured:'FEATURED', new_badge:'NEW',
    no_results:'No games found.',
    no_fav:'No favorites yet. Click ⭐ to add one.',
    ach_locked:'Locked', ach_unlocked_lbl:'Unlocked',
    ach_unlock_msg:'🏅 Achievement unlocked!',
    lb_rank:'#', lb_game:'Game', lb_clicks:'Visits', lb_empty:'No games played yet.',
    about_p1:'Ryan Games 3.0 is a personal portal to gather the best game links in one place, with favorites, achievements, ranking, and more.',
    about_p2:'Developed and maintained by Ryan.',
    stat_games:'Games', stat_favs:'Favorites', stat_visits:'Visits',
    settings_title:'Settings', cfg_lang:'Language', cfg_theme:'Theme',
    cfg_theme_btn:'Toggle', cfg_reset_ach:'Reset Achievements',
    cfg_clear:'Clear Local Data', cfg_reset_btn:'Reset', cfg_clear_btn:'Clear',
    btn_login:'Sign in with Google', btn_logout:'Sign out',
    toast_theme_dark:'⚫ Dark Mode activated', toast_theme_light:'☀️ Light Mode activated',
    toast_reset_ach:'🔄 Achievements reset', toast_cleared:'🗑️ Data cleared',
    toast_fav_add:'⭐ Added to favorites', toast_fav_rem:'✕ Removed from favorites',
    toast_login_required:'🔒 Sign in to save favorites',
    footer_status:'Online', footer_copy:'© 2025 Ryan Games 3.0 — All rights reserved',
    loading:'Loading...', shortcut_hint:'Ctrl+K to search',
  }
};

const t = (key) => (T[Pref.lang()] || T['pt-br'])[key] || key;

// ─── DOM HELPERS ───────────────────────────────────────────────
const el  = (id)      => document.getElementById(id);
const qs  = (s, ctx)  => (ctx||document).querySelector(s);
const qsa = (s, ctx)  => [...(ctx||document).querySelectorAll(s)];

// Checa se passou menos de 7 dias desde added_at
function isNew(game) {
  if (!game.added_at) return false;
  return (Date.now() - new Date(game.added_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(msg, type) {
  const wrap  = el('toast-container');
  const toast = document.createElement('div');
  toast.className   = 'toast' + (type ? ' toast-' + type : '');
  toast.textContent = msg;
  wrap.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3200);
  });
}

// ─── TEMA ─────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
}
function toggleTheme() {
  const next = Pref.theme() === 'dark' ? 'light' : 'dark';
  Pref.saveTheme(next);
  applyTheme(next);
  showToast(next === 'dark' ? t('toast_theme_dark') : t('toast_theme_light'));
}

// ─── IDIOMA ───────────────────────────────────────────────────
function translateStatic(lang) {
  el('lang-select').value = lang;
  qsa('[data-t]').forEach(node => {
    const key = node.getAttribute('data-t');
    const val = T[lang]?.[key] || key;
    if (node.tagName === 'INPUT') node.placeholder = val;
    else node.textContent = val;
  });
  const si = el('search-input');
  if (si) si.placeholder = T[lang]?.search_ph || 'Buscar...';
}
function applyLang(lang) {
  Pref.saveLang(lang);
  translateStatic(lang);
  renderGames();
  renderAchievements();
  renderNewsSection();
  renderLeaderboard();
  renderAbout();
  updateStats();
}

// ─── MENU MOBILE ──────────────────────────────────────────────
function initMobileMenu() {
  const btn  = el('hamburger');
  const menu = el('nav-links');
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });
  qsa('a', menu).forEach(a => a.addEventListener('click', () => {
    btn.classList.remove('open');
    menu.classList.remove('open');
  }));
}

// ─── BACK TO TOP ──────────────────────────────────────────────
function initBackToTop() {
  const btn = el('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── ATALHO CTRL+K ────────────────────────────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = el('search-input');
      if (!input) return;
      input.focus();
      input.select();
      el('games')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'Escape') {
      const modal = el('settings-modal');
      if (modal?.classList.contains('open')) modal.classList.remove('open');
      const input = el('search-input');
      if (document.activeElement === input) input.blur();
    }
  });
}

// ─── AUTH ─────────────────────────────────────────────────────
function renderAuthButton() {
  const wrap = el('auth-container');
  if (!wrap) return;
  if (currentUser) {
    const name = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
    const avatar = currentUser.user_metadata?.avatar_url;
    wrap.innerHTML =
      '<div class="user-pill">' +
        (avatar
          ? '<img src="' + avatar + '" class="user-avatar" alt="avatar"/>'
          : '<span class="user-initials">' + name.charAt(0).toUpperCase() + '</span>') +
        '<span class="user-name">' + name.split(' ')[0] + '</span>' +
        '<button class="nav-btn" id="logout-btn" title="' + t('btn_logout') + '">⏏</button>' +
      '</div>';
    el('logout-btn').addEventListener('click', async () => {
      await db.auth.signOut();
      showToast('👋 Até logo!');
    });
  } else {
    wrap.innerHTML =
      '<button class="nav-btn btn-login" id="login-btn">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/></svg>' +
        t('btn_login') +
      '</button>';
    el('login-btn').addEventListener('click', () => {
      db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    });
  }
}

// ─── MODAL ────────────────────────────────────────────────────
function initModal() {
  const overlay = el('settings-modal');
  el('settings-btn').addEventListener('click',  () => overlay.classList.add('open'));
  el('modal-close').addEventListener('click',   () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  el('toggle-theme-btn').addEventListener('click', toggleTheme);
  el('lang-select').addEventListener('change', (e) => applyLang(e.target.value));
  el('reset-ach-btn').addEventListener('click', async () => {
    if (!currentUser) { showToast(t('toast_login_required'), 'warn'); return; }
    await db.from('user_achievements').delete().eq('user_id', currentUser.id);
    userAchievements.clear();
    renderAchievements();
    showToast(t('toast_reset_ach'));
  });
  el('clear-data-btn').addEventListener('click', () => {
    localStorage.clear();
    showToast(t('toast_cleared'));
    setTimeout(() => location.reload(), 1200);
  });
}

// ─── JOGOS ────────────────────────────────────────────────────
let activeTab    = 'all';
let activeFilter = 'all';
let searchQuery  = '';
let searchTimer  = null;

function createGameCard(game) {
  const isFav  = userFavorites.includes(game.id);
  const count  = game.total_clicks || 0;
  const newTag = isNew(game);

  const card = document.createElement('div');
  card.className = 'game-card';
  card.setAttribute('role', 'listitem');

  card.innerHTML =
    (game.featured ? '<div class="featured-badge">' + t('featured') + '</div>' : '') +
    (newTag && !game.featured ? '<div class="new-badge">' + t('new_badge') + '</div>' : '') +
    '<div class="game-card-top">' +
      '<div class="game-icon-wrap">' + game.icon + '</div>' +
      '<div class="game-meta">' +
        '<div class="game-name">' + game.name + '</div>' +
        '<div class="game-category">' + game.category + '</div>' +
      '</div>' +
      '<button class="fav-btn ' + (isFav ? 'active' : '') + '" data-id="' + game.id + '" aria-label="Favorito" title="Favorito">' +
        (isFav ? '★' : '☆') +
      '</button>' +
    '</div>' +
    '<div class="game-card-footer">' +
      '<span class="click-count">🎮 ' + count + ' ' + t('click_lbl') + '</span>' +
      '<span class="visit-btn">' + t('visit_btn') + '</span>' +
    '</div>';

  card.addEventListener('click', (e) => { if (!e.target.closest('.fav-btn')) handleGameClick(game); });
  card.querySelector('.fav-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggleFavorite(game.id, e.currentTarget);
  });
  return card;
}

async function handleGameClick(game) {
  // Tenta atualizar no Supabase, mas não bloqueia se não estiver configurado
  try { await db.rpc('increment_game_click', { p_game_id: game.id }); } catch(_) {}
  game.total_clicks = (game.total_clicks || 0) + 1;

  const clicked = allGames.filter(g => (g.total_clicks || 0) > 0).length;
  await checkAndUnlock('first_click', clicked >= 1);
  await checkAndUnlock('explorer',   clicked >= 5);

  renderGames();
  renderLeaderboard();
  window.open(game.url, '_blank', 'noopener,noreferrer');
}

async function handleToggleFavorite(gameId, btn) {
  if (!currentUser) { showToast(t('toast_login_required'), 'warn'); return; }
  const isFav = userFavorites.includes(gameId);
  if (isFav) {
    try { await db.from('user_favorites').delete().eq('user_id', currentUser.id).eq('game_id', gameId); } catch(_) {}
    userFavorites = userFavorites.filter(id => id !== gameId);
    btn.classList.remove('active'); btn.textContent = '☆';
    showToast(t('toast_fav_rem'));
  } else {
    try { await db.from('user_favorites').insert({ user_id: currentUser.id, game_id: gameId }); } catch(_) {}
    userFavorites.push(gameId);
    btn.classList.add('active'); btn.textContent = '★';
    showToast(t('toast_fav_add'), 'success');
  }
  await checkAndUnlock('collector', userFavorites.length >= 3);
  updateStats();
  renderGames();
}

function getSortedGames(games) {
  const copy = games.slice();
  if (sortMode === 'clicks') return copy.sort((a, b) => (b.total_clicks||0) - (a.total_clicks||0));
  if (sortMode === 'newest') return copy.sort((a, b) => new Date(b.added_at||0) - new Date(a.added_at||0));
  return copy.sort((a, b) => a.name.localeCompare(b.name));
}

function getFilteredGames() {
  let games = allGames.slice();
  if (activeTab === 'fav') games = games.filter(g => userFavorites.includes(g.id));
  if (activeFilter !== 'all') games = games.filter(g => g.category === activeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    games = games.filter(g => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
  }
  return getSortedGames(games);
}

function renderGames() {
  const grid  = el('games-grid');
  const badge = qs('.tab-badge', el('tab-fav'));
  if (badge) badge.textContent = userFavorites.length;

  grid.innerHTML = '';
  const games = getFilteredGames();

  if (games.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'no-results';
    empty.innerHTML = '<div class="no-icon">🎮</div><p>' + (activeTab === 'fav' ? t('no_fav') : t('no_results')) + '</p>';
    grid.appendChild(empty);
    return;
  }
  games.forEach((game, i) => {
    const card = createGameCard(game);
    card.style.animationDelay = (i * 35) + 'ms';
    grid.appendChild(card);
  });
}

function renderFilterChips() {
  const wrap = el('filter-chips');
  wrap.innerHTML = '';
  const cats = ['all'].concat([...new Set(allGames.map(g => g.category))].sort());
  cats.forEach(cat => {
    const chip = document.createElement('button');
    chip.className   = 'chip' + (cat === activeFilter ? ' active' : '');
    chip.textContent = cat === 'all' ? t('filter_all') : cat;
    chip.addEventListener('click', () => {
      activeFilter = cat;
      qsa('.chip', wrap).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderGames();
    });
    wrap.appendChild(chip);
  });
}

function renderSortButtons() {
  const wrap = el('sort-buttons');
  if (!wrap) return;
  const opts = [
    { key: 'name',   label: t('sort_name') },
    { key: 'clicks', label: t('sort_clicks') },
    { key: 'newest', label: t('sort_newest') },
  ];
  wrap.innerHTML = '<span class="sort-label">' + t('sort_label') + '</span>';
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'sort-btn' + (sortMode === opt.key ? ' active' : '');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      sortMode = opt.key;
      qsa('.sort-btn', wrap).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGames();
    });
    wrap.appendChild(btn);
  });
}

function initGamesSection() {
  el('tab-all').addEventListener('click', () => {
    activeTab = 'all';
    el('tab-all').classList.add('active');
    el('tab-fav').classList.remove('active');
    renderGames();
  });
  el('tab-fav').addEventListener('click', () => {
    activeTab = 'fav';
    el('tab-fav').classList.add('active');
    el('tab-all').classList.remove('active');
    renderGames();
  });
  el('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      renderGames();
    }, 180); // debounce
  });

  renderFilterChips();
  renderSortButtons();
  renderGames();
}

// ─── LEADERBOARD ──────────────────────────────────────────────
function renderLeaderboard() {
  const wrap = el('leaderboard-list');
  if (!wrap) return;

  const top = allGames
    .filter(g => (g.total_clicks || 0) > 0)
    .sort((a, b) => (b.total_clicks || 0) - (a.total_clicks || 0))
    .slice(0, 10);

  if (top.length === 0) {
    wrap.innerHTML = '<p class="lb-empty">' + t('lb_empty') + '</p>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];

  wrap.innerHTML = top.map((g, i) =>
    '<div class="lb-row' + (i < 3 ? ' lb-top' : '') + '">' +
      '<span class="lb-rank">' + (medals[i] || (i + 1)) + '</span>' +
      '<span class="lb-icon">' + g.icon + '</span>' +
      '<span class="lb-name">' + g.name + '</span>' +
      '<span class="lb-count">' + (g.total_clicks || 0) + ' ' + t('click_lbl') + '</span>' +
    '</div>'
  ).join('');
}

// ─── CONQUISTAS ───────────────────────────────────────────────
async function checkAndUnlock(id, condition) {
  if (!condition || userAchievements.has(id)) return;
  userAchievements.add(id);
  if (currentUser) {
    try { await db.from('user_achievements').insert({ user_id: currentUser.id, achievement_id: id }); } catch(_) {}
  }
  showToast(t('ach_unlock_msg'), 'success');
  renderAchievements();
}

async function checkAchievements() {
  const visits  = Pref.visits();
  const clicked = allGames.filter(g => (g.total_clicks || 0) > 0).length;
  const nonAll  = ACHIEVEMENTS_DEF.filter(a => a.trigger !== 'all');
  const allDone = nonAll.every(a => userAchievements.has(a.id));
  const isNight = new Date().getHours() >= 0 && new Date().getHours() < 5;

  await checkAndUnlock('welcome',     true);
  await checkAndUnlock('first_click', clicked >= 1);
  await checkAndUnlock('explorer',    clicked >= 5);
  await checkAndUnlock('collector',   userFavorites.length >= 3);
  await checkAndUnlock('veteran',     visits >= 5);
  await checkAndUnlock('night_owl',   isNight);
  await checkAndUnlock('master',      allDone);
}

function renderAchievements() {
  const wrap = el('achievements-grid');
  const lang = Pref.lang();
  wrap.innerHTML = '';

  ACHIEVEMENTS_DEF.forEach(ach => {
    const unlocked = userAchievements.has(ach.id);
    const title    = lang === 'en' ? ach.title_en : ach.title_pt;
    const desc     = lang === 'en' ? ach.desc_en  : ach.desc_pt;
    const locked   = lang === 'en' ? 'Unlock to reveal.' : 'Desbloqueie para revelar.';

    const card = document.createElement('div');
    card.className = 'ach-card' + (unlocked ? ' unlocked' : '');
    card.innerHTML =
      '<div class="ach-icon-wrap">' + (unlocked ? ach.icon : '🔒') + '</div>' +
      '<div class="ach-info">' +
        '<div class="ach-title">' + title + '</div>' +
        '<div class="ach-desc">'  + (unlocked ? desc : locked) + '</div>' +
      '</div>' +
      '<div class="ach-status">' + (unlocked ? t('ach_unlocked_lbl') : t('ach_locked')) + '</div>';
    wrap.appendChild(card);
  });
}

// ─── NOTÍCIAS ─────────────────────────────────────────────────
async function renderNewsSection() {
  const wrap = el('news-grid');
  wrap.innerHTML = '<p class="loading-msg">' + t('loading') + '</p>';

  let news = [];
  try {
    const { data } = await db.from('news').select('*').eq('published', true)
      .order('published_at', { ascending: false }).limit(6);
    news = data || [];
  } catch(_) {}

  // Fallback se Supabase não configurado
  if (!news.length) {
    news = [
      { tag:'NOVIDADE', title_pt:'Novos Jogos!', title_en:'New Games!',
        content_pt:'Vortex Games e GitHub Games adicionados à coleção.',
        content_en:'Vortex Games and GitHub Games added to the collection.',
        published_at: new Date().toISOString() }
    ];
  }

  const lang = Pref.lang();
  wrap.innerHTML = '';
  news.forEach(item => {
    const title   = lang === 'en' ? item.title_en   : item.title_pt;
    const content = lang === 'en' ? item.content_en : item.content_pt;
    const date    = new Date(item.published_at).toLocaleDateString(
      lang === 'en' ? 'en-US' : 'pt-BR', { day:'2-digit', month:'short', year:'numeric' }
    );
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML =
      '<div class="news-tag">'     + item.tag + '</div>' +
      '<div class="news-title">'   + title    + '</div>' +
      '<span class="news-date">'   + date     + '</span>' +
      '<div class="news-content">' + content  + '</div>';
    wrap.appendChild(card);
  });
}

// ─── SOBRE ────────────────────────────────────────────────────
function renderAbout() {
  const p1 = el('about-p1'); const p2 = el('about-p2');
  if (p1) p1.textContent = t('about_p1');
  if (p2) p2.textContent = t('about_p2');
}

// ─── STATS ────────────────────────────────────────────────────
function updateStats() {
  const cg = el("chip-games"); const cf = el("chip-favs"); const cv = el("chip-visits");
  if (cg) cg.textContent = allGames.length;
  if (cf) cf.textContent = userFavorites.length;
  if (cv) cv.textContent = Pref.visits();
  const g = el('stat-games'); const f = el('stat-favs'); const v = el('stat-visits');
  if (g) g.textContent = allGames.length;
  if (f) f.textContent = userFavorites.length;
  if (v) v.textContent = Pref.visits();
}

// ─── PROGRESS BAR ─────────────────────────────────────────────
function updateProgressBar() {
  const bar = el('ach-progress-bar');
  const lbl = el('ach-progress-label');
  if (!bar) return;
  const total    = ACHIEVEMENTS_DEF.length;
  const unlocked = userAchievements.size;
  const pct      = Math.round((unlocked / total) * 100);
  bar.style.width = pct + '%';
  if (lbl) lbl.textContent = unlocked + '/' + total;
}

// ─── INIT ──────────────────────────────────────────────────────
async function init() {
  applyTheme(Pref.theme());
  translateStatic(Pref.lang());
  Pref.saveVisits(Pref.visits() + 1);

  // Sessão
  try {
    const { data: { user } } = await db.auth.getUser();
    currentUser = user;
  } catch(_) {}

  // Auth listener
  db.auth.onAuthStateChange(async (_ev, session) => {
    currentUser = session?.user || null;
    renderAuthButton();
    if (currentUser) {
      await loadUserData();
    } else {
      userFavorites = []; userAchievements = new Set();
    }
    renderGames(); renderAchievements(); updateStats(); updateProgressBar();
  });

  // Carrega jogos — tenta Supabase, usa local como fallback
  try {
    const { data } = await db.from('games_with_clicks').select('*');
    allGames = (data && data.length) ? data : LOCAL_GAMES;
  } catch(_) {
    allGames = LOCAL_GAMES;
  }

  if (currentUser) await loadUserData();

  // Renderiza
  renderAuthButton();
  initGamesSection();
  renderLeaderboard();
  renderAchievements();
  await renderNewsSection();
  renderAbout();
  updateStats();
  updateProgressBar();
  await checkAchievements();

  // UI extras
  initMobileMenu();
  initModal();
  initBackToTop();
  initKeyboardShortcuts();
}

async function loadUserData() {
  try {
    const { data: favs } = await db.from('user_favorites').select('game_id').eq('user_id', currentUser.id);
    userFavorites = (favs || []).map(r => r.game_id);
    const { data: achs } = await db.from('user_achievements').select('achievement_id').eq('user_id', currentUser.id);
    userAchievements = new Set((achs || []).map(r => r.achievement_id));
  } catch(_) {}
}

document.addEventListener('DOMContentLoaded', init);
