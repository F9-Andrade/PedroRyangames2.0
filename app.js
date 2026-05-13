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
let _delegatesInited = false; // garante que listeners sao registrados apenas uma vez

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

  // 4. Auth listener - SO reage a SIGNED_IN e SIGNED_OUT
  // TOKEN_REFRESHED dispara a cada hora e causava re-render quebrando os cliques
  db.auth.onAuthStateChange(async (event, session) => {
    if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;

    const wasLoggedIn = !!currentUser;
    currentUser = session ? session.user : null;
    const isLoggedIn = !!currentUser;

    if (wasLoggedIn === isLoggedIn) return;

    renderAuthButton();

    if (isLoggedIn) {
      await loadUserData();
    } else {
      userFavorites    = [];
      userAchievements = new Set();
    }

    renderGames();
    renderAchievements();
    updateStats();
    updateProgressBar();
  });

  // 5. Skeleton loading enquanto busca jogos
  renderSkeletons(8);

  // 5b. Carrega jogos
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

  // 8. Delegacoes dinamicas - registradas UMA UNICA VEZ
  if (!_delegatesInited) {
    _delegatesInited = true;
    initGamesDelegate();
    initToolbarDelegates();
    initProfileModal();
    initAdminPanel();
    initExtras();
  }
}

document.addEventListener('DOMContentLoaded', init);

// ══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO ADMIN
// Coloque o email da sua conta Google aqui
// ══════════════════════════════════════════════════════════════
const ADMIN_EMAIL = 'seu-email@gmail.com';

function isAdmin() {
  return currentUser && currentUser.email === ADMIN_EMAIL;
}

