/* ============================================================
   RYAN GAMES 3.0 — app.js — VERSÃO FINAL LIMPA
   ============================================================ */

// ─── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL  = 'https://jnnlpwuppxhygwqwthud.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impubmxwd3VwcHhoeWd3cXd0aHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTU4MTAsImV4cCI6MjA4OTk3MTgxMH0.1LOxQ9OHZwenL3MyqM7pYXNoReg6B_A1t9-fqgaDbBw';
const ADMIN_EMAIL   = 'batistapedro855@gmail.com';

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
let _delegatesInited = false;
let friends          = [];
let pendingIn        = [];
let pendingOut       = [];
let channels         = [];
let activeChannelId  = null;
let realtimeSubs     = [];
let typingTimer      = null;
let unreadCounts     = {};
let spotlightIdx     = -1;
let spotlightList    = [];
let konami           = [];

const Pref = {
  lang:       () => localStorage.getItem('rg_lang')  || 'pt-br',
  theme:      () => localStorage.getItem('rg_theme') || 'dark',
  visits:     () => parseInt(localStorage.getItem('rg_visits') || '0'),
  saveLang:   v => localStorage.setItem('rg_lang',  v),
  saveTheme:  v => localStorage.setItem('rg_theme', v),
  saveVisits: n => localStorage.setItem('rg_visits', n),
};

const LOCAL_GAMES = [
  { id:'3kh0s',         name:'3kh0s Games',       url:'https://3kh0s.github.io/games/index.html',                   icon:'🎮', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-11-01' },
  { id:'andrewclark',   name:'AndrewClark Games', url:'https://andrewclark3244.github.io/games/',                   icon:'🚀', category:'Ação',       featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'buttertoasty',  name:'ButterToasty Bowl', url:'https://buttertoasty.github.io/Bowl/',                       icon:'🥣', category:'Casual',     featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'gamedump',      name:'Game Dump PC',      url:'https://gamedump.github.io/pc.html',                         icon:'💾', category:'PC',         featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'quiz40',        name:'Quiz 40 Games',     url:'https://quiz-40.github.io/',                                 icon:'🧠', category:'Quiz',       featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'gamessite',     name:'Games Site',        url:'https://games-site.github.io/',                              icon:'⭐', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-11-01' },
  { id:'stickmanclimb', name:'Stickman Climb 2',  url:'https://stickmanclimb2.github.io/',                          icon:'🧗', category:'Plataforma', featured:true,  total_clicks:0, added_at:'2025-11-01' },
  { id:'superhot',      name:'SUPERHOT Prototype',url:'https://githubgames.gitlab.io/game/superhot-prototype.html', icon:'🔴', category:'Ação',       featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'ucbg',          name:'UCBG Games',        url:'https://ucbg.github.io/',                                    icon:'🌐', category:'Geral',      featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'mineeeeeee',    name:'Mineeeeeee',        url:'https://quiz-40.github.io/mineeeeeee/',                      icon:'⛏️', category:'Construção', featured:false, total_clicks:0, added_at:'2025-11-01' },
  { id:'vortexgames',   name:'Vortex Games',      url:'https://vortexgames07.netlify.app',                          icon:'🌀', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-12-01' },
  { id:'githubgames',   name:'GitHub Games',      url:'https://githubgames.gitlab.io',                              icon:'🐙', category:'Geral',      featured:true,  total_clicks:0, added_at:'2025-12-01' },
];

const ACHIEVEMENTS_DEF = [
  { id:'welcome',     icon:'👋', trigger:'always',      title_pt:'Bem-vindo(a)!',      title_en:'Welcome!',      desc_pt:'Abriu o site.',           desc_en:'Opened the site.' },
  { id:'first_click', icon:'🖱️', trigger:'click',       title_pt:'Primeiro Clique',    title_en:'First Click',   desc_pt:'Clicou em um jogo.',      desc_en:'Clicked a game.' },
  { id:'explorer',    icon:'🗺️', trigger:'clicks_5',    title_pt:'Explorador',         title_en:'Explorer',      desc_pt:'Clicou em 5 jogos.',      desc_en:'Clicked 5 games.' },
  { id:'collector',   icon:'⭐',  trigger:'favorites_3', title_pt:'Colecionador',       title_en:'Collector',     desc_pt:'3 favoritos.',            desc_en:'3 favorites.' },
  { id:'veteran',     icon:'🥉',  trigger:'visits_5',    title_pt:'Veterano',           title_en:'Veteran',       desc_pt:'5 visitas ao site.',      desc_en:'5 site visits.' },
  { id:'night_owl',   icon:'🦉',  trigger:'night',       title_pt:'Coruja Noturna',     title_en:'Night Owl',     desc_pt:'Acessou após meia-noite.',desc_en:'Visited after midnight.' },
  { id:'master',      icon:'🏆',  trigger:'all',         title_pt:'Mestre',             title_en:'Master',        desc_pt:'Todas as conquistas.',    desc_en:'All achievements.' },
];

const T = {
  'pt-br': {
    nav_games:'JOGOS', nav_achievements:'CONQUISTAS', nav_news:'NOVIDADES', nav_leaderboard:'RANKING', nav_about:'SOBRE',
    hero_eyebrow:'// PORTAL DE JOGOS v3.0', hero_title_1:'RYAN', hero_title_2:'GAMES',
    hero_sub:'Sua coleção de jogos favoritos em um só lugar.',
    hero_btn_main:'Ver Jogos', hero_btn_sec:'Ranking',
    section_games:'BIBLIOTECA', title_games:'Jogos', section_ach:'PROGRESSO', title_ach:'Conquistas',
    section_news:'ATUALIZAÇÕES', title_news:'Novidades', section_lb:'COMPETIÇÃO', title_lb:'Ranking de Jogos',
    section_about:'PROJETO', title_about:'Sobre',
    tab_all:'Todos', tab_fav:'Favoritos', search_ph:'Buscar jogo... (Ctrl+K)', filter_all:'Todos',
    sort_label:'Ordenar:', sort_name:'A–Z', sort_clicks:'Mais jogados', sort_newest:'Mais novos',
    click_lbl:'visitas', visit_btn:'Jogar →', featured:'EM DESTAQUE', new_badge:'NOVO',
    no_results:'Nenhum jogo encontrado.', no_fav:'Nenhum favorito ainda.',
    ach_locked:'Bloqueada', ach_unlocked_lbl:'Desbloqueada', ach_unlock_msg:'🏅 Conquista desbloqueada!',
    lb_empty:'Nenhum jogo jogado ainda.',
    about_p1:'O Ryan Games 3.0 é um portal pessoal para reunir os melhores links de jogos, com favoritos, conquistas, ranking e muito mais.',
    about_p2:'Desenvolvido e mantido por Ryan.',
    stat_games:'Jogos', stat_favs:'Favoritos', stat_visits:'Visitas',
    settings_title:'Configurações', cfg_lang:'Idioma', cfg_theme:'Tema', cfg_theme_btn:'Alternar',
    cfg_reset_ach:'Resetar Conquistas', cfg_clear:'Limpar Dados Locais', cfg_reset_btn:'Resetar', cfg_clear_btn:'Limpar',
    btn_login:'Entrar com Google', btn_logout:'Sair',
    toast_theme_dark:'⚫ Modo Escuro', toast_theme_light:'☀️ Modo Claro',
    toast_reset_ach:'🔄 Conquistas resetadas', toast_cleared:'🗑️ Dados apagados',
    toast_fav_add:'⭐ Adicionado aos favoritos', toast_fav_rem:'✕ Removido dos favoritos',
    toast_login_required:'🔒 Entre para usar esta função',
    footer_status:'Online', footer_copy:'© 2025 Ryan Games 3.0 — Todos os direitos reservados',
    loading:'Carregando...',
  },
  'en': {
    nav_games:'GAMES', nav_achievements:'ACHIEVEMENTS', nav_news:'NEWS', nav_leaderboard:'RANKING', nav_about:'ABOUT',
    hero_eyebrow:'// GAMES PORTAL v3.0', hero_title_1:'RYAN', hero_title_2:'GAMES',
    hero_sub:'Your favorite games collection in one place.',
    hero_btn_main:'Browse Games', hero_btn_sec:'Ranking',
    section_games:'LIBRARY', title_games:'Games', section_ach:'PROGRESS', title_ach:'Achievements',
    section_news:'UPDATES', title_news:"What's New", section_lb:'COMPETITION', title_lb:'Game Ranking',
    section_about:'PROJECT', title_about:'About',
    tab_all:'All', tab_fav:'Favorites', search_ph:'Search game... (Ctrl+K)', filter_all:'All',
    sort_label:'Sort:', sort_name:'A–Z', sort_clicks:'Most played', sort_newest:'Newest',
    click_lbl:'visits', visit_btn:'Play →', featured:'FEATURED', new_badge:'NEW',
    no_results:'No games found.', no_fav:'No favorites yet.',
    ach_locked:'Locked', ach_unlocked_lbl:'Unlocked', ach_unlock_msg:'🏅 Achievement unlocked!',
    lb_empty:'No games played yet.',
    about_p1:'Ryan Games 3.0 is a personal portal for your favorite game links, with favorites, achievements, ranking, and more.',
    about_p2:'Developed and maintained by Ryan.',
    stat_games:'Games', stat_favs:'Favorites', stat_visits:'Visits',
    settings_title:'Settings', cfg_lang:'Language', cfg_theme:'Theme', cfg_theme_btn:'Toggle',
    cfg_reset_ach:'Reset Achievements', cfg_clear:'Clear Local Data', cfg_reset_btn:'Reset', cfg_clear_btn:'Clear',
    btn_login:'Sign in with Google', btn_logout:'Sign out',
    toast_theme_dark:'⚫ Dark Mode', toast_theme_light:'☀️ Light Mode',
    toast_reset_ach:'🔄 Achievements reset', toast_cleared:'🗑️ Data cleared',
    toast_fav_add:'⭐ Added to favorites', toast_fav_rem:'✕ Removed from favorites',
    toast_login_required:'🔒 Sign in to use this feature',
    footer_status:'Online', footer_copy:'© 2025 Ryan Games 3.0 — All rights reserved',
    loading:'Loading...',
  }
};

// ─── HELPERS ──────────────────────────────────────────────────
const t   = k  => (T[Pref.lang()]||T['pt-br'])[k] || k;
const el  = id => document.getElementById(id);
const qs  = (s,c) => (c||document).querySelector(s);
const qsa = (s,c) => [...(c||document).querySelectorAll(s)];
const isNew = g => g.added_at && Date.now()-new Date(g.added_at)<7*864e5;
const isAdmin = () => !!(currentUser && currentUser.email === ADMIN_EMAIL);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ─── TOAST ────────────────────────────────────────────────────
function showToast(msg, type) {
  const wrap = el('toast-container'); if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast'+(type?' toast-'+type:'');
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => {
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); t.addEventListener('transitionend', () => t.remove(), {once:true}); }, 3000);
  });
}

