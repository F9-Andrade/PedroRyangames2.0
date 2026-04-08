/* ============================================================
   RYAN GAMES 3.0 — app.js
   Event delegation em todos os elementos dinâmicos.
   Listeners fixos registrados uma única vez no init.
   ============================================================ */

// ─── SUPABASE ─────────────────────────────────────────────────
const SUPABASE_URL  = 'https://jnnlpwuppxhygwqwthud.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impubmxwd3VwcHhoeWd3cXd0aHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTU4MTAsImV4cCI6MjA4OTk3MTgxMH0.1LOxQ9OHZwenL3MyqM7pYXNoReg6B_A1t9-fqgaDbBw';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── ESTADO ───────────────────────────────────────────────────
let currentUser      = null;
let allGames         = [];
let userFavorites    = [];
let userAchievements = new Set();
let sortMode         = 'name';
let activeTab        = 'all';
let activeFilter     = 'all';
let searchQuery      = '';
let searchTimer      = null;
let _authReady       = false;

const Pref = {
  lang:       () => localStorage.getItem('rg_lang')   || 'pt-br',
  theme:      () => localStorage.getItem('rg_theme')  || 'dark',
  visits:     () => parseInt(localStorage.getItem('rg_visits') || '0'),
  saveLang:   (v) => localStorage.setItem('rg_lang',   v),
  saveTheme:  (v) => localStorage.setItem('rg_theme',  v),
  saveVisits: (n) => localStorage.setItem('rg_visits', n),
};

// ─── JOGOS LOCAIS (fallback) ───────────────────────────────────
const LOCAL_GAMES = [
  { id:'3kh0s',         name:'3kh0s Games',       url:'https://3kh0s.github.io/games/index.html',              icon:'🎮', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-11-01' },
  { id:'andrewclark',   name:'AndrewClark Games', url:'https://andrewclark3244.github.io/games/',              icon:'🚀', category:'Ação',       featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'buttertoasty',  name:'ButterToasty Bowl', url:'https://buttertoasty.github.io/Bowl/',                  icon:'🥣', category:'Casual',     featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'gamedump',      name:'Game Dump PC',      url:'https://gamedump.github.io/pc.html',                    icon:'💾', category:'PC',         featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'quiz40',        name:'Quiz 40 Games',     url:'https://quiz-40.github.io/',                            icon:'🧠', category:'Quiz',       featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'gamessite',     name:'Games Site',        url:'https://games-site.github.io/',                         icon:'⭐', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-11-01' },
  { id:'stickmanclimb', name:'Stickman Climb 2',  url:'https://stickmanclimb2.github.io/',                     icon:'🧗', category:'Plataforma', featured:true,  total_clicks:0, added_at:'2025-11-01' },
  { id:'superhot',      name:'SUPERHOT Prototype',url:'https://githubgames.gitlab.io/game/superhot-prototype.html', icon:'🔴', category:'Ação', featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'ucbg',          name:'UCBG Games',        url:'https://ucbg.github.io/',                               icon:'🌐', category:'Geral',      featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'mineeeeeee',    name:'Mineeeeeee',        url:'https://quiz-40.github.io/mineeeeeee/',                 icon:'⛏️', category:'Construção', featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'vortexgames',   name:'Vortex Games',      url:'https://vortexgames07.netlify.app',                     icon:'🌀', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-12-01' },
  { id:'githubgames',   name:'GitHub Games',      url:'https://githubgames.gitlab.io',                         icon:'🐙', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-12-01' },
];

// ─── CONQUISTAS ───────────────────────────────────────────────
const ACHIEVEMENTS_DEF = [
  { id:'welcome',     icon:'👋', trigger:'always',
    title_pt:'Bem-vindo(a)!',           title_en:'Welcome!',
    desc_pt:'Abriu o site.',            desc_en:'Opened the site.' },
  { id:'first_click', icon:'🖱️', trigger:'click',
    title_pt:'Primeiro Clique',         title_en:'First Click',
    desc_pt:'Clicou em um jogo.',       desc_en:'Clicked a game.' },
  { id:'explorer',    icon:'🗺️', trigger:'clicks_5',
    title_pt:'Explorador',              title_en:'Explorer',
    desc_pt:'Clicou em 5 jogos.',       desc_en:'Clicked 5 games.' },
  { id:'collector',   icon:'⭐',  trigger:'favorites_3',
    title_pt:'Colecionador',            title_en:'Collector',
    desc_pt:'3 favoritos.',             desc_en:'3 favorites.' },
  { id:'veteran',     icon:'🥉',  trigger:'visits_5',
    title_pt:'Veterano',                title_en:'Veteran',
    desc_pt:'5 visitas ao site.',       desc_en:'5 site visits.' },
  { id:'night_owl',   icon:'🦉',  trigger:'night',
    title_pt:'Coruja Noturna',          title_en:'Night Owl',
    desc_pt:'Acessou após meia-noite.', desc_en:'Visited after midnight.' },
  { id:'master',      icon:'🏆',  trigger:'all',
    title_pt:'Mestre',                  title_en:'Master',
    desc_pt:'Todas as conquistas.',     desc_en:'All achievements.' },
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
    ach_locked:'Bloqueada', ach_unlocked_lbl:'Desbloqueada', ach_unlock_msg:'🏅 Conquista desbloqueada!',
    lb_empty:'Nenhum jogo jogado ainda.',
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
    loading:'Carregando...',
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
    ach_locked:'Locked', ach_unlocked_lbl:'Unlocked', ach_unlock_msg:'🏅 Achievement unlocked!',
    lb_empty:'No games played yet.',
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
    loading:'Loading...',
  }
};

const t   = (key) => (T[Pref.lang()] || T['pt-br'])[key] || key;
const el  = (id)  => document.getElementById(id);
const qs  = (s, ctx) => (ctx || document).querySelector(s);
const qsa = (s, ctx) => [...(ctx || document).querySelectorAll(s)];
const isNew = (g) => g.added_at && (Date.now() - new Date(g.added_at).getTime()) < 7*24*60*60*1000;

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════
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
    }, 3000);
  });
}