// ══════════════════════════════════════════════════════════════
// SKELETON LOADING
// ══════════════════════════════════════════════════════════════
function renderSkeletons(count) {
  const grid = el('games-grid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="sk-top">
        <div class="sk sk-icon"></div>
        <div class="sk-lines">
          <div class="sk sk-line w-70"></div>
          <div class="sk sk-line w-40"></div>
        </div>
      </div>
      <div class="sk sk-foot"></div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════════════════
// PERFIL DO USUÁRIO
// ══════════════════════════════════════════════════════════════
function openProfileModal() {
  if (!currentUser) { showToast(t('toast_login_required'), 'warn'); return; }
  renderProfileContent();
  el('profile-modal').classList.add('open');
}

function renderProfileContent() {
  const wrap = el('profile-content');
  if (!wrap || !currentUser) return;

  const name   = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
  const avatar = currentUser.user_metadata?.avatar_url;
  const lang   = Pref.lang();

  // Avatar
  const avatarHTML = avatar
    ? `<img src="${avatar}" class="profile-avatar-big" alt="avatar"/>`
    : `<div class="profile-avatar-initials">${name.charAt(0).toUpperCase()}</div>`;

  // Conquistas desbloqueadas
  const achHTML = ACHIEVEMENTS_DEF.map(ach => {
    const unlocked = userAchievements.has(ach.id);
    return `<div class="profile-ach-icon ${unlocked ? 'unlocked' : ''}" title="${lang === 'en' ? ach.title_en : ach.title_pt}">
      ${unlocked ? ach.icon : '🔒'}
    </div>`;
  }).join('');

  // Jogos favoritos
  const favGames = allGames.filter(g => userFavorites.includes(g.id));
  const favHTML = favGames.length
    ? favGames.map(g => `
        <a class="profile-fav-row" href="${g.url}" target="_blank" rel="noopener">
          <span style="font-size:1.2rem">${g.icon}</span>
          <span>${g.name}</span>
          <span style="font-size:0.75rem;color:var(--tx-3);margin-left:auto">${g.category}</span>
        </a>`).join('')
    : `<p class="profile-empty">${lang === 'en' ? 'No favorites yet.' : 'Nenhum favorito ainda.'}</p>`;

  wrap.innerHTML = `
    <div class="profile-header">
      ${avatarHTML}
      <div class="profile-info">
        <div class="profile-name">${name.split(' ')[0].toUpperCase()}</div>
        <div class="profile-email">${currentUser.email}</div>
      </div>
    </div>

    <div class="profile-stats">
      <div class="profile-stat">
        <span class="profile-stat-num">${allGames.length}</span>
        <span class="profile-stat-label">${lang === 'en' ? 'Games' : 'Jogos'}</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat-num">${userFavorites.length}</span>
        <span class="profile-stat-label">${lang === 'en' ? 'Favorites' : 'Favoritos'}</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat-num">${userAchievements.size}/${ACHIEVEMENTS_DEF.length}</span>
        <span class="profile-stat-label">${lang === 'en' ? 'Achievements' : 'Conquistas'}</span>
      </div>
    </div>

    <div class="profile-section-title">${lang === 'en' ? 'ACHIEVEMENTS' : 'CONQUISTAS'}</div>
    <div class="profile-ach-grid">${achHTML}</div>

    <div class="profile-section-title">${lang === 'en' ? 'FAVORITES' : 'FAVORITOS'}</div>
    <div class="profile-favs">${favHTML}</div>
  `;
}

function initProfileModal() {
  el('profile-modal-close').addEventListener('click', () => el('profile-modal').classList.remove('open'));
  el('profile-modal').addEventListener('click', (e) => {
    if (e.target === el('profile-modal')) el('profile-modal').classList.remove('open');
  });
}

// ══════════════════════════════════════════════════════════════
// PAINEL ADMIN
// ══════════════════════════════════════════════════════════════
function openAdminPanel() {
  if (!isAdmin()) { showToast('🔒 Acesso restrito.', 'warn'); return; }
  renderAdminPanel();
  el('admin-panel').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
  el('admin-panel').classList.remove('open');
  document.body.style.overflow = '';
}

function renderAdminPanel() {
  const body = el('admin-body');
  if (!body) return;

  // Lista de jogos atual
  const gamesListHTML = allGames.map(g => `
    <div class="admin-game-row" data-id="${g.id}">
      <span class="admin-game-icon">${g.icon}</span>
      <div style="flex:1;min-width:0">
        <div class="admin-game-name">${g.name}</div>
        <div class="admin-game-cat">${g.category}</div>
      </div>
      <button class="admin-toggle ${g.featured ? 'on' : ''}" data-feat="${g.id}" title="Destaque">★</button>
      <button class="admin-del" data-del="${g.id}" title="Remover">✕</button>
    </div>
  `).join('');

  body.innerHTML = `
    <!-- Adicionar jogo -->
    <div class="admin-card">
      <div class="admin-card-title">🎮 Adicionar Jogo</div>
      <div class="admin-form" id="add-game-form">
        <div class="admin-row">
          <div class="admin-field">
            <label class="admin-label">Nome</label>
            <input class="admin-input" id="ag-name" placeholder="Ex: Meu Jogo" />
          </div>
          <div class="admin-field" style="max-width:80px">
            <label class="admin-label">Ícone</label>
            <input class="admin-input" id="ag-icon" placeholder="🎮" />
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">URL</label>
          <input class="admin-input" id="ag-url" placeholder="https://..." type="url" />
        </div>
        <div class="admin-row">
          <div class="admin-field">
            <label class="admin-label">Categoria</label>
            <select class="admin-select" id="ag-cat">
              <option>Geral</option><option>Ação</option><option>Aventura</option>
              <option>Casual</option><option>PC</option><option>Quiz</option>
              <option>Plataforma</option><option>Construção</option><option>Outro</option>
            </select>
          </div>
          <div class="admin-field" style="justify-content:flex-end;padding-top:22px">
            <div class="admin-check-row">
              <input type="checkbox" id="ag-featured" />
              <label for="ag-featured">Em destaque</label>
            </div>
          </div>
        </div>
        <button class="admin-submit" id="ag-submit">+ Adicionar Jogo</button>
        <div id="ag-feedback" style="font-size:0.82rem;color:var(--lime);text-align:center;min-height:20px"></div>
      </div>
    </div>

    <!-- Adicionar notícia -->
    <div class="admin-card">
      <div class="admin-card-title">📰 Adicionar Notícia</div>
      <div class="admin-form" id="add-news-form">
        <div class="admin-row">
          <div class="admin-field">
            <label class="admin-label">Tag</label>
            <select class="admin-select" id="an-tag">
              <option>NOVIDADE</option><option>LANÇAMENTO</option><option>INFO</option><option>ATUALIZAÇÃO</option>
            </select>
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">Título (PT)</label>
          <input class="admin-input" id="an-title-pt" placeholder="Título em português" />
        </div>
        <div class="admin-field">
          <label class="admin-label">Conteúdo (PT)</label>
          <textarea class="admin-textarea" id="an-content-pt" placeholder="Texto da notícia..."></textarea>
        </div>
        <div class="admin-field">
          <label class="admin-label">Título (EN)</label>
          <input class="admin-input" id="an-title-en" placeholder="Title in English" />
        </div>
        <div class="admin-field">
          <label class="admin-label">Conteúdo (EN)</label>
          <textarea class="admin-textarea" id="an-content-en" placeholder="News text..."></textarea>
        </div>
        <button class="admin-submit" id="an-submit">+ Publicar Notícia</button>
        <div id="an-feedback" style="font-size:0.82rem;color:var(--lime);text-align:center;min-height:20px"></div>
      </div>
    </div>

    <!-- Lista de jogos -->
    <div class="admin-card" style="grid-column:1/-1">
      <div class="admin-card-title">📋 Jogos Cadastrados <span style="font-size:1rem;color:var(--tx-3)">(${allGames.length})</span></div>
      <div class="admin-games-list" id="admin-games-list">
        ${gamesListHTML}
      </div>
    </div>
  `;

  // Listener — Adicionar jogo
  el('ag-submit').addEventListener('click', async () => {
    const name     = el('ag-name').value.trim();
    const icon     = el('ag-icon').value.trim() || '🎮';
    const url      = el('ag-url').value.trim();
    const category = el('ag-cat').value;
    const featured = el('ag-featured').checked;
    const fb       = el('ag-feedback');

    if (!name || !url) { fb.textContent = '⚠️ Nome e URL são obrigatórios.'; fb.style.color = 'var(--rose)'; return; }

    el('ag-submit').disabled = true;
    fb.textContent = 'Salvando...'; fb.style.color = 'var(--tx-3)';

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const { error } = await db.from('games').insert({
        slug, name, url, icon, category, featured,
        active: true, added_at: new Date().toISOString()
      });
      if (error) throw error;

      fb.textContent = '✅ Jogo adicionado com sucesso!'; fb.style.color = 'var(--lime)';
      el('ag-name').value = ''; el('ag-url').value = ''; el('ag-icon').value = ''; el('ag-featured').checked = false;

      // Recarrega jogos
      const { data } = await db.from('games_with_clicks').select('*');
      allGames = data || allGames;
      renderGames(); renderLeaderboard(); updateStats();
      renderAdminPanel();
    } catch(err) {
      fb.textContent = '❌ Erro: ' + err.message; fb.style.color = 'var(--rose)';
    }
    el('ag-submit').disabled = false;
  });

  // Listener — Adicionar notícia
  el('an-submit').addEventListener('click', async () => {
    const tag        = el('an-tag').value;
    const title_pt   = el('an-title-pt').value.trim();
    const content_pt = el('an-content-pt').value.trim();
    const title_en   = el('an-title-en').value.trim() || title_pt;
    const content_en = el('an-content-en').value.trim() || content_pt;
    const fb         = el('an-feedback');

    if (!title_pt || !content_pt) { fb.textContent = '⚠️ Título e conteúdo obrigatórios.'; fb.style.color = 'var(--rose)'; return; }

    el('an-submit').disabled = true;
    fb.textContent = 'Publicando...'; fb.style.color = 'var(--tx-3)';

    try {
      const { error } = await db.from('news').insert({
        tag, title_pt, content_pt, title_en, content_en,
        published: true, published_at: new Date().toISOString()
      });
      if (error) throw error;

      fb.textContent = '✅ Notícia publicada!'; fb.style.color = 'var(--lime)';
      el('an-title-pt').value = ''; el('an-content-pt').value = '';
      el('an-title-en').value = ''; el('an-content-en').value = '';
      await renderNewsSection();
    } catch(err) {
      fb.textContent = '❌ Erro: ' + err.message; fb.style.color = 'var(--rose)';
    }
    el('an-submit').disabled = false;
  });

  // Delegação — botões da lista de jogos
  el('admin-games-list').addEventListener('click', async (e) => {
    // Toggle destaque
    const featBtn = e.target.closest('[data-feat]');
    if (featBtn) {
      const gameId = featBtn.dataset.feat;
      const game   = allGames.find(g => g.id === gameId);
      if (!game) return;
      const newVal = !game.featured;
      try {
        await db.from('games').update({ featured: newVal }).eq('id', gameId);
        game.featured = newVal;
        featBtn.classList.toggle('on', newVal);
        showToast(newVal ? '⭐ Marcado como destaque' : '☆ Removido do destaque');
        renderGames();
      } catch(err) { showToast('❌ Erro ao atualizar', 'warn'); }
      return;
    }

    // Deletar jogo
    const delBtn = e.target.closest('[data-del]');
    if (delBtn) {
      const gameId = delBtn.dataset.del;
      const game   = allGames.find(g => g.id === gameId);
      if (!game) return;
      if (!confirm(`Remover "${game.name}"?`)) return;
      try {
        await db.from('games').update({ active: false }).eq('id', gameId);
        allGames = allGames.filter(g => g.id !== gameId);
        delBtn.closest('.admin-game-row').remove();
        renderGames(); renderLeaderboard(); updateStats();
        showToast('🗑️ Jogo removido');
      } catch(err) { showToast('❌ Erro ao remover', 'warn'); }
    }
  });
}

function initAdminPanel() {
  el('admin-btn').addEventListener('click', openAdminPanel);
  el('admin-close-btn').addEventListener('click', closeAdminPanel);
}

// ══════════════════════════════════════════════════════════════
// PATCH: renderAuthButton com botão de perfil clicável
// Sobrescreve a função original
// ══════════════════════════════════════════════════════════════
function renderAuthButton() {
  const wrap = el('auth-container');
  if (!wrap || !_authReady) return;
  wrap.innerHTML = '';

  const adminBtn = el('admin-btn');

  if (currentUser) {
    const name   = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
    const avatar = currentUser.user_metadata?.avatar_url;

    const pill = document.createElement('div');
    pill.className = 'user-pill';
    pill.style.cursor = 'pointer';
    pill.title = 'Ver perfil';

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

    // Clique no nome/avatar → abre perfil
    pill.addEventListener('click', openProfileModal);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'nav-btn';
    logoutBtn.title = t('btn_logout');
    logoutBtn.textContent = '⏏';
    logoutBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await db.auth.signOut();
      showToast('👋 Até logo!');
    });
    pill.appendChild(logoutBtn);
    wrap.appendChild(pill);

    // Mostra botão admin se for o dono
    if (adminBtn) adminBtn.style.display = isAdmin() ? 'flex' : 'none';
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
    if (adminBtn) adminBtn.style.display = 'none';
  }
}