// ─── TEMA ─────────────────────────────────────────────────────
function applyTheme(theme) { document.body.classList.toggle('light-mode', theme==='light'); }
function toggleTheme() {
  const next = Pref.theme()==='dark' ? 'light' : 'dark';
  Pref.saveTheme(next); applyTheme(next);
  showToast(next==='dark' ? t('toast_theme_dark') : t('toast_theme_light'));
}

// ─── IDIOMA ───────────────────────────────────────────────────
function translateStatic(lang) {
  const sel = el('lang-select'); if (sel) sel.value = lang;
  qsa('[data-t]').forEach(n => {
    const v = T[lang]?.[n.getAttribute('data-t')] || n.getAttribute('data-t');
    if (n.tagName==='INPUT') n.placeholder=v; else n.textContent=v;
  });
  const si = el('search-input'); if (si) si.placeholder = T[lang]?.search_ph||'Buscar...';
}
function applyLang(lang) {
  Pref.saveLang(lang); translateStatic(lang);
  renderFilterChips(); renderSortButtons(); renderGames();
  renderAchievements(); renderNewsSection(); renderLeaderboard(); renderAbout(); updateStats();
}

// ─── AUTH ─────────────────────────────────────────────────────
function renderAuthButton() {
  const wrap = el('auth-container');
  if (!wrap || !_authReady) return;
  wrap.innerHTML = '';
  const socialBtn = el('social-btn');
  const adminBtn  = el('admin-btn');

  if (currentUser) {
    const name   = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
    const avatar = currentUser.user_metadata?.avatar_url;
    const pill   = document.createElement('div');
    pill.className = 'user-pill'; pill.style.cursor='pointer'; pill.title='Ver perfil';

    if (avatar) {
      const img = document.createElement('img');
      img.src=avatar; img.className='user-avatar'; img.alt='';
      pill.appendChild(img);
    } else {
      const ini = document.createElement('span');
      ini.className='user-initials'; ini.textContent=name.charAt(0).toUpperCase();
      pill.appendChild(ini);
    }

    const nameEl = document.createElement('span');
    nameEl.className='user-name'; nameEl.textContent=name.split(' ')[0];
    pill.appendChild(nameEl);

    const logoutBtn = document.createElement('button');
    logoutBtn.className='nav-btn'; logoutBtn.title=t('btn_logout'); logoutBtn.textContent='⏏';
    logoutBtn.addEventListener('click', async e => { e.stopPropagation(); await db.auth.signOut(); showToast('👋 Até logo!'); });
    pill.appendChild(logoutBtn);
    pill.addEventListener('click', openProfileModal);
    wrap.appendChild(pill);

    if (socialBtn) socialBtn.style.display='flex';
    if (adminBtn)  adminBtn.style.display=isAdmin()?'flex':'none';
  } else {
    const btn = document.createElement('button');
    btn.className='btn-login';
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/></svg>'+t('btn_login');
    btn.addEventListener('click', () => db.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.href}}));
    wrap.appendChild(btn);
    if (socialBtn) socialBtn.style.display='none';
    if (adminBtn)  adminBtn.style.display='none';
  }
}

// ─── GAMES ────────────────────────────────────────────────────
function renderSkeletons(n) {
  const g=el('games-grid'); if(!g) return;
  g.innerHTML=Array.from({length:n},()=>`<div class="skeleton-card"><div class="sk-top"><div class="sk sk-icon"></div><div class="sk-lines"><div class="sk sk-line w-70"></div><div class="sk sk-line w-40"></div></div></div><div class="sk sk-foot"></div></div>`).join('');
}

function getFilteredGames() {
  let list = allGames.slice();
  if (activeTab==='fav')    list=list.filter(g=>userFavorites.includes(g.id));
  if (activeFilter!=='all') list=list.filter(g=>g.category===activeFilter);
  if (searchQuery) { const q=searchQuery.toLowerCase(); list=list.filter(g=>g.name.toLowerCase().includes(q)||g.category.toLowerCase().includes(q)); }
  if (sortMode==='clicks')  list.sort((a,b)=>(b.total_clicks||0)-(a.total_clicks||0));
  else if (sortMode==='newest') list.sort((a,b)=>new Date(b.added_at||0)-new Date(a.added_at||0));
  else list.sort((a,b)=>a.name.localeCompare(b.name));
  return list;
}

function getRating(id) { return (JSON.parse(localStorage.getItem('rg_ratings')||'{}'))[id]||0; }
function setRating(id,r) { const o=JSON.parse(localStorage.getItem('rg_ratings')||'{}'); o[id]=r; localStorage.setItem('rg_ratings',JSON.stringify(o)); }

function renderGames() {
  const grid=el('games-grid');
  const badge=qs('.tab-badge',el('tab-fav'));
  if (badge) badge.textContent=userFavorites.length;
  if (!grid) return;
  const games=getFilteredGames();
  if (!games.length) { grid.innerHTML=`<div class="no-results"><div class="no-icon">🎮</div><p>${activeTab==='fav'?t('no_fav'):t('no_results')}</p></div>`; return; }
  grid.innerHTML=games.map((g,i)=>{
    const fav=userFavorites.includes(g.id);
    const rate=getRating(g.id);
    return `<div class="game-card" data-id="${g.id}" role="listitem" style="animation-delay:${i*35}ms">
      ${g.featured?`<div class="featured-badge">${t('featured')}</div>`:''}
      ${isNew(g)&&!g.featured?`<div class="new-badge">${t('new_badge')}</div>`:''}
      <div class="game-card-top">
        <div class="game-icon-wrap">${g.icon}</div>
        <div class="game-meta"><div class="game-name">${g.name}</div><div class="game-category">${g.category}</div></div>
        <button class="fav-btn${fav?' active':''}" data-fav="${g.id}">${fav?'★':'☆'}</button>
      </div>
      <div class="stars-row" data-stars="${g.id}">
        ${[1,2,3,4,5].map(n=>`<span class="star${rate>=n?' on':''}" data-star="${n}" data-game="${g.id}">★</span>`).join('')}
        <span class="stars-avg">${rate>0?rate+'/5':'Avalie'}</span>
      </div>
      <div class="game-card-footer">
        <span class="click-count">🎮 ${g.total_clicks||0} ${t('click_lbl')}</span>
        <button data-comment="${g.id}" style="background:transparent;border:none;cursor:pointer;font-size:.9rem;color:var(--tx-3);padding:0 4px" title="Comentar">💬</button>
        <span class="visit-btn">${t('visit_btn')}</span>
      </div>
    </div>`;
  }).join('');
}

function initGamesDelegate() {
  const grid=el('games-grid');
  grid.addEventListener('click', async e => {
    const fav=e.target.closest('[data-fav]');        if(fav){e.stopPropagation();await handleToggleFav(fav.dataset.fav,fav);return;}
    const star=e.target.closest('[data-star]');      if(star){e.stopPropagation();handleStar(star);return;}
    const com=e.target.closest('[data-comment]');    if(com){e.stopPropagation();openCommentsModal(com.dataset.comment);return;}
    const card=e.target.closest('[data-id]');        if(card){const g=allGames.find(g=>g.id===card.dataset.id);if(g)await handleGameClick(g,card);}
  });
}

async function handleGameClick(game, card) {
  card.style.opacity='0.6'; setTimeout(()=>{if(card)card.style.opacity='';},250);
  try { await db.rpc('increment_game_click',{p_game_id:game.id}); } catch(_){}
  game.total_clicks=(game.total_clicks||0)+1;
  const ce=card.querySelector('.click-count'); if(ce) ce.textContent=`🎮 ${game.total_clicks} ${t('click_lbl')}`;
  addToHistory(game.id);
  const clicked=allGames.filter(g=>(g.total_clicks||0)>0).length;
  await unlock('first_click',clicked>=1); await unlock('explorer',clicked>=5);
  renderLeaderboard();
  window.open(game.url,'_blank','noopener,noreferrer');
}

async function handleToggleFav(gameId, btn) {
  if(!currentUser){showToast(t('toast_login_required'),'warn');return;}
  const has=userFavorites.includes(gameId);
  if(has){ try{await db.from('user_favorites').delete().eq('user_id',currentUser.id).eq('game_id',gameId);}catch(_){} userFavorites=userFavorites.filter(id=>id!==gameId); btn.classList.remove('active');btn.textContent='☆'; showToast(t('toast_fav_rem')); }
  else   { try{await db.from('user_favorites').insert({user_id:currentUser.id,game_id:gameId});}catch(_){} userFavorites.push(gameId); btn.classList.add('active');btn.textContent='★'; showToast(t('toast_fav_add'),'success'); }
  await unlock('collector',userFavorites.length>=3); updateStats();
  if(activeTab==='fav') renderGames();
  else { const b=qs('.tab-badge',el('tab-fav')); if(b) b.textContent=userFavorites.length; }
}