// ══════════════════════════════════════════════════════════════
// TEMA & IDIOMA
// ══════════════════════════════════════════════════════════════
function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
}
function toggleTheme() {
  const next = Pref.theme() === 'dark' ? 'light' : 'dark';
  Pref.saveTheme(next);
  applyTheme(next);
  showToast(next === 'dark' ? t('toast_theme_dark') : t('toast_theme_light'));
}
function translateStatic(lang) {
  const sel = el('lang-select');
  if (sel) sel.value = lang;
  qsa('[data-t]').forEach(node => {
    const val = T[lang]?.[node.getAttribute('data-t')] || node.getAttribute('data-t');
    if (node.tagName === 'INPUT') node.placeholder = val;
    else node.textContent = val;
  });
  const si = el('search-input');
  if (si) si.placeholder = T[lang]?.search_ph || 'Buscar...';
}
function applyLang(lang) {
  Pref.saveLang(lang);
  translateStatic(lang);
  renderFilterChips();
  renderSortButtons();
  renderGames();
  renderAchievements();
  renderNewsSection();
  renderLeaderboard();
  renderAbout();
  updateStats();
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
function renderAuthButton() {
  const wrap = el('auth-container');
  if (!wrap || !_authReady) return;
  wrap.innerHTML = '';

  if (currentUser) {
    const name   = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
    const avatar = currentUser.user_metadata?.avatar_url;
    const pill   = document.createElement('div');
    pill.className = 'user-pill';

    if (avatar) {
      const img = document.createElement('img');
      img.src = avatar; img.className = 'user-avatar'; img.alt = '';
      pill.appendChild(img);
    } else {
      const ini = document.createElement('span');
      ini.className = 'user-initials';
      ini.textContent = name.charAt(0).toUpperCase();
      pill.appendChild(ini);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'user-name';
    nameEl.textContent = name.split(' ')[0];
    pill.appendChild(nameEl);

    const logoutBtn = document.createElement('button');
    logoutBtn.className   = 'nav-btn';
    logoutBtn.title       = t('btn_logout');
    logoutBtn.textContent = '⏏';
    logoutBtn.addEventListener('click', async () => {
      await db.auth.signOut();
      showToast('👋 Até logo!');
    });
    pill.appendChild(logoutBtn);
    wrap.appendChild(pill);
  } else {
    const btn = document.createElement('button');
    btn.className = 'nav-btn btn-login';
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0">' +
        '<path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>' +
      '</svg>' + t('btn_login');
    btn.addEventListener('click', () => {
      db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    });
    wrap.appendChild(btn);
  }
}

// ══════════════════════════════════════════════════════════════
// GAMES — HTML puro, sem addEventListener por card
// ══════════════════════════════════════════════════════════════
function getFilteredGames() {
  let list = allGames.slice();
  if (activeTab === 'fav')    list = list.filter(g => userFavorites.includes(g.id));
  if (activeFilter !== 'all') list = list.filter(g => g.category === activeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(g => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
  }
  if (sortMode === 'clicks')  list.sort((a,b) => (b.total_clicks||0) - (a.total_clicks||0));
  else if (sortMode === 'newest') list.sort((a,b) => new Date(b.added_at||0) - new Date(a.added_at||0));
  else list.sort((a,b) => a.name.localeCompare(b.name));
  return list;
}

function renderGames() {
  const grid  = el('games-grid');
  const badge = qs('.tab-badge', el('tab-fav'));
  if (badge) badge.textContent = userFavorites.length;
  if (!grid) return;

  const games = getFilteredGames();
  if (!games.length) {
    grid.innerHTML =
      '<div class="no-results"><div class="no-icon">🎮</div>' +
      '<p>' + (activeTab === 'fav' ? t('no_fav') : t('no_results')) + '</p></div>';
    return;
  }

  grid.innerHTML = games.map((g, i) => {
    const isFav = userFavorites.includes(g.id);
    return (
      '<div class="game-card" data-id="' + g.id + '" role="listitem" style="animation-delay:' + (i*35) + 'ms">' +
        (g.featured ? '<div class="featured-badge">' + t('featured') + '</div>' : '') +
        (isNew(g) && !g.featured ? '<div class="new-badge">' + t('new_badge') + '</div>' : '') +
        '<div class="game-card-top">' +
          '<div class="game-icon-wrap">' + g.icon + '</div>' +
          '<div class="game-meta">' +
            '<div class="game-name">'     + g.name     + '</div>' +
            '<div class="game-category">' + g.category + '</div>' +
          '</div>' +
          '<button class="fav-btn ' + (isFav ? 'active' : '') + '" data-fav="' + g.id + '" aria-label="Favorito">' +
            (isFav ? '★' : '☆') +
          '</button>' +
        '</div>' +
        '<div class="game-card-footer">' +
          '<span class="click-count">🎮 ' + (g.total_clicks||0) + ' ' + t('click_lbl') + '</span>' +
          '<span class="visit-btn">' + t('visit_btn') + '</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

// Um único listener no grid — captura cliques de todos os cards
function initGamesDelegate() {
  const grid = el('games-grid');

  grid.addEventListener('click', async (e) => {
    // Clique no botão de favorito
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      await handleToggleFavorite(favBtn.dataset.fav, favBtn);
      return;
    }
    // Clique em qualquer outra parte do card
    const card = e.target.closest('[data-id]');
    if (card) {
      const game = allGames.find(g => g.id === card.dataset.id);
      if (game) await handleGameClick(game, card);
    }
  });
}

async function handleGameClick(game, cardEl) {
  // Feedback visual sem re-render
  cardEl.style.opacity = '0.6';
  setTimeout(() => { if (cardEl) cardEl.style.opacity = ''; }, 250);

  try { await db.rpc('increment_game_click', { p_game_id: game.id }); } catch(_) {}
  game.total_clicks = (game.total_clicks || 0) + 1;

  // Atualiza só o contador do card específico
  const countEl = cardEl.querySelector('.click-count');
  if (countEl) countEl.textContent = '🎮 ' + game.total_clicks + ' ' + t('click_lbl');

  const clicked = allGames.filter(g => (g.total_clicks||0) > 0).length;
  await checkAndUnlock('first_click', clicked >= 1);
  await checkAndUnlock('explorer',   clicked >= 5);
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
  if (activeTab === 'fav') renderGames();
  else {
    const badge = qs('.tab-badge', el('tab-fav'));
    if (badge) badge.textContent = userFavorites.length;
  }
}

// ══════════════════════════════════════════════════════════════
// TOOLBAR — chips e sort com delegação
// ══════════════════════════════════════════════════════════════
function renderFilterChips() {
  const wrap = el('filter-chips');
  if (!wrap) return;
  const cats = ['all', ...[...new Set(allGames.map(g => g.category))].sort()];
  wrap.innerHTML = cats.map(cat =>
    '<button class="chip' + (cat === activeFilter ? ' active' : '') + '" data-cat="' + cat + '">' +
      (cat === 'all' ? t('filter_all') : cat) +
    '</button>'
  ).join('');
}

function renderSortButtons() {
  const wrap = el('sort-buttons');
  if (!wrap) return;
  const opts = [
    { key:'name',   label: t('sort_name')   },
    { key:'clicks', label: t('sort_clicks') },
    { key:'newest', label: t('sort_newest') },
  ];
  wrap.innerHTML =
    '<span class="sort-label">' + t('sort_label') + '</span>' +
    opts.map(o =>
      '<button class="sort-btn' + (sortMode === o.key ? ' active' : '') + '" data-sort="' + o.key + '">' +
        o.label +
      '</button>'
    ).join('');
}

function initToolbarDelegates() {
  // Chips
  el('filter-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    activeFilter = chip.dataset.cat;
    qsa('[data-cat]', el('filter-chips')).forEach(c =>
      c.classList.toggle('active', c.dataset.cat === activeFilter)
    );
    renderGames();
  });

  // Sort
  el('sort-buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sort]');
    if (!btn) return;
    sortMode = btn.dataset.sort;
    qsa('[data-sort]', el('sort-buttons')).forEach(b =>
      b.classList.toggle('active', b.dataset.sort === sortMode)
    );
    renderGames();
  });

  // Tabs
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

  // Busca com debounce
  el('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      renderGames();
    }, 180);
  });
}