// ══════════════════════════════════════════════════════════════
// JOGO DO DIA
// ══════════════════════════════════════════════════════════════
function getGameOfDay() {
  if (!allGames.length) return null;
  const dayIndex = Math.floor(Date.now() / 86400000) % allGames.length;
  return allGames[dayIndex];
}

function renderGameOfDay() {
  const wrap = el('game-of-day-wrap');
  if (!wrap) return;
  const game = getGameOfDay();
  if (!game) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = `
    <div class="game-of-day" id="god-card">
      <div class="god-badge">🎯 JOGO DO DIA</div>
      <div class="god-icon">${game.icon}</div>
      <div class="god-info">
        <div class="god-label">Destaque de hoje</div>
        <div class="god-name">${game.name}</div>
        <div class="god-cat">${game.category}</div>
      </div>
      <a href="${game.url}" target="_blank" rel="noopener" class="btn btn-lime" style="flex-shrink:0" onclick="addToHistory('${game.id}')">
        Jogar agora →
      </a>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// HISTÓRICO DE JOGOS
// ══════════════════════════════════════════════════════════════
function getHistory() {
  return JSON.parse(localStorage.getItem('rg_history') || '[]');
}

function addToHistory(gameId) {
  let hist = getHistory().filter(id => id !== gameId);
  hist.unshift(gameId);
  hist = hist.slice(0, 6);
  localStorage.setItem('rg_history', JSON.stringify(hist));
  renderHistory();
}

function renderHistory() {
  const wrap = el('history-wrap');
  if (!wrap) return;
  const hist = getHistory();
  const games = hist.map(id => allGames.find(g => g.id === id)).filter(Boolean);
  if (!games.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = `
    <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--tx-3);letter-spacing:.15em;text-transform:uppercase;margin-bottom:8px">
      Jogados recentemente
    </div>
    <div class="history-row">
      ${games.map(g => `
        <a class="history-chip" href="${g.url}" target="_blank" rel="noopener" onclick="addToHistory('${g.id}')">
          <span class="history-chip-icon">${g.icon}</span>
          ${g.name}
        </a>`).join('')}
    </div>`;
}

// ══════════════════════════════════════════════════════════════
// BUSCA GLOBAL (SPOTLIGHT)
// ══════════════════════════════════════════════════════════════
let spotlightIndex = -1;
let spotlightResults = [];

function openSpotlight() {
  el('spotlight-overlay').classList.add('open');
  setTimeout(() => el('spotlight-input').focus(), 50);
  renderSpotlightResults('');
}

function closeSpotlight() {
  el('spotlight-overlay').classList.remove('open');
  el('spotlight-input').value = '';
  spotlightIndex = -1;
}

function renderSpotlightResults(query) {
  const wrap = el('spotlight-results');
  const q = query.toLowerCase().trim();

  spotlightResults = q
    ? allGames.filter(g => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q))
    : allGames.slice(0, 8);

  if (!spotlightResults.length) {
    wrap.innerHTML = `<div class="spotlight-empty">Nenhum jogo encontrado para "${query}"</div>`;
    return;
  }

  const label = q ? 'Resultados' : 'Todos os jogos';
  wrap.innerHTML = `
    <div class="spotlight-section-label">${label}</div>
    ${spotlightResults.map((g, i) => `
      <div class="spotlight-item ${i === spotlightIndex ? 'active' : ''}" data-spot="${g.id}">
        <div class="spotlight-item-icon">${g.icon}</div>
        <div class="spotlight-item-info">
          <div class="spotlight-item-name">${g.name}</div>
          <div class="spotlight-item-cat">${g.category}</div>
        </div>
        <span class="spotlight-item-arrow">→</span>
      </div>`).join('')}`;
}

function initSpotlight() {
  const overlay = el('spotlight-overlay');
  const input   = el('spotlight-input');

  // Click fora fecha
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSpotlight();
  });

  // Delegação nos resultados
  el('spotlight-results').addEventListener('click', (e) => {
    const item = e.target.closest('[data-spot]');
    if (!item) return;
    const game = allGames.find(g => g.id === item.dataset.spot);
    if (game) { addToHistory(game.id); window.open(game.url, '_blank', 'noopener'); closeSpotlight(); }
  });

  // Busca em tempo real
  let spotTimer;
  input.addEventListener('input', (e) => {
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => {
      spotlightIndex = -1;
      renderSpotlightResults(e.target.value);
    }, 120);
  });

  // Navegação por teclado
  input.addEventListener('keydown', (e) => {
    const items = el('spotlight-results').querySelectorAll('.spotlight-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      spotlightIndex = Math.min(spotlightIndex + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle('active', i === spotlightIndex));
      items[spotlightIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      spotlightIndex = Math.max(spotlightIndex - 1, -1);
      items.forEach((it, i) => it.classList.toggle('active', i === spotlightIndex));
    } else if (e.key === 'Enter') {
      const game = spotlightResults[spotlightIndex] || spotlightResults[0];
      if (game) { addToHistory(game.id); window.open(game.url, '_blank', 'noopener'); closeSpotlight(); }
    }
  });
}

// ══════════════════════════════════════════════════════════════
// NOTIFICAÇÕES IN-APP
// ══════════════════════════════════════════════════════════════
function getNotifications() {
  return JSON.parse(localStorage.getItem('rg_notifs') || '[]');
}
function saveNotifications(notifs) {
  localStorage.setItem('rg_notifs', JSON.stringify(notifs));
}
function addNotification(icon, msg) {
  const notifs = getNotifications();
  notifs.unshift({ id: Date.now(), icon, msg, read: false, time: new Date().toISOString() });
  saveNotifications(notifs.slice(0, 20));
  renderNotifications();
}
function renderNotifications() {
  const list  = el('notif-list');
  const badge = el('notif-badge');
  if (!list) return;

  const notifs  = getNotifications();
  const unread  = notifs.filter(n => !n.read).length;
  badge.textContent = unread;
  badge.classList.toggle('show', unread > 0);

  if (!notifs.length) {
    list.innerHTML = '<div class="notif-empty">Nenhuma notificação ainda.</div>';
    return;
  }

  list.innerHTML = notifs.map(n => {
    const time = new Date(n.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="notif-item ${n.read ? '' : 'unread'}" data-notif="${n.id}">
        <span class="notif-item-icon">${n.icon}</span>
        <div class="notif-item-text">
          <div class="notif-item-msg">${n.msg}</div>
          <div class="notif-item-time">${time}</div>
        </div>
      </div>`;
  }).join('');
}