function handleStar(star) {
  const id=star.dataset.game; const r=parseInt(star.dataset.star);
  setRating(id,r);
  const row=el('games-grid')?.querySelector(`[data-stars="${id}"]`);
  if(row){ row.querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('on',i<r)); const avg=row.querySelector('.stars-avg'); if(avg) avg.textContent=r+'/5'; }
  showToast(`⭐ ${r} estrela${r>1?'s':''}!`,'success');
}

function renderFilterChips() {
  const w=el('filter-chips'); if(!w) return;
  const cats=['all',...[...new Set(allGames.map(g=>g.category))].sort()];
  w.innerHTML=cats.map(c=>`<button class="chip${c===activeFilter?' active':''}" data-cat="${c}">${c==='all'?t('filter_all'):c}</button>`).join('');
}
function renderSortButtons() {
  const w=el('sort-buttons'); if(!w) return;
  w.innerHTML=`<span class="sort-label">${t('sort_label')}</span>`+
    [['name',t('sort_name')],['clicks',t('sort_clicks')],['newest',t('sort_newest')]].map(([k,l])=>`<button class="sort-btn${sortMode===k?' active':''}" data-sort="${k}">${l}</button>`).join('');
}
function initToolbarDelegates() {
  el('filter-chips').addEventListener('click',e=>{ const c=e.target.closest('[data-cat]'); if(!c) return; activeFilter=c.dataset.cat; qsa('[data-cat]',el('filter-chips')).forEach(x=>x.classList.toggle('active',x.dataset.cat===activeFilter)); renderGames(); });
  el('sort-buttons').addEventListener('click',e=>{ const b=e.target.closest('[data-sort]'); if(!b) return; sortMode=b.dataset.sort; qsa('[data-sort]',el('sort-buttons')).forEach(x=>x.classList.toggle('active',x.dataset.sort===sortMode)); renderGames(); });
  el('tab-all').addEventListener('click',()=>{ activeTab='all'; el('tab-all').classList.add('active'); el('tab-fav').classList.remove('active'); renderGames(); });
  el('tab-fav').addEventListener('click',()=>{ activeTab='fav'; el('tab-fav').classList.add('active'); el('tab-all').classList.remove('active'); renderGames(); });
  el('search-input').addEventListener('input',e=>{ clearTimeout(searchTimer); searchTimer=setTimeout(()=>{searchQuery=e.target.value.trim();renderGames();},180); });
}

// ─── LEADERBOARD ──────────────────────────────────────────────
function renderLeaderboard() {
  const w=el('leaderboard-list'); if(!w) return;
  const top=allGames.filter(g=>(g.total_clicks||0)>0).sort((a,b)=>(b.total_clicks||0)-(a.total_clicks||0)).slice(0,10);
  if(!top.length){w.innerHTML=`<p class="lb-empty">${t('lb_empty')}</p>`;return;}
  const m=['🥇','🥈','🥉'];
  w.innerHTML=top.map((g,i)=>`<div class="lb-row${i<3?' lb-top':''}"><span class="lb-rank">${m[i]||(i+1)}</span><span class="lb-icon">${g.icon}</span><span class="lb-name">${g.name}</span><span class="lb-count">${g.total_clicks||0} ${t('click_lbl')}</span></div>`).join('');
}

// ─── CONQUISTAS ───────────────────────────────────────────────
async function unlock(id, condition) {
  if(!condition||userAchievements.has(id)) return;
  userAchievements.add(id);
  if(currentUser){try{await db.from('user_achievements').insert({user_id:currentUser.id,achievement_id:id});}catch(_){}}
  const a=ACHIEVEMENTS_DEF.find(x=>x.id===id);
  showToast(t('ach_unlock_msg'),'success');
  if(a) addNotification('🏅',(Pref.lang()==='en'?a.title_en:a.title_pt)+' desbloqueada!');
  renderAchievements(); updateProgressBar();
}
async function checkAchievements() {
  const clicked=allGames.filter(g=>(g.total_clicks||0)>0).length;
  const nonAll=ACHIEVEMENTS_DEF.filter(a=>a.trigger!=='all');
  await unlock('welcome',true);
  await unlock('first_click',clicked>=1);
  await unlock('explorer',clicked>=5);
  await unlock('collector',userFavorites.length>=3);
  await unlock('veteran',Pref.visits()>=5);
  await unlock('night_owl',new Date().getHours()<5);
  await unlock('master',nonAll.every(a=>userAchievements.has(a.id)));
}
function renderAchievements() {
  const w=el('achievements-grid'); if(!w) return;
  const lang=Pref.lang();
  w.innerHTML=ACHIEVEMENTS_DEF.map(a=>{
    const u=userAchievements.has(a.id);
    return `<div class="ach-card${u?' unlocked':''}"><div class="ach-icon-wrap">${u?a.icon:'🔒'}</div><div class="ach-info"><div class="ach-title">${lang==='en'?a.title_en:a.title_pt}</div><div class="ach-desc">${u?(lang==='en'?a.desc_en:a.desc_pt):(lang==='en'?'Unlock to reveal.':'Desbloqueie para revelar.')}</div></div><div class="ach-status">${u?t('ach_unlocked_lbl'):t('ach_locked')}</div></div>`;
  }).join('');
}

// ─── NOTÍCIAS ─────────────────────────────────────────────────
async function renderNewsSection() {
  const w=el('news-grid'); if(!w) return;
  w.innerHTML=`<p class="loading-msg">${t('loading')}</p>`;
  let news=[];
  try{const{data}=await db.from('news').select('*').eq('published',true).order('published_at',{ascending:false}).limit(6);news=data||[];}catch(_){}
  if(!news.length) news=[{tag:'NOVIDADE',title_pt:'Novos Jogos!',title_en:'New Games!',content_pt:'Vortex Games e GitHub Games adicionados.',content_en:'Vortex Games and GitHub Games added.',published_at:new Date().toISOString()}];
  const lang=Pref.lang();
  w.innerHTML=news.map(n=>{
    const title=lang==='en'?n.title_en:n.title_pt;
    const content=lang==='en'?n.content_en:n.content_pt;
    const date=new Date(n.published_at).toLocaleDateString(lang==='en'?'en-US':'pt-BR',{day:'2-digit',month:'short',year:'numeric'});
    return `<div class="news-card"><div class="news-tag">${n.tag}</div><div class="news-title">${title}</div><span class="news-date">${date}</span><div class="news-content">${content}</div></div>`;
  }).join('');
}

// ─── ABOUT & STATS ────────────────────────────────────────────
function renderAbout() { const p1=el('about-p1');if(p1)p1.textContent=t('about_p1'); const p2=el('about-p2');if(p2)p2.textContent=t('about_p2'); }
function updateStats() {
  ['chip-games','stat-games'].forEach(id=>{const e=el(id);if(e)e.textContent=allGames.length;});
  ['chip-favs','stat-favs'].forEach(id=>{const e=el(id);if(e)e.textContent=userFavorites.length;});
  ['chip-visits','stat-visits'].forEach(id=>{const e=el(id);if(e)e.textContent=Pref.visits();});
}
function updateProgressBar() {
  const bar=el('ach-progress-bar');const lbl=el('ach-progress-label');
  if(!bar) return;
  bar.style.width=Math.round(userAchievements.size/ACHIEVEMENTS_DEF.length*100)+'%';
  if(lbl) lbl.textContent=userAchievements.size+'/'+ACHIEVEMENTS_DEF.length;
}

// ─── MODAL CONFIGURAÇÕES ──────────────────────────────────────
function initModal() {
  const o=el('settings-modal');
  el('settings-btn').addEventListener('click',()=>o.classList.add('open'));
  el('modal-close').addEventListener('click',()=>o.classList.remove('open'));
  o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');});
  el('toggle-theme-btn').addEventListener('click',toggleTheme);
  el('lang-select').addEventListener('change',e=>applyLang(e.target.value));
  el('reset-ach-btn').addEventListener('click',async()=>{
    if(!currentUser){showToast(t('toast_login_required'),'warn');return;}
    try{await db.from('user_achievements').delete().eq('user_id',currentUser.id);}catch(_){}
    userAchievements.clear();renderAchievements();updateProgressBar();showToast(t('toast_reset_ach'));
  });
  el('clear-data-btn').addEventListener('click',()=>{localStorage.clear();showToast(t('toast_cleared'));setTimeout(()=>location.reload(),1200);});
}

// ─── UI ───────────────────────────────────────────────────────
function initMobileMenu() {
  const btn=el('hamburger');const menu=el('nav-links');
  btn.addEventListener('click',()=>{btn.classList.toggle('open');menu.classList.toggle('open');});
  qsa('a',menu).forEach(a=>a.addEventListener('click',()=>{btn.classList.remove('open');menu.classList.remove('open');}));
}
function initBackToTop() {
  const btn=el('back-to-top');if(!btn)return;
  window.addEventListener('scroll',()=>btn.classList.toggle('visible',window.scrollY>400),{passive:true});
  btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}
function initKeyboard() {
  document.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){if(e.key==='Escape'){e.target.blur();closeSpotlight();}return;}
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openSpotlight();return;}
    switch(e.key){
      case '?': el('shortcuts-modal')?.classList.add('open'); break;
      case 'Escape':
        qsa('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
        el('secret-overlay')?.classList.remove('open');
        closeSpotlight();
        el('notif-dropdown')?.classList.remove('open');
        if(el('social-panel')?.classList.contains('open'))closeSocialPanel();
        break;
      case '1': el('games')?.scrollIntoView({behavior:'smooth'}); break;
      case '2': el('leaderboard')?.scrollIntoView({behavior:'smooth'}); break;
      case '3': el('achievements')?.scrollIntoView({behavior:'smooth'}); break;
      case '4': el('news')?.scrollIntoView({behavior:'smooth'}); break;
      case 't': case 'T': toggleTheme(); break;
      case 'f': case 'F':
        if(activeTab==='all'){activeTab='fav';el('tab-fav').classList.add('active');el('tab-all').classList.remove('active');}
        else{activeTab='all';el('tab-all').classList.add('active');el('tab-fav').classList.remove('active');}
        renderGames(); break;
    }
    // Konami: ↑↑↓↓
    konami.push(e.key); konami=konami.slice(-4);
    if(JSON.stringify(konami)===JSON.stringify(['ArrowUp','ArrowUp','ArrowDown','ArrowDown'])){el('secret-overlay')?.classList.add('open');konami=[];}
  });
  el('shortcuts-modal-close')?.addEventListener('click',()=>el('shortcuts-modal').classList.remove('open'));
  el('shortcuts-modal')?.addEventListener('click',e=>{if(e.target===el('shortcuts-modal'))el('shortcuts-modal').classList.remove('open');});
}