// ══════════════════════════════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════════════════════════════
function renderLeaderboard() {
  const wrap = el('leaderboard-list');
  if (!wrap) return;
  const top = allGames
    .filter(g => (g.total_clicks||0) > 0)
    .sort((a,b) => (b.total_clicks||0) - (a.total_clicks||0))
    .slice(0, 10);

  if (!top.length) { wrap.innerHTML = '<p class="lb-empty">' + t('lb_empty') + '</p>'; return; }
  const medals = ['🥇','🥈','🥉'];
  wrap.innerHTML = top.map((g, i) =>
    '<div class="lb-row' + (i < 3 ? ' lb-top' : '') + '">' +
      '<span class="lb-rank">'  + (medals[i] || (i+1))    + '</span>' +
      '<span class="lb-icon">'  + g.icon                   + '</span>' +
      '<span class="lb-name">'  + g.name                   + '</span>' +
      '<span class="lb-count">' + (g.total_clicks||0) + ' ' + t('click_lbl') + '</span>' +
    '</div>'
  ).join('');
}

// ══════════════════════════════════════════════════════════════
// CONQUISTAS
// ══════════════════════════════════════════════════════════════
async function checkAndUnlock(id, condition) {
  if (!condition || userAchievements.has(id)) return;
  userAchievements.add(id);
  if (currentUser) {
    try { await db.from('user_achievements').insert({ user_id: currentUser.id, achievement_id: id }); } catch(_) {}
  }
  showToast(t('ach_unlock_msg'), 'success');
  renderAchievements();
  updateProgressBar();
}