function initNotifications() {
  const btn      = el('notif-btn');
  const dropdown = el('notif-dropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    // Marca todas como lidas ao abrir
    if (dropdown.classList.contains('open')) {
      const notifs = getNotifications().map(n => ({ ...n, read: true }));
      saveNotifications(notifs);
      setTimeout(renderNotifications, 300);
    }
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  el('notif-clear').addEventListener('click', () => {
    saveNotifications([]);
    renderNotifications();
  });

  renderNotifications();
}

// ══════════════════════════════════════════════════════════════
// SISTEMA DE AVALIAÇÃO (ESTRELAS)
// ══════════════════════════════════════════════════════════════
function getUserRating(gameId) {
  const ratings = JSON.parse(localStorage.getItem('rg_ratings') || '{}');
  return ratings[gameId] || 0;
}
function setUserRating(gameId, rating) {
  const ratings = JSON.parse(localStorage.getItem('rg_ratings') || '{}');
  ratings[gameId] = rating;
  localStorage.setItem('rg_ratings', JSON.stringify(ratings));
}

// Injeta estrelas nos cards depois de renderizar
function injectStars() {
  qsa('[data-id]', el('games-grid')).forEach(card => {
    if (card.querySelector('.stars-row')) return; // já tem
    const gameId = card.dataset.id;
    const rating = getUserRating(gameId);
    const starsHTML = `
      <div class="stars-row" data-stars="${gameId}">
        ${[1,2,3,4,5].map(i =>
          `<span class="star ${rating >= i ? 'on' : ''}" data-star="${i}" data-game="${gameId}">★</span>`
        ).join('')}
        <span class="stars-avg">${rating > 0 ? rating + '/5' : 'Avalie'}</span>
      </div>`;
    const footer = card.querySelector('.game-card-footer');
    if (footer) footer.insertAdjacentHTML('beforebegin', starsHTML);
  });
}

// Delegação para estrelas (adicionada ao grid)
function initStarsDelegate() {
  el('games-grid').addEventListener('click', (e) => {
    const star = e.target.closest('[data-star]');
    if (!star) return;
    e.stopPropagation();
    const gameId = star.dataset.game;
    const rating = parseInt(star.dataset.star);
    setUserRating(gameId, rating);

    // Atualiza visual inline
    const starsRow = el('games-grid').querySelector(`[data-stars="${gameId}"]`);
    if (starsRow) {
      starsRow.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < rating));
      const avg = starsRow.querySelector('.stars-avg');
      if (avg) avg.textContent = rating + '/5';
    }
    showToast('⭐ Avaliado com ' + rating + ' estrela' + (rating > 1 ? 's' : '') + '!', 'success');
  });
}