// ─── JOGO DO DIA ──────────────────────────────────────────────
function renderGameOfDay() {
  const w=el('game-of-day-wrap');if(!w||!allGames.length)return;
  const g=allGames[Math.floor(Date.now()/86400000)%allGames.length];
  w.innerHTML=`<div class="game-of-day"><div class="god-badge">🎯 JOGO DO DIA</div><div class="god-icon">${g.icon}</div><div class="god-info"><div class="god-label">Destaque de hoje</div><div class="god-name">${g.name}</div><div class="god-cat">${g.category}</div></div><a href="${g.url}" target="_blank" rel="noopener" class="btn btn-lime" style="flex-shrink:0" onclick="addToHistory('${g.id}')">Jogar agora →</a></div>`;
}

// ─── HISTÓRICO ────────────────────────────────────────────────
function getHistory(){return JSON.parse(localStorage.getItem('rg_history')||'[]');}
function addToHistory(id){let h=getHistory().filter(x=>x!==id);h.unshift(id);h=h.slice(0,6);localStorage.setItem('rg_history',JSON.stringify(h));renderHistory();}
function renderHistory(){
  const w=el('history-wrap');if(!w)return;
  const games=getHistory().map(id=>allGames.find(g=>g.id===id)).filter(Boolean);
  if(!games.length){w.innerHTML='';return;}
  w.innerHTML=`<div style="font-family:var(--font-mono);font-size:.65rem;color:var(--tx-3);letter-spacing:.15em;text-transform:uppercase;margin-bottom:8px">Jogados recentemente</div><div class="history-row">${games.map(g=>`<a class="history-chip" href="${g.url}" target="_blank" rel="noopener"><span>${g.icon}</span>${g.name}</a>`).join('')}</div>`;
}

// ─── SPOTLIGHT ────────────────────────────────────────────────
function openSpotlight(){const o=el('spotlight-overlay');if(!o)return;o.classList.add('open');setTimeout(()=>el('spotlight-input')?.focus(),50);renderSpotlight('');}
function closeSpotlight(){el('spotlight-overlay')?.classList.remove('open');const i=el('spotlight-input');if(i)i.value='';spotlightIdx=-1;}
function renderSpotlight(q){
  const w=el('spotlight-results');if(!w)return;
  const query=q.toLowerCase().trim();
  spotlightList=query?allGames.filter(g=>g.name.toLowerCase().includes(query)||g.category.toLowerCase().includes(query)):allGames.slice(0,8);
  if(!spotlightList.length){w.innerHTML=`<div class="spotlight-empty">Nenhum resultado para "${q}"</div>`;return;}
  w.innerHTML=`<div class="spotlight-section-label">${query?'Resultados':'Jogos'}</div>`+
    spotlightList.map((g,i)=>`<div class="spotlight-item${i===spotlightIdx?' active':''}" data-spot="${g.id}"><div class="spotlight-item-icon">${g.icon}</div><div class="spotlight-item-info"><div class="spotlight-item-name">${g.name}</div><div class="spotlight-item-cat">${g.category}</div></div><span>→</span></div>`).join('');
}
function initSpotlight(){
  const o=el('spotlight-overlay');if(!o)return;
  o.addEventListener('click',e=>{if(e.target===o)closeSpotlight();});
  el('spotlight-results').addEventListener('click',e=>{
    const item=e.target.closest('[data-spot]');if(!item)return;
    const g=allGames.find(x=>x.id===item.dataset.spot);
    if(g){addToHistory(g.id);window.open(g.url,'_blank','noopener');closeSpotlight();}
  });
  let st;
  el('spotlight-input').addEventListener('input',e=>{clearTimeout(st);st=setTimeout(()=>{spotlightIdx=-1;renderSpotlight(e.target.value);},120);});
  el('spotlight-input').addEventListener('keydown',e=>{
    const items=el('spotlight-results').querySelectorAll('.spotlight-item');
    if(e.key==='ArrowDown'){e.preventDefault();spotlightIdx=Math.min(spotlightIdx+1,items.length-1);items.forEach((x,i)=>x.classList.toggle('active',i===spotlightIdx));}
    else if(e.key==='ArrowUp'){e.preventDefault();spotlightIdx=Math.max(spotlightIdx-1,-1);items.forEach((x,i)=>x.classList.toggle('active',i===spotlightIdx));}
    else if(e.key==='Enter'){const g=spotlightList[spotlightIdx]||spotlightList[0];if(g){addToHistory(g.id);window.open(g.url,'_blank','noopener');closeSpotlight();}}
  });
}

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────
function getNotifs(){return JSON.parse(localStorage.getItem('rg_notifs')||'[]');}
function saveNotifs(n){localStorage.setItem('rg_notifs',JSON.stringify(n));}
function addNotification(icon,msg){
  const n=getNotifs();n.unshift({id:Date.now(),icon,msg,read:false,time:new Date().toISOString()});
  saveNotifs(n.slice(0,20));renderNotifications();
}
function renderNotifications(){
  const list=el('notif-list');const badge=el('notif-badge');if(!list)return;
  const notifs=getNotifs();const unread=notifs.filter(n=>!n.read).length;
  if(badge){badge.textContent=unread;badge.classList.toggle('show',unread>0);}
  list.innerHTML=notifs.length?notifs.map(n=>{
    const time=new Date(n.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    return `<div class="notif-item${n.read?'':' unread'}"><span class="notif-item-icon">${n.icon}</span><div class="notif-item-text"><div class="notif-item-msg">${n.msg}</div><div class="notif-item-time">${time}</div></div></div>`;
  }).join(''):'<div class="notif-empty">Nenhuma notificação ainda.</div>';
}
function initNotifications(){
  const btn=el('notif-btn');const drop=el('notif-dropdown');if(!btn||!drop)return;
  btn.addEventListener('click',e=>{
    e.stopPropagation();drop.classList.toggle('open');
    if(drop.classList.contains('open')){saveNotifs(getNotifs().map(n=>({...n,read:true})));setTimeout(renderNotifications,300);}
  });
  document.addEventListener('click',e=>{if(!btn.contains(e.target)&&!drop.contains(e.target))drop.classList.remove('open');});
  el('notif-clear').addEventListener('click',()=>{saveNotifs([]);renderNotifications();});
  renderNotifications();
}

// ─── COMENTÁRIOS ──────────────────────────────────────────────
let commentsGameId=null;
function openCommentsModal(gameId){
  const g=allGames.find(x=>x.id===gameId);if(!g)return;
  commentsGameId=gameId;
  const title=el('comments-modal-title');if(title)title.textContent=`💬 ${g.name}`;
  el('comments-modal').classList.add('open');
  loadComments(gameId);
}
async function loadComments(gameId){
  const w=el('comments-content');if(!w)return;
  w.innerHTML=`<p style="color:var(--tx-3);font-size:.85rem;padding:16px 0">Carregando...</p>`;
  let comments=[];
  try{const{data}=await db.from('game_comments').select('*,profiles(username,display_name,avatar_url)').eq('game_id',gameId).order('created_at',{ascending:false}).limit(20);comments=data||[];}catch(_){}
  const lang=Pref.lang();
  const listHTML=comments.length?comments.map(c=>{
    const name=c.profiles?.display_name||c.profiles?.username||'Usuário';
    const av=c.profiles?.avatar_url;
    const avEl=av?`<img src="${av}" class="comment-avatar" alt=""/>`:`<div class="comment-avatar">${name.charAt(0).toUpperCase()}</div>`;
    const time=new Date(c.created_at).toLocaleDateString('pt-BR');
    return `<div class="comment-item"><div class="comment-top">${avEl}<span class="comment-name">${name}</span><span class="comment-time">${time}</span></div><div class="comment-text">${esc(c.text)}</div></div>`;
  }).join(''):`<p style="color:var(--tx-3);font-size:.85rem;text-align:center;padding:20px 0">${lang==='en'?'No comments yet.':'Sem comentários ainda.'}</p>`;
  const formHTML=currentUser?`<div class="comment-form"><textarea class="comment-textarea" id="comment-input" maxlength="280" placeholder="${lang==='en'?'Write a comment...':'Escreva um comentário...'}"></textarea><div class="comment-count"><span id="comment-char">0</span>/280</div><button class="btn btn-primary" id="comment-submit" style="width:100%">${lang==='en'?'Send':'Enviar comentário'}</button></div>`:`<p style="text-align:center;color:var(--tx-3);font-size:.85rem;padding:12px 0">${lang==='en'?'Sign in to comment.':'Entre para comentar.'}</p>`;
  w.innerHTML=`<div class="comments-list">${listHTML}</div>${formHTML}`;
  if(currentUser){
    const inp=el('comment-input');const cc=el('comment-char');
    inp.addEventListener('input',()=>{cc.textContent=inp.value.length;});
    el('comment-submit').addEventListener('click',async()=>{
      const text=inp.value.trim();if(!text)return;
      const sbtn=el('comment-submit');sbtn.disabled=true;sbtn.textContent='...';
      try{await db.from('game_comments').insert({game_id:gameId,user_id:currentUser.id,text});addNotification('💬',`Comentário publicado!`);await loadComments(gameId);}
      catch(e){showToast('❌ '+e.message,'warn');sbtn.disabled=false;sbtn.textContent=lang==='en'?'Send':'Enviar comentário';}
    });
  }
}
function initCommentsModal(){
  el('comments-modal-close').addEventListener('click',()=>el('comments-modal').classList.remove('open'));
  el('comments-modal').addEventListener('click',e=>{if(e.target===el('comments-modal'))el('comments-modal').classList.remove('open');});
}

// ─── BOTÃO SECRETO ────────────────────────────────────────────
function initSecret(){
  el('secret-btn')?.addEventListener('click',()=>el('secret-overlay').classList.add('open'));
  el('secret-close')?.addEventListener('click',()=>el('secret-overlay').classList.remove('open'));
  el('secret-overlay')?.addEventListener('click',e=>{if(e.target===el('secret-overlay'))el('secret-overlay').classList.remove('open');});
}

// ─── PWA ──────────────────────────────────────────────────────
let pwaPrompt=null;
function initPWA(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pwaPrompt=e;if(!localStorage.getItem('rg_pwa_dismissed'))el('pwa-banner')?.classList.add('show');});
  el('pwa-install-btn')?.addEventListener('click',async()=>{if(!pwaPrompt)return;pwaPrompt.prompt();const{outcome}=await pwaPrompt.userChoice;if(outcome==='accepted'){el('pwa-banner')?.classList.remove('show');addNotification('📱','Ryan Games instalado!');}pwaPrompt=null;});
  el('pwa-dismiss')?.addEventListener('click',()=>{el('pwa-banner')?.classList.remove('show');localStorage.setItem('rg_pwa_dismissed','1');});
}

