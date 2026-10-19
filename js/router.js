/* TYPE X — hash router + dashboard shell.
   Pages register via: TypeX.pages['workspace'] = { title, render() -> html, mount(root), unmount() }
   Public pages render without the shell. /app/* requires login.
*/
(function(){
  const T = window.TypeX;
  T.pages = {};

  const NAV = [
    {key:'workspace', label:'New Task', icon:'plus', action:'new'},
    {key:'workspace', label:'Workspace', icon:'workspace'},
    {key:'output', label:'Output', icon:'output'},
    {key:'history', label:'History', icon:'history'},
    {key:'templates', label:'Templates', icon:'template'},
    {key:'styles', label:'Saved Styles', icon:'style'},
    {key:'outreach', label:'Outreach', icon:'send'},
    {key:'connections', label:'Connections', icon:'plug'},
    {key:'automations', label:'Automations', icon:'bolt'},
    {key:'analytics', label:'Analytics', icon:'chart'},
    {key:'settings', label:'Settings', icon:'gear'}
  ];
  const MOBILE_NAV = [
    {key:'workspace', label:'Home', icon:'home'},
    {key:'history', label:'Tasks', icon:'list'},
    {key:'output', label:'Output', icon:'output'},
    {key:'outreach', label:'Outreach', icon:'send'},
    {key:'settings', label:'Settings', icon:'gear'}
  ];
  const PUBLIC = { '':'landing', 'security':'security', 'login':'auth-login', 'signup':'auth-signup' };

  let currentKey = null, currentPage = null;

  function isAuthed(){ return !!T.store.get('user'); }

  function shell(activeKey, pageHtml){
    const user = T.store.get('user') || {name:'Guest'};
    const initials = (user.name||'G').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const seen = {};
    const links = NAV.map(n => {
      if (seen[n.label]) return '';
      seen[n.label] = 1;
      const active = n.label !== 'New Task' && n.key === activeKey ? ' active' : '';
      const href = n.action === 'new' ? '#/app/workspace?new=1' : '#/app/' + n.key;
      return '<a class="side-link' + active + '" href="' + href + '">' + T.icon(n.icon) + '<span>' + n.label + '</span></a>';
    }).join('');
    const mob = MOBILE_NAV.map(n =>
      '<a class="bottom-link' + (n.key===activeKey?' active':'') + '" href="#/app/' + n.key + '">' +
      T.icon(n.icon) + '<span>' + n.label + '</span></a>').join('');
    return '<div class="shell">' +
      '<aside class="sidebar"><a class="brand brand-side" href="#/app/workspace">' + T.brandImg('md') +
      '<span class="brand-cap">AI EXECUTION</span></a>' +
      '<div class="side-label">WORKSPACE</div>' + links +
      '<div class="side-foot">' +
      '<a class="side-link' + (activeKey==='help'?' active':'') + '" href="#/app/help">' + T.icon('help') + '<span>Help</span></a>' +
      '<div class="profile-chip" id="profile-chip"><div class="avatar">' + T.esc(initials) + '</div>' +
      '<div style="min-width:0"><div style="font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
      T.esc(user.name) + '</div><div style="font-size:11.5px;color:var(--muted2)">' + T.esc(user.plan || 'Free plan') + '</div></div></div>' +
      '</div></aside>' +
      '<div class="mobile-topbar"><a href="#/app/workspace" style="display:flex;align-items:center;gap:9px;font-family:var(--disp);font-weight:700">' +
      T.brandImg('sm') + '</a><div class="status-pill" style="padding:5px 11px;font-size:11.5px"><span class="status-dot"></span>Ready</div></div>' +
      '<main class="main"><div class="page" id="page">' + pageHtml + '</div></main>' +
      '<nav class="bottom-nav">' + mob + '</nav></div>';
  }

  function render(){
    let hash = location.hash.replace(/^#\/?/, '');
    const qIndex = hash.indexOf('?');
    const query = {};
    if (qIndex >= 0){
      hash.slice(qIndex+1).split('&').forEach(p => { const kv = p.split('='); query[kv[0]] = decodeURIComponent(kv[1]||''); });
      hash = hash.slice(0, qIndex);
    }
    T.route = {path: hash, query};

    // public routes
    if (PUBLIC.hasOwnProperty(hash)){
      const key = PUBLIC[hash];
      if ((key === 'auth-login' || key === 'auth-signup') && isAuthed()){ location.hash = '#/app/workspace'; return; }
      mountPage(key, false);
      return;
    }
    // app routes
    const m = hash.match(/^app\/([a-z-]+)$/);
    if (m){
      if (!isAuthed()){ location.hash = '#/login'; return; }
      mountPage(m[1], true);
      return;
    }
    location.hash = '#/';
  }

  function mountPage(key, inShell){
    if (currentPage && currentPage.unmount) { try { currentPage.unmount(); } catch(e){} }
    T.agent._targets = [];
    const def = T.pages[key];
    const view = document.getElementById('view');
    if (!def){
      view.innerHTML = shell('workspace', T.ui.emptyState({icon:'alert', title:'Page not found',
        text:'This section does not exist yet.', actionLabel:'Back to Workspace', onAction:null}));
      const b = view.querySelector('[data-empty-action]');
      if (b) b.onclick = () => location.hash = '#/app/workspace';
      currentKey = 'workspace'; currentPage = null;
      return;
    }
    currentKey = key; currentPage = def;
    let html = '';
    try { html = def.render() || ''; } catch(e){ html = '<div class="empty"><h3>Render error</h3></div>'; }
    view.innerHTML = inShell ? shell(key, html) : html;
    document.title = (def.title ? def.title + ' — ' : '') + 'TYPE X';
    const root = document.getElementById('page') || view;
    try { if (def.mount) def.mount(root); } catch(e){ console.error(e); }
    const chip = document.getElementById('profile-chip');
    if (chip) chip.addEventListener('click', () => { location.hash = '#/app/settings'; });
    window.scrollTo(0, 0);
  }

  function navigate(path){ location.hash = '#/' + path.replace(/^\//,''); }

  T.router = { render, navigate, NAV };
  window.addEventListener('hashchange', render);
})();