// ══════════════════════════════════════════════════════════════
// COMENTÁRIOS
// ══════════════════════════════════════════════════════════════
let currentCommentsGameId = null;

async function openCommentsModal(gameId) {
  const game = allGames.find(g => g.id === gameId);
  if (!game) return;
  currentCommentsGameId = gameId;
  const title = el('comments-modal-title');
  if (title) title.textContent = `💬 ${game.name}`;
  el('comments-modal').classList.add('open');
  await renderComments(gameId);
}

async function renderComments(gameId) {
  const wrap = el('comments-content');
  if (!wrap) return;
  wrap.innerHTML = '<p style="color:var(--tx-3);font-size:.85rem;padding:16px 0">Carregando...</p>';

  let comments = [];
  try {
    const { data } = await db.from('game_comments')
      .select('*, profiles(username, avatar_url)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(20);
    comments = data || [];
  } catch(_) {}

  const lang = Pref.lang();
  const listHTML = comments.length
    ? comments.map(c => {
        const name   = c.profiles?.username || 'Usuário';
        const avatar = c.profiles?.avatar_url;
        const time   = new Date(c.created_at).toLocaleDateString('pt-BR');
        const avatarEl = avatar
          ? `<img src="${avatar}" class="comment-avatar" alt="" />`
          : `<div class="comment-avatar">${name.charAt(0).toUpperCase()}</div>`;
        return `
          <div class="comment-item">
            <div class="comment-top">
              ${avatarEl}
              <span class="comment-name">${name}</span>
              <span class="comment-time">${time}</span>
            </div>
            <div class="comment-text">${c.text}</div>
          </div>`;
      }).join('')
    : `<p style="color:var(--tx-3);font-size:.85rem;text-align:center;padding:20px 0">
        ${lang === 'en' ? 'No comments yet. Be the first!' : 'Sem comentários ainda. Seja o primeiro!'}
       </p>`;

  const formHTML = currentUser ? `
    <div class="comment-form">
      <textarea class="comment-textarea" id="comment-input" maxlength="280"
        placeholder="${lang === 'en' ? 'Write a comment...' : 'Escreva um comentário...'}"></textarea>
      <div class="comment-count"><span id="comment-char">0</span>/280</div>
      <button class="btn btn-primary" id="comment-submit" style="width:100%">
        ${lang === 'en' ? 'Send comment' : 'Enviar comentário'}
      </button>
    </div>` : `
    <p style="text-align:center;color:var(--tx-3);font-size:.85rem;padding:12px 0">
      ${lang === 'en' ? 'Sign in to comment.' : 'Entre para comentar.'}
    </p>`;

  wrap.innerHTML = `
    <div class="comments-list">${listHTML}</div>
    ${formHTML}`;

  if (currentUser) {
    const input = el('comment-input');
    const charCount = el('comment-char');
    input.addEventListener('input', () => { charCount.textContent = input.value.length; });

    el('comment-submit').addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) return;
      const btn = el('comment-submit');
      btn.disabled = true; btn.textContent = 'Enviando...';
      try {
        await db.from('game_comments').insert({
          game_id: gameId, user_id: currentUser.id, text
        });
        addNotification('💬', `Seu comentário em "${allGames.find(g=>g.id===gameId)?.name}" foi publicado!`);
        await renderComments(gameId);
      } catch(err) {
        showToast('❌ Erro ao enviar: ' + err.message, 'warn');
        btn.disabled = false;
        btn.textContent = lang === 'en' ? 'Send comment' : 'Enviar comentário';
      }
    });
  }
}