// ─── PERFIL ───────────────────────────────────────────────────
function openProfileModal(){if(!currentUser){showToast(t('toast_login_required'),'warn');return;}renderProfileContent();el('profile-modal').classList.add('open');}
function renderProfileContent(){
  const w=el('profile-content');if(!w||!currentUser)return;
  const name=currentUser.user_metadata?.name||currentUser.email.split('@')[0];
  const avatar=currentUser.user_metadata?.avatar_url;
  const lang=Pref.lang();
  const avHTML=avatar?`<img src="${avatar}" class="profile-avatar-big" alt=""/>`:`<div class="profile-avatar-initials">${name.charAt(0).toUpperCase()}</div>`;
  const achHTML=ACHIEVEMENTS_DEF.map(a=>{const u=userAchievements.has(a.id);return `<div class="profile-ach-icon${u?' unlocked':''}" title="${lang==='en'?a.title_en:a.title_pt}">${u?a.icon:'🔒'}</div>`;}).join('');
  const favGames=allGames.filter(g=>userFavorites.includes(g.id));
  const favHTML=favGames.length?favGames.map(g=>`<a class="profile-fav-row" href="${g.url}" target="_blank" rel="noopener"><span style="font-size:1.2rem">${g.icon}</span><span>${g.name}</span><span style="font-size:.75rem;color:var(--tx-3);margin-left:auto">${g.category}</span></a>`).join(''):`<p class="profile-empty">${lang==='en'?'No favorites yet.':'Nenhum favorito ainda.'}</p>`;
  // Gera ID curto baseado no uuid (primeiros 8 chars em maiúsculo)
  const shortId = currentUser.id.replace(/-/g,'').substring(0,8).toUpperCase();
  w.innerHTML=`<div class="profile-header">${avHTML}<div class="profile-info"><div class="profile-name">${name.split(' ')[0].toUpperCase()}</div><div class="profile-email">${currentUser.email}</div></div></div>
    <div class="profile-id-box">
      <span class="profile-id-label">Seu ID</span>
      <span class="profile-id-value" id="profile-id-val">${shortId}</span>
      <button class="profile-id-copy" onclick="copyUserId('${shortId}')">📋 Copiar</button>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><span class="profile-stat-num">${allGames.length}</span><span class="profile-stat-label">${lang==='en'?'Games':'Jogos'}</span></div>
      <div class="profile-stat"><span class="profile-stat-num">${userFavorites.length}</span><span class="profile-stat-label">${lang==='en'?'Favorites':'Favoritos'}</span></div>
      <div class="profile-stat"><span class="profile-stat-num">${userAchievements.size}/${ACHIEVEMENTS_DEF.length}</span><span class="profile-stat-label">${lang==='en'?'Achievements':'Conquistas'}</span></div>
    </div>
    <div class="profile-section-title">${lang==='en'?'ACHIEVEMENTS':'CONQUISTAS'}</div>
    <div class="profile-ach-grid">${achHTML}</div>
    <div class="profile-section-title">${lang==='en'?'FAVORITES':'FAVORITOS'}</div>
    <div class="profile-favs">${favHTML}</div>`;
}
function initProfileModal(){
  el('profile-modal-close').addEventListener('click',()=>el('profile-modal').classList.remove('open'));
  el('profile-modal').addEventListener('click',e=>{if(e.target===el('profile-modal'))el('profile-modal').classList.remove('open');});
}

// ─── ADMIN ────────────────────────────────────────────────────
function initAdminPanel(){
  el('admin-btn')?.addEventListener('click',()=>{if(!isAdmin()){showToast('🔒 Acesso restrito.','warn');return;}renderAdminPanel();el('admin-panel').classList.add('open');document.body.style.overflow='hidden';});
  el('admin-close-btn')?.addEventListener('click',()=>{el('admin-panel').classList.remove('open');document.body.style.overflow='';});
}
function renderAdminPanel(){
  const body=el('admin-body');if(!body)return;
  body.innerHTML=`
    <div class="admin-card"><div class="admin-card-title">🎮 Adicionar Jogo</div><div class="admin-form">
      <div class="admin-row"><div class="admin-field"><label class="admin-label">Nome</label><input class="admin-input" id="ag-name" placeholder="Nome"/></div><div class="admin-field" style="max-width:80px"><label class="admin-label">Ícone</label><input class="admin-input" id="ag-icon" placeholder="🎮"/></div></div>
      <div class="admin-field"><label class="admin-label">URL</label><input class="admin-input" id="ag-url" type="url" placeholder="https://..."/></div>
      <div class="admin-row"><div class="admin-field"><label class="admin-label">Categoria</label><select class="admin-select" id="ag-cat"><option>Geral</option><option>Ação</option><option>Aventura</option><option>Casual</option><option>PC</option><option>Quiz</option><option>Plataforma</option><option>Construção</option><option>Outro</option></select></div><div class="admin-field" style="justify-content:flex-end;padding-top:22px"><div class="admin-check-row"><input type="checkbox" id="ag-featured"/><label for="ag-featured">Em destaque</label></div></div></div>
      <button class="admin-submit" id="ag-submit">+ Adicionar Jogo</button>
      <div id="ag-feedback" style="font-size:.82rem;text-align:center;min-height:20px"></div>
    </div></div>
    <div class="admin-card"><div class="admin-card-title">📰 Adicionar Notícia</div><div class="admin-form">
      <div class="admin-field"><label class="admin-label">Tag</label><select class="admin-select" id="an-tag"><option>NOVIDADE</option><option>LANÇAMENTO</option><option>INFO</option><option>ATUALIZAÇÃO</option></select></div>
      <div class="admin-field"><label class="admin-label">Título (PT)</label><input class="admin-input" id="an-title-pt" placeholder="Título"/></div>
      <div class="admin-field"><label class="admin-label">Conteúdo (PT)</label><textarea class="admin-textarea" id="an-content-pt"></textarea></div>
      <div class="admin-field"><label class="admin-label">Título (EN)</label><input class="admin-input" id="an-title-en" placeholder="Title"/></div>
      <div class="admin-field"><label class="admin-label">Conteúdo (EN)</label><textarea class="admin-textarea" id="an-content-en"></textarea></div>
      <button class="admin-submit" id="an-submit">+ Publicar Notícia</button>
      <div id="an-feedback" style="font-size:.82rem;text-align:center;min-height:20px"></div>
    </div></div>
    <div class="admin-card" style="grid-column:1/-1"><div class="admin-card-title">📋 Jogos (${allGames.length})</div>
      <div class="admin-games-list" id="admin-games-list">${allGames.map(g=>`<div class="admin-game-row"><span class="admin-game-icon">${g.icon}</span><div style="flex:1;min-width:0"><div class="admin-game-name">${g.name}</div><div class="admin-game-cat">${g.category}</div></div><button class="admin-toggle${g.featured?' on':''}" data-feat="${g.id}">★</button><button class="admin-del" data-del="${g.id}">✕</button></div>`).join('')}
      </div>
    </div>`;
  el('ag-submit').addEventListener('click',async()=>{
    const name=el('ag-name').value.trim();const icon=el('ag-icon').value.trim()||'🎮';const url=el('ag-url').value.trim();const category=el('ag-cat').value;const featured=el('ag-featured').checked;const fb=el('ag-feedback');
    if(!name||!url){fb.textContent='⚠️ Nome e URL obrigatórios.';fb.style.color='var(--rose)';return;}
    el('ag-submit').disabled=true;fb.textContent='Salvando...';fb.style.color='var(--tx-3)';
    try{const slug=name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-');const{error}=await db.from('games').insert({slug,name,url,icon,category,featured,active:true,added_at:new Date().toISOString()});if(error)throw error;fb.textContent='✅ Adicionado!';fb.style.color='var(--lime)';el('ag-name').value='';el('ag-url').value='';el('ag-icon').value='';el('ag-featured').checked=false;const{data}=await db.from('games_with_clicks').select('*');allGames=data||allGames;renderGames();renderLeaderboard();updateStats();renderAdminPanel();}
    catch(e){fb.textContent='❌ '+e.message;fb.style.color='var(--rose)';}
    el('ag-submit').disabled=false;
  });
  el('an-submit').addEventListener('click',async()=>{
    const tag=el('an-tag').value;const tp=el('an-title-pt').value.trim();const cp=el('an-content-pt').value.trim();const te=el('an-title-en').value.trim()||tp;const ce=el('an-content-en').value.trim()||cp;const fb=el('an-feedback');
    if(!tp||!cp){fb.textContent='⚠️ Título e conteúdo obrigatórios.';fb.style.color='var(--rose)';return;}
    el('an-submit').disabled=true;fb.textContent='Publicando...';fb.style.color='var(--tx-3)';
    try{const{error}=await db.from('news').insert({tag,title_pt:tp,content_pt:cp,title_en:te,content_en:ce,published:true,published_at:new Date().toISOString()});if(error)throw error;fb.textContent='✅ Publicado!';fb.style.color='var(--lime)';el('an-title-pt').value='';el('an-content-pt').value='';el('an-title-en').value='';el('an-content-en').value='';await renderNewsSection();}
    catch(e){fb.textContent='❌ '+e.message;fb.style.color='var(--rose)';}
    el('an-submit').disabled=false;
  });
  el('admin-games-list').addEventListener('click',async e=>{
    const fb=e.target.closest('[data-feat]');if(fb){const g=allGames.find(x=>x.id===fb.dataset.feat);if(!g)return;const nv=!g.featured;try{await db.from('games').update({featured:nv}).eq('id',g.id);g.featured=nv;fb.classList.toggle('on',nv);showToast(nv?'⭐ Destaque ativado':'☆ Destaque removido');renderGames();}catch(_){}return;}
    const db2=e.target.closest('[data-del]');if(db2){const g=allGames.find(x=>x.id===db2.dataset.del);if(!g||!confirm(`Remover "${g.name}"?`))return;try{await db.from('games').update({active:false}).eq('id',g.id);allGames=allGames.filter(x=>x.id!==g.id);db2.closest('.admin-game-row').remove();renderGames();renderLeaderboard();updateStats();showToast('🗑️ Removido');}catch(_){}}
  });
}

// ─── SOCIAL: HELPERS ──────────────────────────────────────────
function mkAvatar(user,size=34){
  const name=user?.display_name||user?.username||user?.email?.split('@')[0]||'?';
  const img=user?.avatar_url;
  const s=`width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--violet-subtle);border:2px solid var(--b1);font-size:${Math.round(size*.38)}px;font-weight:700;color:var(--violet-light);`;
  return img?`<div style="${s}"><img src="${img}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></div>`:`<div style="${s}">${name.charAt(0).toUpperCase()}</div>`;
}
function mkDot(status){const c={online:'#4ade80',away:'#a3e635',offline:'var(--tx-3)'}[status]||'var(--tx-3)';return `<span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:${c};border:2px solid var(--bg-card)"></span>`;}
function tStr(iso){return new Date(iso).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}
function dStr(iso){const d=new Date(iso),today=new Date();if(d.toDateString()===today.toDateString())return'Hoje';const y=new Date(today);y.setDate(y.getDate()-1);if(d.toDateString()===y.toDateString())return'Ontem';return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});}

