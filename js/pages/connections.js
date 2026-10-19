/* CLINT X — Connections page.
   v1 demo: connections are simulated locally. Real OAuth in Phase 2.
   Honest framing: CLINT X never claims an integration it does not have. */
(function(){
  const T = window.TypeX;

  const KEY = 'typex_connections';

  const SERVICES = [
    { id:'facebook',  name:'Facebook',    mode:'assisted', icon:'users',
      desc:'Clint X prepares the action while you confirm/complete it. Platform automation rules are always respected.' },
    { id:'instagram', name:'Instagram',   mode:'assisted', icon:'star',
      desc:'Clint X prepares the action while you confirm/complete it. Platform automation rules are always respected.' },
    { id:'linkedin',  name:'LinkedIn',    mode:'assisted', icon:'users',
      desc:'Clint X prepares the action while you confirm/complete it. Platform automation rules are always respected.' },
    { id:'reddit',    name:'Reddit',      mode:'assisted', icon:'msg',
      desc:'Clint X prepares the action while you confirm/complete it. Platform automation rules are always respected.' },
    { id:'discord',   name:'Discord',     mode:'assisted', icon:'msg',
      desc:'Clint X prepares the action while you confirm/complete it. Platform automation rules are always respected.' },
    { id:'fiverr',    name:'Fiverr',      mode:'assisted', icon:'bolt',
      desc:'Clint X prepares the action while you confirm/complete it. Platform automation rules are always respected.' },
    { id:'upwork',    name:'Upwork',      mode:'assisted', icon:'bolt',
      desc:'Clint X prepares the action while you confirm/complete it. Platform automation rules are always respected.' },
    { id:'gmail',     name:'Gmail',       mode:'connect', icon:'mail',
      desc:'Read and draft within CLINT X (demo). Real OAuth ships in Phase 2.' },
    { id:'gdocs',     name:'Google Docs', mode:'connect', icon:'doc',
      desc:'Read and draft within CLINT X (demo). Real OAuth ships in Phase 2.' },
    { id:'browser',   name:'Web Browser', mode:'connect', icon:'globe',
      desc:'Read and draft within CLINT X (demo). Real browser integration ships in Phase 2.' }
  ];

  const AV_COLORS = ['#A855F7','#FF7A18','#3B82F6','#22C55E','#EAB308','#EC4899',
                     '#14B8A6','#8B5CF6','#F97316','#0EA5E9'];

  function avColor(id){
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
    return AV_COLORS[h % AV_COLORS.length];
  }

  function getState(){ return T.store.get(KEY) || {}; }
  function saveState(s){ T.store.set(KEY, s); }

  let root = null;
  let query = '';

  function matchesQuery(s){
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().indexOf(q) > -1;
  }

  function stepsHtml(){
    const steps = [
      { t:'Connect',  d:'Enable a service in this list. In v1 this is a local demo link — no passwords, no OAuth tokens.' },
      { t:'Prepare',  d:'CLINT X drafts text, messages and replies inside your workflow, respecting that platform\u2019s automation rules.' },
      { t:'Approve',  d:'For platforms that restrict automation, CLINT X works in assisted mode: it prepares the action, you confirm and complete it in the real app.' }
    ];
    return '<div class="card card-pad"><div class="label">How it works in v1</div>' +
      steps.map((s, i) =>
        '<div class="how-step"><div class="how-n">' + (i + 1) + '</div>' +
        '<div><strong>' + T.esc(s.t) + '</strong><p>' + T.esc(s.d) + '</p></div></div>'
      ).join('') + '</div>';
  }

  function searchHtml(){
    return '<div class="field search-field"><input class="input" id="cx-search" ' +
      'placeholder="Search services…" value="' + T.esc(query) + '"></div>';
  }

  function summaryHtml(){
    const st = getState();
    const n = SERVICES.filter(s => st[s.id]).length;
    const assisted = SERVICES.filter(s => st[s.id] && s.mode === 'assisted').length;
    return '<div class="stat-grid">' +
      T.ui.statCard({label:'Services Connected', value: n + ' / ' + SERVICES.length, icon:'plug', accent:'p'}) +
      T.ui.statCard({label:'In Assisted Mode', value: assisted, icon:'shield', accent:'o'}) +
      T.ui.statCard({label:'Data Location', value:'This device', icon:'db', accent:'p'}) +
      '</div>';
  }

  function rulesHtml(){
    const rules = [
      { t:'No bypasses, ever', d:'CLINT X does not bypass CAPTCHAs, rate limits, anti-spam systems, or platform automation rules. Full stop.' },
      { t:'Assisted mode by default', d:'Where a platform restricts automation, CLINT X prepares the action and you confirm and complete it in the real app. Nothing posts, sends, or acts silently.' },
      { t:'Demo data stays local', d:'In v1, every connection is simulated and every value is stored in this browser only. Real OAuth arrives in Phase 2.' }
    ];
    return '<div class="card card-pad"><div class="label">Rules CLINT X respects</div>' +
      rules.map(r =>
        '<div class="how-step"><div class="how-ic">' + T.icon('shield') + '</div>' +
        '<div><strong>' + T.esc(r.t) + '</strong><p>' + T.esc(r.d) + '</p></div></div>'
      ).join('') + '</div>';
  }

  function roadmapHtml(){
    const items = [
      { t:'Real OAuth', d:'Gmail + Google Docs with scoped permissions, connect and revoke anytime.' },
      { t:'Browser context', d:'CLINT X reads the page you are on (with your permission) to draft in place.' },
      { t:'Assisted senders', d:'Prepare in CLINT X, send with one tap where the platform allows it — always approval-gated.' }
    ];
    return '<div class="card card-pad"><div class="label">Coming in Phase 2</div>' +
      '<div class="cards-grid cards-3">' + items.map(i =>
        '<div class="road"><strong>' + T.esc(i.t) + '</strong><p>' + T.esc(i.d) + '</p></div>'
      ).join('') + '</div></div>';
  }

  function faqHtml(){
    const faqs = [
      { q:'Will CLINT X auto-post for me on social platforms?',
        a:'No. Platforms like Facebook, Instagram, and LinkedIn forbid automated posting and cold outreach via third-party automation. CLINT X prepares drafts and messages; you post or send them in the real app.' },
      { q:'Are any credentials stored in v1?',
        a:'No. The v1 demo asks for nothing — no passwords, no tokens. The toggle only marks the service as linked in local state so CLINT X can reference it while drafting.' },
      { q:'When do real connections arrive?',
        a:'Phase 2 brings real OAuth (Gmail, Google Docs, browser integrations) with explicit permissions and revoke-at-any-time controls.' },
      { q:'Can CLINT X read my existing emails or documents in v1?',
        a:'No. In v1 there is no real access to Gmail or Google Docs — the demo only marks the service as linked. Paste text into CLINT X directly and it will draft, rewrite, and organize it there.' },
      { q:'Does connecting a service cost anything?',
        a:'No. All connections in v1 are free, local, and simulated. Nothing is billed and no payment details are ever asked.' }
    ];
    return '<div class="card card-pad"><div class="label">Common questions</div>' +
      faqs.map(f =>
        '<div class="faq"><div class="faq-q">' + T.esc(f.q) + '</div>' +
        '<p>' + T.esc(f.a) + '</p></div>'
      ).join('') + '</div>';
  }

  function cardHtml(s){
    const st = getState();
    const connected = !!st[s.id];
    const letter = T.esc(s.name.charAt(0).toUpperCase());
    const badge = connected
      ? '<span class="badge b-g">Connected</span>'
      : (s.mode === 'assisted'
          ? '<span class="badge b-o">Assisted mode</span>'
          : '<span class="badge b-b">Not connected</span>');
    const action = connected
      ? '<button class="btn btn-danger btn-sm" data-disc="' + s.id + '">Disconnect</button>'
      : (s.mode === 'assisted'
          ? '<button class="btn btn-ai btn-sm" data-conn="' + s.id + '">Use assisted mode</button>'
          : '<button class="btn btn-ai btn-sm" data-conn="' + s.id + '">Connect</button>');
    return '<div class="card card-pad mini-card">' +
      '<div class="mini-head">' +
        '<div class="avatar" style="background:' + avColor(s.id) + '">' + letter + '</div>' +
        '<div><h3>' + T.esc(s.name) + '</h3>' + badge + '</div>' +
      '</div>' +
      '<p class="mini-desc">' + T.esc(s.desc) + '</p>' +
      '<div class="btn-row">' + action +
        '<button class="btn btn-ghost btn-sm" data-settings="' + s.id + '">' +
        T.icon('gear') + '<span>Settings</span></button></div>' +
    '</div>';
  }

  function settingsModal(s){
    const st = getState();
    const connected = !!st[s.id];
    const body = T.el(
      '<div>' +
      '<div class="label">What this does in v1</div>' +
      '<p>' + (connected
        ? T.esc(s.name) + ' is linked in this demo. CLINT X can reference it while drafting and organizing your work — all data stays on this device.'
        : T.esc(s.name) + ' is not linked. When you enable it, CLINT X will work with ' + T.esc(s.name) + ' in a simulated way — drafts and context stay local, and real OAuth connections arrive in Phase 2.') + '</p>' +
      '<div class="label">Limits</div>' +
      '<p>CLINT X never bypasses CAPTCHAs, rate limits, or platform automation rules. ' +
      'Where a platform restricts automation, it works in assisted mode: it prepares the action, you confirm and complete it.</p>' +
      '<div class="label">Data & privacy</div>' +
      '<p>Demo state is stored locally in your browser only. No real credentials are requested or stored in v1.</p>' +
      '</div>'
    );
    T.ui.modal({
      title: s.name + ' — Settings',
      body: body,
      actions: [{ label:'Close', kind:'ghost', close:true }]
    });
  }

  function paint(){
    if (!root) return;
    const sumEl = T.qs('[data-cx="summary"]', root);
    if (sumEl) sumEl.innerHTML = summaryHtml();
    const list = SERVICES.filter(matchesQuery);
    T.qs('[data-cx="grid"]', root).innerHTML =
      list.length ? list.map(cardHtml).join('')
                  : T.ui.emptyState({ icon:'search', title:'No services match',
                                      text:'Try a different search term.' });

    T.qsa('[data-conn]', root).forEach(b =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-conn');
        const st = getState();
        st[id] = true;
        saveState(st);
        paint();
        const svc = SERVICES.find(s => s.id === id);
        T.ui.toast(svc.name + ' enabled (demo).', 'success');
      })
    );

    T.qsa('[data-disc]', root).forEach(b =>
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-disc');
        const svc = SERVICES.find(s => s.id === id);
        const ok = await T.ui.confirm({
          title:'Disconnect ' + svc.name + '?',
          message:'This only clears the demo link on this device. No real credentials are affected.',
          okLabel:'Disconnect', danger:true
        });
        if (!ok) return;
        const st = getState();
        delete st[id];
        saveState(st);
        paint();
        T.ui.toast(svc.name + ' disconnected.', 'info');
      })
    );

    T.qsa('[data-settings]', root).forEach(b =>
      b.addEventListener('click', () => {
        const svc = SERVICES.find(s => s.id === b.getAttribute('data-settings'));
        settingsModal(svc);
      })
    );

    const search = T.qs('#cx-search', root);
    if (search){
      search.addEventListener('input', T.debounce(() => {
        query = search.value;
        const pos = search.selectionStart;
        paint();
        const again = T.qs('#cx-search', root);
        if (again){ again.focus(); again.setSelectionRange(pos, pos); }
      }, 150));
    }
  }

  T.pages['connections'] = {
    title:'Connections',
    render(){
      return T.ui.pageHead('Connections',
        'Link the tools you work in. CLINT X meets you where you type.', null) +
        '<div class="card card-pad">' +
          '<p class="intro-text">v1 demo: connections are simulated locally. Real OAuth connections ship in Phase 2. ' +
          'CLINT X never claims an integration it does not have.</p>' +
        '</div>' +
        stepsHtml() +
        '<div data-cx="summary"></div>' +
        searchHtml() +
        '<div class="cards-grid" data-cx="grid"></div>' +
        rulesHtml() + faqHtml() + roadmapHtml();
    },
    mount(r){
      root = r;
      paint();
    },
    unmount(){ root = null; query = ''; }
  };
})();