function initCommentsModal() {
  el('comments-modal-close').addEventListener('click', () => el('comments-modal').classList.remove('open'));
  el('comments-modal').addEventListener('click', (e) => {
    if (e.target === el('comments-modal')) el('comments-modal').classList.remove('open');
  });
}

// Botão de comentar em cada card — delegação no grid
function initCommentsDelegate() {
  el('games-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-comment]');
    if (!btn) return;
    e.stopPropagation();
    openCommentsModal(btn.dataset.comment);
  });
}

// Injeta botão de comentar nos cards
function injectCommentButtons() {
  qsa('[data-id]', el('games-grid')).forEach(card => {
    if (card.querySelector('[data-comment]')) return;
    const gameId = card.dataset.id;
    const footer = card.querySelector('.game-card-footer');
    if (footer) {
      const btn = document.createElement('button');
      btn.dataset.comment = gameId;
      btn.style.cssText = 'background:transparent;border:none;cursor:pointer;font-size:.8rem;color:var(--tx-3);padding:0 2px;transition:color .2s';
      btn.title = 'Comentar';
      btn.textContent = '💬';
      btn.addEventListener('mouseenter', () => btn.style.color = 'var(--violet-light)');
      btn.addEventListener('mouseleave', () => btn.style.color = 'var(--tx-3)');
      footer.appendChild(btn);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// BOTÃO SECRETO 🐕
// ══════════════════════════════════════════════════════════════
let konami = [];
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown'];

function openSecret() {
  el('secret-overlay').classList.add('open');
}

function initSecret() {
  // Clique no botão invisível
  el('secret-btn').addEventListener('click', openSecret);

  // Fechar overlay
  el('secret-close').addEventListener('click', () => el('secret-overlay').classList.remove('open'));
  el('secret-overlay').addEventListener('click', (e) => {
    if (e.target === el('secret-overlay')) el('secret-overlay').classList.remove('open');
  });

  // Sequência Konami: ↑ ↑ ↓ ↓
  document.addEventListener('keydown', (e) => {
    konami.push(e.key);
    konami = konami.slice(-4);
    if (JSON.stringify(konami) === JSON.stringify(KONAMI)) {
      openSecret();
      konami = [];
    }
  });
}

// ══════════════════════════════════════════════════════════════
// ATALHOS DE TECLADO COMPLETOS
// ══════════════════════════════════════════════════════════════
function initKeyboardShortcutsExtended() {
  const sections = ['games','leaderboard','achievements','news'];

  document.addEventListener('keydown', (e) => {
    // Ignora quando digitando em inputs
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) {
      if (e.key === 'Escape') { e.target.blur(); closeSpotlight(); }
      return;
    }

    // Ctrl+K — busca global
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault(); openSpotlight(); return;
    }

    switch(e.key) {
      case '?': el('shortcuts-modal').classList.add('open'); break;
      case 'Escape':
        // Fecha qualquer modal aberto
        qsa('.modal-overlay.open, .secret-overlay.open').forEach(m => m.classList.remove('open'));
        closeSpotlight();
        el('notif-dropdown').classList.remove('open');
        break;
      case '1': el(sections[0])?.scrollIntoView({ behavior:'smooth' }); break;
      case '2': el(sections[1])?.scrollIntoView({ behavior:'smooth' }); break;
      case '3': el(sections[2])?.scrollIntoView({ behavior:'smooth' }); break;
      case '4': el(sections[3])?.scrollIntoView({ behavior:'smooth' }); break;
      case 't': case 'T': toggleTheme(); break;
      case 'f': case 'F':
        if (activeTab === 'all') {
          activeTab = 'fav';
          el('tab-fav').classList.add('active');
          el('tab-all').classList.remove('active');
        } else {
          activeTab = 'all';
          el('tab-all').classList.add('active');
          el('tab-fav').classList.remove('active');
        }
        renderGames();
        break;
    }
  });

  // Fechar modal de atalhos
  el('shortcuts-modal-close').addEventListener('click', () => el('shortcuts-modal').classList.remove('open'));
  el('shortcuts-modal').addEventListener('click', (e) => {
    if (e.target === el('shortcuts-modal')) el('shortcuts-modal').classList.remove('open');
  });
}

// ══════════════════════════════════════════════════════════════
// PWA
// ══════════════════════════════════════════════════════════════
let pwaPrompt = null;

function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pwaPrompt = e;
    const shown = localStorage.getItem('rg_pwa_dismissed');
    if (!shown) el('pwa-banner').classList.add('show');
  });

  el('pwa-install-btn').addEventListener('click', async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      el('pwa-banner').classList.remove('show');
      addNotification('📱', 'Ryan Games instalado com sucesso!');
    }
    pwaPrompt = null;
  });

  el('pwa-dismiss').addEventListener('click', () => {
    el('pwa-banner').classList.remove('show');
    localStorage.setItem('rg_pwa_dismissed', '1');
  });
}