// ─── SOCIAL: PAINEL ───────────────────────────────────────────
function openSocialPanel(){
  if(!currentUser){showToast(t('toast_login_required'),'warn');return;}
  el('social-panel').classList.add('open');
  document.body.style.overflow='hidden';
  loadSocialData();
}
function closeSocialPanel(){el('social-panel').classList.remove('open');document.body.style.overflow='';}
async function updateOnlineStatus(status){try{await db.rpc('update_user_status',{p_status:status});}catch(_){}}
async function loadSocialData(){if(!currentUser)return;await Promise.all([loadFriends(),loadChannels()]);renderFriendsList();renderPendingList();renderChannelsList();updateSocialBadge();subscribeRealtime();updateOnlineStatus('online');}

// ─── SOCIAL: AMIZADES ─────────────────────────────────────────
async function loadFriends(){
  try{
    // Busca todas as amizades do usuário
    const{data:rows, error}=await db
      .from('friendships')
      .select('id, requester, addressee, status')
      .or(`requester.eq.${currentUser.id},addressee.eq.${currentUser.id}`);

    if(error) throw error;
    if(!rows||!rows.length){ friends=[]; pendingIn=[]; pendingOut=[]; return; }

    // Coleta todos os IDs de outros usuários
    const otherIds=[...new Set(rows.map(f=>f.requester===currentUser.id?f.addressee:f.requester))];

    // Busca perfis separadamente
    const{data:profiles}=await db
      .from('profiles')
      .select('id,username,display_name,avatar_url,status')
      .in('id',otherIds);

    const profileMap={};
    (profiles||[]).forEach(p=>{ profileMap[p.id]=p; });

    friends=[]; pendingIn=[]; pendingOut=[];
    rows.forEach(f=>{
      const mine=f.requester===currentUser.id;
      const friendId=mine?f.addressee:f.requester;
      const friend=profileMap[friendId];
      if(!friend) return;
      const entry={id:f.id,friend};
      if(f.status==='accepted') friends.push(entry);
      else if(f.status==='pending'&&!mine) pendingIn.push(entry);
      else if(f.status==='pending'&&mine)  pendingOut.push(entry);
    });
  }catch(e){ console.error('loadFriends:',e); }
}
function renderFriendsList(){
  const list=el('friends-list');const count=el('friends-count');if(!list)return;
  count.textContent=friends.length?`(${friends.length})`:'';
  if(!friends.length){list.innerHTML=`<div style="padding:10px 18px;font-size:.8rem;color:var(--tx-3)">Nenhum amigo ainda.</div>`;return;}
  const sorted=[...friends.filter(f=>f.friend?.status==='online'),...friends.filter(f=>f.friend?.status!=='online')];
  list.innerHTML=sorted.map(f=>{const name=f.friend.display_name||f.friend.username||'Usuário';const status=f.friend.status||'offline';const dot={online:'🟢',away:'🟡',offline:'⚫'}[status]||'⚫';
    return `<div class="social-item"><div style="position:relative;flex-shrink:0">${mkAvatar(f.friend,34)}${mkDot(status)}</div><div class="social-item-info"><div class="social-item-name">${name}</div><div class="social-item-sub">${dot} ${status}</div></div><div class="social-item-actions"><button class="social-action-btn" data-dm="${f.friend.id}" title="Mensagem">💬</button><button class="social-action-btn danger" data-unfriend="${f.id}" title="Remover">✕</button></div></div>`;
  }).join('');
}
function renderPendingList(){
  const list=el('pending-list');const count=el('pending-count');const section=el('pending-section');if(!list)return;
  const total=pendingIn.length+pendingOut.length;count.textContent=total?`(${total})`:'';section.style.display=total?'block':'none';if(!total)return;
  list.innerHTML=[
    ...pendingIn.map(f=>{const name=f.friend.display_name||f.friend.username||'Usuário';return `<div class="social-item">${mkAvatar(f.friend,34)}<div class="social-item-info"><div class="social-item-name">${name}</div><div class="social-item-sub">quer ser seu amigo</div></div><div style="display:flex;gap:4px;flex-shrink:0"><button class="social-action-btn" style="color:var(--lime);border-color:var(--lime)" data-accept="${f.id}">✓</button><button class="social-action-btn danger" data-reject="${f.id}">✕</button></div></div>`;}),
    ...pendingOut.map(f=>{const name=f.friend.display_name||f.friend.username||'Usuário';return `<div class="social-item" style="opacity:.6">${mkAvatar(f.friend,34)}<div class="social-item-info"><div class="social-item-name">${name}</div><div class="social-item-sub">pedido enviado…</div></div><button class="social-action-btn danger" data-cancel="${f.id}">✕</button></div>`;})
  ].join('');
  const badge=el('social-nav-badge');if(badge){badge.textContent=pendingIn.length;badge.classList.toggle('show',pendingIn.length>0);}
}
async function sendFriendRequest(id){try{const{error}=await db.from('friendships').insert({requester:currentUser.id,addressee:id});if(error)throw error;showToast('✅ Pedido enviado!','success');addNotification('👥','Pedido de amizade enviado!');await loadFriends();renderFriendsList();renderPendingList();}catch(e){showToast('❌ '+(e.message.includes('unique')?'Pedido já enviado.':e.message),'warn');}}
async function respondFriendship(id,accept){try{if(accept){await db.from('friendships').update({status:'accepted'}).eq('id',id);showToast('✅ Amizade aceita!','success');}else{await db.from('friendships').delete().eq('id',id);showToast('Pedido recusado.');}await loadFriends();renderFriendsList();renderPendingList();}catch(e){showToast('❌ '+e.message,'warn');}}
async function removeFriend(id){if(!confirm('Remover amigo?'))return;try{await db.from('friendships').delete().eq('id',id);showToast('Amigo removido.');await loadFriends();renderFriendsList();}catch(e){showToast('❌ '+e.message,'warn');}}

async function searchUsers(query){
  if(!query||query.length<2){el('search-results-dropdown').classList.remove('open');return;}
  try{
    const{data}=await db.from('profiles').select('id,username,display_name,avatar_url').ilike('username',`%${query}%`).neq('id',currentUser.id).limit(6);
    const drop=el('search-results-dropdown');
    drop.innerHTML=(data||[]).length?(data||[]).map(u=>{const name=u.display_name||u.username||'Usuário';const isFriend=friends.some(f=>f.friend.id===u.id);const isPending=pendingOut.some(f=>f.friend.id===u.id)||pendingIn.some(f=>f.friend.id===u.id);const dis=isFriend||isPending;
      return `<div class="search-result-item">${mkAvatar(u,32)}<div style="flex:1;min-width:0"><div style="font-size:.85rem;font-weight:600;color:var(--tx-1)">${name}</div><div style="font-family:var(--font-mono);font-size:.65rem;color:var(--tx-3)">@${u.username||'?'}</div></div><button style="font-size:.72rem;padding:4px 10px;border-radius:var(--r-sm);border:1px solid var(--b2);background:transparent;color:var(--violet-light);cursor:pointer;white-space:nowrap;${dis?'opacity:.5;cursor:not-allowed':''}" data-add-friend="${u.id}" ${dis?'disabled':''}>${isFriend?'✓ Amigo':isPending?'⏳':'+ Adicionar'}</button></div>`;
    }).join(''):`<div style="padding:12px 14px;font-size:.82rem;color:var(--tx-3)">Nenhum usuário encontrado.</div>`;
    drop.classList.add('open');
  }catch(e){console.error(e);}
}