async function checkAchievements() {
  const visits  = Pref.visits();
  const clicked = allGames.filter(g => (g.total_clicks||0) > 0).length;
  const nonAll  = ACHIEVEMENTS_DEF.filter(a => a.trigger !== 'all');
  const allDone = nonAll.every(a => userAchievements.has(a.id));
  const h       = new Date().getHours();

  await checkAndUnlock('welcome',     true);
  await checkAndUnlock('first_click', clicked >= 1);
  await checkAndUnlock('explorer',    clicked >= 5);
  await checkAndUnlock('collector',   userFavorites.length >= 3);
  await checkAndUnlock('veteran',     visits >= 5);
  await checkAndUnlock('night_owl',   h < 5);
  await checkAndUnlock('master',      allDone);
}

function renderAchievements() {
  const wrap = el('achievements-grid');
  if (!wrap) return;
  const lang = Pref.lang();
  wrap.innerHTML = ACHIEVEMENTS_DEF.map(ach => {
    const unlocked = userAchievements.has(ach.id);
    const title = lang === 'en' ? ach.title_en : ach.title_pt;
    const desc  = lang === 'en' ? ach.desc_en  : ach.desc_pt;
    const lock  = lang === 'en' ? 'Unlock to reveal.' : 'Desbloqueie para revelar.';
    return (
      '<div class="ach-card' + (unlocked ? ' unlocked' : '') + '">' +
        '<div class="ach-icon-wrap">' + (unlocked ? ach.icon : '🔒') + '</div>' +
        '<div class="ach-info">' +
          '<div class="ach-title">' + title + '</div>' +
          '<div class="ach-desc">'  + (unlocked ? desc : lock) + '</div>' +
        '</div>' +
        '<div class="ach-status">' + (unlocked ? t('ach_unlocked_lbl') : t('ach_locked')) + '</div>' +
      '</div>'
    );
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// NOTÍCIAS
// ══════════════════════════════════════════════════════════════
async function renderNewsSection() {
  const wrap = el('news-grid');
  if (!wrap) return;
  wrap.innerHTML = '<p class="loading-msg">' + t('loading') + '</p>';

  let news = [];
  try {
    const { data } = await db.from('news').select('*')
      .eq('published', true).order('published_at', { ascending: false }).limit(6);
    news = data || [];
  } catch(_) {}

  if (!news.length) {
    news = [{
      tag:'NOVIDADE',
      title_pt:'Novos Jogos!', title_en:'New Games!',
      content_pt:'Vortex Games e GitHub Games adicionados à coleção.',
      content_en:'Vortex Games and GitHub Games added to the collection.',
      published_at: new Date().toISOString()
    }];
  }

  const lang = Pref.lang();
  wrap.innerHTML = news.map(item => {
    const title   = lang === 'en' ? item.title_en   : item.title_pt;
    const content = lang === 'en' ? item.content_en : item.content_pt;
    const date    = new Date(item.published_at).toLocaleDateString(
      lang === 'en' ? 'en-US' : 'pt-BR', { day:'2-digit', month:'short', year:'numeric' }
    );
    return (
      '<div class="news-card">' +
        '<div class="news-tag">'     + item.tag + '</div>' +
        '<div class="news-title">'   + title    + '</div>' +
        '<span class="news-date">'   + date     + '</span>' +
        '<div class="news-content">' + content  + '</div>' +
      '</div>'
    );
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// SOBRE & STATS
// ══════════════════════════════════════════════════════════════
function renderAbout() {
  const p1 = el('about-p1'); if (p1) p1.textContent = t('about_p1');
  const p2 = el('about-p2'); if (p2) p2.textContent = t('about_p2');
}
function updateStats() {
  ['chip-games','stat-games'].forEach(id  => { const e = el(id); if (e) e.textContent = allGames.length; });
  ['chip-favs','stat-favs'].forEach(id    => { const e = el(id); if (e) e.textContent = userFavorites.length; });
  ['chip-visits','stat-visits'].forEach(id => { const e = el(id); if (e) e.textContent = Pref.visits(); });
}
function updateProgressBar() {
  const bar = el('ach-progress-bar');
  const lbl = el('ach-progress-label');
  if (!bar) return;
  const pct = Math.round((userAchievements.size / ACHIEVEMENTS_DEF.length) * 100);
  bar.style.width = pct + '%';
  if (lbl) lbl.textContent = userAchievements.size + '/' + ACHIEVEMENTS_DEF.length;
}

// ══════════════════════════════════════════════════════════════
// MODAL — listeners fixos
// ══════════════════════════════════════════════════════════════
function initModal() {
  const overlay = el('settings-modal');
  el('settings-btn').addEventListener('click', () => overlay.classList.add('open'));
  el('modal-close').addEventListener('click',  () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  el('toggle-theme-btn').addEventListener('click', toggleTheme);
  el('lang-select').addEventListener('change', (e) => applyLang(e.target.value));
  el('reset-ach-btn').addEventListener('click', async () => {
    if (!currentUser) { showToast(t('toast_login_required'), 'warn'); return; }
    try { await db.from('user_achievements').delete().eq('user_id', currentUser.id); } catch(_) {}
    userAchievements.clear();
    renderAchievements();
    updateProgressBar();
    showToast(t('toast_reset_ach'));
  });
  el('clear-data-btn').addEventListener('click', () => {
    localStorage.clear();
    showToast(t('toast_cleared'));
    setTimeout(() => location.reload(), 1200);
  });
}

// ══════════════════════════════════════════════════════════════
// UI EXTRAS — listeners fixos
// ══════════════════════════════════════════════════════════════
function initMobileMenu() {
  const btn  = el('hamburger');
  const menu = el('nav-links');
  btn.addEventListener('click', () => { btn.classList.toggle('open'); menu.classList.toggle('open'); });
  qsa('a', menu).forEach(a => a.addEventListener('click', () => {
    btn.classList.remove('open'); menu.classList.remove('open');
  }));
}
function initBackToTop() {
  const btn = el('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      el('games')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => { const inp = el('search-input'); if (inp) { inp.focus(); inp.select(); } }, 300);
    }
    if (e.key === 'Escape') {
      const modal = el('settings-modal');
      if (modal?.classList.contains('open')) modal.classList.remove('open');
      if (document.activeElement === el('search-input')) el('search-input').blur();
    }
  });
}

// ══════════════════════════════════════════════════════════════
// LOAD USER DATA
// ══════════════════════════════════════════════════════════════
async function loadUserData() {
  if (!currentUser) return;
  try {
    const { data: favs } = await db.from('user_favorites').select('game_id').eq('user_id', currentUser.id);
    userFavorites = (favs || []).map(r => r.game_id);
    const { data: achs } = await db.from('user_achievements').select('achievement_id').eq('user_id', currentUser.id);
    userAchievements = new Set((achs || []).map(r => r.achievement_id));
  } catch(_) {}
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
async function init() {
  // 1. Visual imediato
  applyTheme(Pref.theme());
  translateStatic(Pref.lang());
  Pref.saveVisits(Pref.visits() + 1);

  // 2. Listeners fixos — registrados UMA única vez
  initModal();
  initMobileMenu();
  initBackToTop();
  initKeyboardShortcuts();

  // 3. Verifica sessão antes de qualquer render de auth
  try {
    const { data: { user } } = await db.auth.getUser();
    currentUser = user;
  } catch(_) { currentUser = null; }
  _authReady = true;

  // 4. Auth listener — só reage a eventos reais
  db.auth.onAuthStateChange(async (event, session) => {
    if (!['SIGNED_IN','SIGNED_OUT','USER_UPDATED','TOKEN_REFRESHED'].includes(event)) return;
    const prev = !!currentUser;
    currentUser = session?.user || null;
    if (prev === !!currentUser && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
    renderAuthButton();
    if (currentUser) { await loadUserData(); }
    else { userFavorites = []; userAchievements = new Set(); }
    renderGames();
    renderAchievements();
    updateStats();
    updateProgressBar();
  });

  // 5. Carrega jogos
  try {
    const { data } = await db.from('games_with_clicks').select('*');
    allGames = (data && data.length) ? data : LOCAL_GAMES;
  } catch(_) { allGames = LOCAL_GAMES; }

  // 6. Dados do usuário
  if (currentUser) await loadUserData();

  // 7. Renderiza conteúdo (chips e sort ANTES das delegações)
  renderFilterChips();
  renderSortButtons();
  renderGames();
  renderLeaderboard();
  renderAchievements();
  renderAbout();
  updateStats();
  updateProgressBar();
  renderAuthButton();
  await renderNewsSection();
  await checkAchievements();

  // 8. Delegações dinâmicas — DEPOIS dos containers existirem no DOM
  initGamesDelegate();
  initToolbarDelegates();
}

document.addEventListener('DOMContentLoaded', init);