// ══════════════════════════════════════════════════════════════
// PATCH: handleGameClick — adiciona ao histórico e notifica
// ══════════════════════════════════════════════════════════════
const _origGameClick = handleGameClick;
async function handleGameClick(game, cardEl) {
  addToHistory(game.id);
  await _origGameClick(game, cardEl);
}

// ══════════════════════════════════════════════════════════════
// PATCH: checkAndUnlock — notifica ao desbloquear conquista
// ══════════════════════════════════════════════════════════════
const _origUnlock = checkAndUnlock;
async function checkAndUnlock(id, condition) {
  const was = userAchievements.has(id);
  await _origUnlock(id, condition);
  if (!was && userAchievements.has(id)) {
    const ach = ACHIEVEMENTS_DEF.find(a => a.id === id);
    if (ach) addNotification('🏅', `Conquista desbloqueada: ${Pref.lang() === 'en' ? ach.title_en : ach.title_pt}`);
  }
}

// ══════════════════════════════════════════════════════════════
// PATCH: renderGames — injeta estrelas e botões de comentar
// ══════════════════════════════════════════════════════════════
const _origRenderGames = renderGames;
function renderGames() {
  _origRenderGames();
  requestAnimationFrame(() => {
    injectStars();
    injectCommentButtons();
  });
}

// ══════════════════════════════════════════════════════════════
// INITS EXTRAS (chamados no init principal)
// ══════════════════════════════════════════════════════════════
function initExtras() {
  initSpotlight();
  initNotifications();
  initCommentsModal();
  initCommentsDelegate();
  initStarsDelegate();
  initSecret();
  initKeyboardShortcutsExtended();
  initPWA();
  renderGameOfDay();
  renderHistory();
}