// ─── SOCIAL: CANAIS & CHAT ────────────────────────────────────
async function loadChannels(){
  try{const{data:m}=await db.from('channel_members').select('channel_id').eq('user_id',currentUser.id);if(!m?.length){channels=[];return;}const ids=m.map(x=>x.channel_id);const{data}=await db.from('channels').select('*,channel_members(user_id,role,profiles(id,username,display_name,avatar_url,status))').in('id',ids);channels=data||[];}
  catch(e){console.error('loadChannels:',e);}
}
function getChDisp(ch){if(ch.type==='group')return{name:ch.name||'Grupo',icon:ch.icon||'👥',sub:`${ch.channel_members?.length||0} membros`};const other=ch.channel_members?.find(m=>m.user_id!==currentUser.id);const p=other?.profiles;return{name:p?.display_name||p?.username||'Usuário',avatarObj:p,sub:p?.status||'offline'};}
function renderChannelsList(){
  const list=el('channels-list');if(!list)return;
  if(!channels.length){list.innerHTML=`<div style="padding:10px 18px;font-size:.8rem;color:var(--tx-3)">Nenhuma conversa ainda.</div>`;return;}
  list.innerHTML=channels.map(ch=>{const d=getChDisp(ch);const unread=unreadCounts[ch.id]||0;const av=d.avatarObj?`<div style="position:relative;flex-shrink:0">${mkAvatar(d.avatarObj,34)}${mkDot(d.avatarObj?.status)}</div>`:`<div style="width:34px;height:34px;border-radius:50%;background:var(--violet-subtle);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${d.icon||'👥'}</div>`;
    return `<div class="social-item${activeChannelId===ch.id?' active':''}" data-open-channel="${ch.id}">${av}<div class="social-item-info"><div class="social-item-name">${d.name}</div><div class="social-item-sub">${d.sub}</div></div>${unread?`<span class="unread-badge">${unread}</span>`:''}</div>`;
  }).join('');
}
async function openDM(friendUserId){try{const{data,error}=await db.rpc('get_or_create_dm',{other_user_id:friendUserId});if(error)throw error;await loadChannels();renderChannelsList();await openChannel(data);}catch(e){showToast('❌ Erro ao abrir DM: '+e.message,'warn');}}
async function openChannel(channelId){
  activeChannelId=channelId;unreadCounts[channelId]=0;renderChannelsList();
  const ch=channels.find(c=>c.id===channelId);const d=ch?getChDisp(ch):{name:'Chat',sub:''};
  const main=el('social-main');if(!main)return;
  const av=d.avatarObj?`<div style="position:relative">${mkAvatar(d.avatarObj,36)}${mkDot(d.avatarObj?.status)}</div>`:`<div style="width:36px;height:36px;border-radius:50%;background:var(--violet-subtle);display:flex;align-items:center;justify-content:center;font-size:1.2rem">${d.icon||'👥'}</div>`;
  main.innerHTML=`<div class="chat-header">${av}<div class="chat-header-info"><div class="chat-header-name">${d.name}</div><div class="chat-header-sub">${d.sub}</div></div></div><div class="chat-messages" id="chat-messages"></div><div class="typing-indicator" id="typing-indicator"></div><div class="chat-input-area"><div class="chat-input-row"><textarea class="chat-textarea" id="chat-input" placeholder="Mensagem para ${d.name}..." rows="1"></textarea><button class="chat-send-btn" id="chat-send-btn">➤</button></div></div>`;
  await loadMessages(channelId);initChatInput(channelId);subscribeChannel(channelId);
}
async function loadMessages(channelId){
  const w=el('chat-messages');if(!w)return;
  w.innerHTML=`<div style="text-align:center;color:var(--tx-3);font-size:.8rem;padding:20px">Carregando...</div>`;
  try{const{data}=await db.from('messages').select('*,profiles(id,username,display_name,avatar_url)').eq('channel_id',channelId).order('created_at',{ascending:true}).limit(80);renderMessages(data||[]);scrollBottom();}
  catch(_){w.innerHTML=`<div style="text-align:center;color:var(--rose);font-size:.8rem;padding:20px">Erro ao carregar.</div>`;}
}
function renderMessages(msgs){
  const w=el('chat-messages');if(!w)return;
  if(!msgs.length){w.innerHTML=`<div style="text-align:center;color:var(--tx-3);font-size:.82rem;padding:40px 20px">Nenhuma mensagem. Diga olá! 👋</div>`;return;}
  let html='',lastDate='',lastSender='';
  msgs.forEach(msg=>{
    const isOwn=msg.sender_id===currentUser.id;const p=msg.profiles;const name=p?.display_name||p?.username||'Usuário';
    const date=dStr(msg.created_at);const time=tStr(msg.created_at);const consec=lastSender===msg.sender_id&&lastDate===date;
    if(date!==lastDate){html+=`<div class="msg-date-divider">${date}</div>`;lastDate=date;}
    html+=`<div class="msg-group${isOwn?' own':''}"><div style="flex-shrink:0;align-self:flex-end">${!consec?mkAvatar(p||{},32):'<div style="width:32px"></div>'}</div><div class="msg-body">${!consec?`<div class="msg-meta">${!isOwn?`<span class="msg-name">${name}</span>`:''}<span class="msg-time">${time}</span></div>`:''}<div class="msg-bubble${consec?' consecutive':''}">${esc(msg.content)}</div></div></div>`;
    lastSender=msg.sender_id;
  });
  w.innerHTML=html;
}
function scrollBottom(){const w=el('chat-messages');if(w)setTimeout(()=>{w.scrollTop=w.scrollHeight;},50);}
async function sendMessage(channelId,content){if(!content.trim())return;try{await db.from('messages').insert({channel_id:channelId,sender_id:currentUser.id,content:content.trim()});clearTyping(channelId);}catch(e){showToast('❌ Erro ao enviar: '+e.message,'warn');}}
function initChatInput(channelId){
  const inp=el('chat-input');const btn=el('chat-send-btn');if(!inp||!btn)return;
  inp.addEventListener('input',()=>{inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,120)+'px';sendTyping(channelId);});
  inp.addEventListener('keydown',async e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();const c=inp.value;inp.value='';inp.style.height='auto';await sendMessage(channelId,c);}});
  btn.addEventListener('click',async()=>{const c=inp.value;inp.value='';inp.style.height='auto';await sendMessage(channelId,c);});
  inp.focus();
}
async function sendTyping(channelId){clearTimeout(typingTimer);try{await db.from('typing_indicators').upsert({channel_id:channelId,user_id:currentUser.id,updated_at:new Date().toISOString()});typingTimer=setTimeout(()=>clearTyping(channelId),3000);}catch(_){}}
async function clearTyping(channelId){try{await db.from('typing_indicators').delete().eq('channel_id',channelId).eq('user_id',currentUser.id);}catch(_){}}
function renderTyping(channelId,users){const w=el('typing-indicator');if(!w||activeChannelId!==channelId)return;const others=users.filter(u=>u.user_id!==currentUser.id);if(!others.length){w.innerHTML='';return;}w.innerHTML=`<div class="typing-dots"><span></span><span></span><span></span></div><span>${others.map(u=>u.username||'Alguém').join(', ')} está digitando...</span>`;}
function appendMessage(msg){const w=el('chat-messages');if(!w)return;const isOwn=msg.sender_id===currentUser.id;const p=msg.profiles;const name=p?.display_name||p?.username||'Usuário';const time=tStr(msg.created_at);const div=document.createElement('div');div.className=`msg-group${isOwn?' own':''}`;div.innerHTML=`<div style="flex-shrink:0;align-self:flex-end">${mkAvatar(p||{},32)}</div><div class="msg-body"><div class="msg-meta">${!isOwn?`<span class="msg-name">${name}</span>`:''}<span class="msg-time">${time}</span></div><div class="msg-bubble">${esc(msg.content)}</div></div>`;w.appendChild(div);}

// ─── SOCIAL: REALTIME ─────────────────────────────────────────
function subscribeRealtime(){
  realtimeSubs.forEach(s=>s.unsubscribe?.());
  realtimeSubs=[];
  if(!currentUser) return;

  // Sem filtro server-side — filtragem feita no cliente
  // (filtros Realtime podem não funcionar em todos os planos Supabase)
  const s = db.channel('friendships-'+currentUser.id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'friendships'},
      async (payload) => {
        // Só processa se for para este usuário
        if(payload.new.addressee !== currentUser.id) return;
        await loadFriends();
        if(el('social-panel')?.classList.contains('open')) {
          renderFriendsList();
          renderPendingList();
        }
        addNotification('👥', 'Novo pedido de amizade recebido!');
        showToast('👥 Novo pedido de amizade!', 'success');
        updateSocialBadge();
      })
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'friendships'},
      async (payload) => {
        // Só processa se envolver este usuário
        if(payload.new.addressee !== currentUser.id && payload.new.requester !== currentUser.id) return;
        await loadFriends();
        if(el('social-panel')?.classList.contains('open')) {
          renderFriendsList();
          renderPendingList();
        }
        updateSocialBadge();
      })
    .subscribe();

  realtimeSubs.push(s);
}

// Badge no botão social mostrando pedidos pendentes
function updateSocialBadge() {
  const badge = el('social-nav-badge');
  if (!badge) return;
  const count = pendingIn.length;
  badge.textContent = count || '';
  badge.classList.toggle('show', count > 0);
}
function subscribeChannel(channelId){
  // Cancela subs antigas deste canal
  realtimeSubs = realtimeSubs.filter(s => {
    if(s._cid === channelId || s._cid === channelId+'-t'){
      try { s.unsubscribe(); } catch(_) {}
      return false;
    }
    return true;
  });

  // Mensagens em tempo real
  const ms = db
    .channel('room-msg-' + channelId)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'messages'
    }, async payload => {
      if(!payload.new || payload.new.channel_id !== channelId) return;

      if(activeChannelId !== channelId){
        unreadCounts[channelId] = (unreadCounts[channelId]||0) + 1;
        renderChannelsList();
        return;
      }

      let profile = null;
      try {
        const { data: p } = await db
          .from('profiles')
          .select('id,username,display_name,avatar_url')
          .eq('id', payload.new.sender_id)
          .single();
        profile = p;
      } catch(_) {}

      appendMessage({ ...payload.new, profiles: profile });
      scrollBottom();
    })
    .subscribe(status => {
      console.log('[Realtime messages]', status, channelId.substring(0,8));
    });
  ms._cid = channelId;

  // Typing indicator
  const ts = db
    .channel('room-type-' + channelId)
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'typing_indicators'
    }, async payload => {
      const cid = payload.new?.channel_id || payload.old?.channel_id;
      if(cid !== channelId) return;
      let data = [];
      try {
        const { data: td } = await db
          .from('typing_indicators')
          .select('user_id, profiles(username)')
          .eq('channel_id', channelId);
        data = td || [];
      } catch(_) {}
      renderTyping(channelId, data.map(d => ({
        user_id:  d.user_id,
        username: d.profiles?.username
      })));
    })
    .subscribe();
  ts._cid = channelId + '-t';

  realtimeSubs.push(ms, ts);
}

function openCreateGroupModal(){const list=el('member-select-list');if(!list)return;list.innerHTML=friends.length?friends.map(f=>{const name=f.friend.display_name||f.friend.username||'Usuário';return `<div class="member-select-item" data-member="${f.friend.id}">${mkAvatar(f.friend,28)}<span style="font-size:.85rem;font-weight:500;color:var(--tx-1)">${name}</span><span class="member-check">○</span></div>`;}).join(''):`<p style="color:var(--tx-3);font-size:.82rem;text-align:center;padding:12px">Adicione amigos antes de criar um grupo.</p>`;el('create-group-modal').classList.add('open');}
async function createGroup(){
  const name=el('group-name-input').value.trim();const icon=el('group-icon-input').value.trim()||'👥';const sel=[...document.querySelectorAll('.member-select-item.selected')].map(e=>e.dataset.member);const fb=el('create-group-feedback');
  if(!name){fb.textContent='⚠️ Dê um nome ao grupo.';fb.style.color='var(--rose)';return;}if(!sel.length){fb.textContent='⚠️ Selecione pelo menos 1 amigo.';fb.style.color='var(--rose)';return;}
  const btn=el('create-group-submit');btn.disabled=true;fb.textContent='Criando...';fb.style.color='var(--tx-3)';
  try{const{data:ch,error}=await db.from('channels').insert({type:'group',name,icon,owner_id:currentUser.id}).select().single();if(error)throw error;await db.from('channel_members').insert([{channel_id:ch.id,user_id:currentUser.id,role:'owner'},...sel.map(uid=>({channel_id:ch.id,user_id:uid,role:'member'}))]);fb.textContent='✅ Grupo criado!';fb.style.color='var(--lime)';el('group-name-input').value='';el('group-icon-input').value='';await loadChannels();renderChannelsList();setTimeout(()=>{el('create-group-modal').classList.remove('open');openChannel(ch.id);},800);}
  catch(e){fb.textContent='❌ '+e.message;fb.style.color='var(--rose)';btn.disabled=false;}
}

// ─── SOCIAL: INIT ─────────────────────────────────────────────
// ─── COPIAR ID ────────────────────────────────────────────────
function copyUserId(id) {
  navigator.clipboard.writeText(id).then(() => showToast('📋 ID copiado!', 'success')).catch(() => showToast('ID: ' + id));
}

// ─── ADICIONAR AMIGO POR ID CURTO ────────────────────────────
async function addFriendById(shortId) {
  if (!shortId || shortId.length !== 8) { showToast('⚠️ ID deve ter exatamente 8 caracteres.', 'warn'); return; }
  try {
    // Usa a função RPC que criamos no Supabase (find_profile_by_short_id)
    const { data, error } = await db.rpc('find_profile_by_short_id', {
      short_id: shortId.toUpperCase()
    });

    if (error) throw error;

    const match = (data || []).find(u =>
      u.id.replace(/-/g, '').substring(0, 8).toUpperCase() === shortId.toUpperCase()
    );

    if (!match) { showToast('❌ Usuário não encontrado. Verifique o ID.', 'warn'); return; }
    if (match.id === currentUser.id) { showToast('⚠️ Você não pode se adicionar.', 'warn'); return; }

    await sendFriendRequest(match.id);
  } catch(e) { showToast('❌ Erro: ' + e.message, 'warn'); }
}

function initSocial(){
  el('social-btn').addEventListener('click',openSocialPanel);
  el('social-close-btn').addEventListener('click',closeSocialPanel);
  // Adicionar por ID
  el('add-by-id-btn')?.addEventListener('click', () => {
    const input = el('add-by-id-input');
    if (!input) return;
    addFriendById(input.value.trim().toUpperCase());
    input.value = '';
  });
  el('add-by-id-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { addFriendById(e.target.value.trim().toUpperCase()); e.target.value = ''; }
  });

  let sd;el('user-search-input').addEventListener('input',e=>{clearTimeout(sd);sd=setTimeout(()=>searchUsers(e.target.value.trim()),250);});
  document.addEventListener('click',e=>{if(!el('user-search-input')?.contains(e.target))el('search-results-dropdown')?.classList.remove('open');});
  el('search-results-dropdown').addEventListener('click',e=>{const btn=e.target.closest('[data-add-friend]');if(btn){sendFriendRequest(btn.dataset.addFriend);el('search-results-dropdown').classList.remove('open');el('user-search-input').value='';}});
  el('friends-list').addEventListener('click',e=>{const dm=e.target.closest('[data-dm]');const unf=e.target.closest('[data-unfriend]');if(dm)openDM(dm.dataset.dm);if(unf)removeFriend(unf.dataset.unfriend);});
  el('pending-list').addEventListener('click',async e=>{const a=e.target.closest('[data-accept]');const r=e.target.closest('[data-reject]');const c=e.target.closest('[data-cancel]');if(a)await respondFriendship(a.dataset.accept,true);if(r)await respondFriendship(r.dataset.reject,false);if(c)await respondFriendship(c.dataset.cancel,false);});
  el('channels-list').addEventListener('click',e=>{const item=e.target.closest('[data-open-channel]');if(item)openChannel(item.dataset.openChannel);});
  el('create-group-btn').addEventListener('click',openCreateGroupModal);
  el('create-group-modal-close').addEventListener('click',()=>el('create-group-modal').classList.remove('open'));
  el('create-group-modal').addEventListener('click',e=>{if(e.target===el('create-group-modal'))el('create-group-modal').classList.remove('open');});
  el('member-select-list').addEventListener('click',e=>{const item=e.target.closest('.member-select-item');if(!item)return;item.classList.toggle('selected');const chk=item.querySelector('.member-check');if(chk)chk.textContent=item.classList.contains('selected')?'✓':'○';});
  el('create-group-submit').addEventListener('click',createGroup);
  window.addEventListener('beforeunload',()=>updateOnlineStatus('offline'));
}

// ─── CARREGAR DADOS ───────────────────────────────────────────
async function loadUserData(){
  if(!currentUser)return;
  try{const{data:favs}=await db.from('user_favorites').select('game_id').eq('user_id',currentUser.id);userFavorites=(favs||[]).map(r=>r.game_id);const{data:achs}=await db.from('user_achievements').select('achievement_id').eq('user_id',currentUser.id);userAchievements=new Set((achs||[]).map(r=>r.achievement_id));}catch(_){}
}

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  applyTheme(Pref.theme());
  translateStatic(Pref.lang());
  Pref.saveVisits(Pref.visits() + 1);

  // Todos os listeners fixos — UMA única vez
  initModal();
  initMobileMenu();
  initBackToTop();
  initKeyboard();
  initNotifications();
  initSpotlight();
  initPWA();
  initSecret();

  // Sessão
  try { const {data:{user}} = await db.auth.getUser(); currentUser = user; } catch(_) { currentUser = null; }
  _authReady = true;

  // Auth listener
  db.auth.onAuthStateChange(async (event, session) => {
    if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
    const was = !!currentUser; currentUser = session?.user || null;
    if (was === !!currentUser) return;
    renderAuthButton();
    if (currentUser) {
      await loadUserData();
      // Inicia realtime de amizades assim que loga — não precisa abrir o painel
      await loadFriends();
      updateSocialBadge();
      subscribeRealtime();
    } else {
      userFavorites=[]; userAchievements=new Set();
      realtimeSubs.forEach(s=>s.unsubscribe?.());
      realtimeSubs=[];
    }
    renderGames(); renderAchievements(); updateStats(); updateProgressBar();
  });

  // Skeleton + jogos (5s timeout)
  renderSkeletons(8);
  try {
    const timeout = new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 5000));
    const {data} = await Promise.race([db.from('games_with_clicks').select('*'), timeout]);
    allGames = (data && data.length) ? data : LOCAL_GAMES;
  } catch(_) { allGames = LOCAL_GAMES; }

  if (currentUser) await loadUserData();

  // Renderiza
  renderAuthButton();
  renderFilterChips();
  renderSortButtons();
  renderGameOfDay();
  renderHistory();
  renderGames();
  renderLeaderboard();
  renderAchievements();
  renderAbout();
  updateStats();
  updateProgressBar();
  await renderNewsSection();
  await checkAchievements();

  // Delegações dinâmicas — UMA única vez
  if (!_delegatesInited) {
    _delegatesInited = true;
    initGamesDelegate();
    initToolbarDelegates();
    initProfileModal();
    initAdminPanel();
    initCommentsModal();
    if (currentUser) initSocial();
  }
}

document.addEventListener('DOMContentLoaded', init);
