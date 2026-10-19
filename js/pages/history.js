/* CLINT X — History page: everything CLINT X has done for you. */
(function(){
  const T = window.TypeX;

  const F = { q: '', status: 'All' }; // filter state

  function statusBadge(status){
    const s = status || 'Completed';
    const cls = s === 'Completed' ? 'b-g' : s === 'Approved' ? 'b-b' : s === 'Typed' ? 'b-p' : 'b-o';
    return '<span class="badge ' + cls + '">' + T.esc(s) + '</span>';
  }

  function filtered(){
    const list = T.store.get('history', []);
    return list
      .filter(e => e)
      .filter(e => F.status === 'All' || (e.status || 'Completed') === F.status)
      .filter(e => {
        if (!F.q) return true;
        const hay = ((e.name || '') + ' ' + (e.input || '') + ' ' + (e.output || '')).toLowerCase();
        return hay.indexOf(F.q) >= 0;
      })
      .sort((a,b) => (b.date || 0) - (a.date || 0));
  }

  function snippet(s, n){
    s = String(s || '');
    return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
  }

  function cardHTML(e){
    return '<div class="mini-card" data-id="' + T.esc(e.id) + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
        '<h3 style="margin:0">' + T.esc(e.name || 'Untitled task') + '</h3>' +
        statusBadge(e.status) +
      '</div>' +
      '<div class="row" style="margin:8px 0">' +
        '<span class="chip">' + T.icon('clock', 'ic-sm') + ' ' + T.esc(T.timeAgo(e.date || Date.now())) + '</span>' +
        (e.action ? '<span class="chip">' + T.esc(e.action) + '</span>' : '') +
        (e.platform ? '<span class="chip">' + T.esc(e.platform) + '</span>' : '') +
        (e.output ? '<span class="chip">' + T.words(e.output) + ' words</span>' : '') +
      '</div>' +
      '<div class="label">Input</div>' +
      '<p>' + T.esc(snippet(e.input, 120) || '—') + '</p>' +
      (e.output
        ? '<div class="label">Output</div><p>' + T.esc(snippet(e.output, 200)) + '</p>'
        : '<p style="color:var(--muted2);font-size:13px">No output saved for this task.</p>') +
      '<div class="row" style="margin-top:12px">' +
        '<button class="btn btn-sm" data-act="view">' + T.icon('eye', 'ic-sm') + ' View</button>' +
        '<button class="btn btn-sm" data-act="edit">' + T.icon('edit', 'ic-sm') + ' Edit</button>' +
        '<button class="btn btn-sm" data-act="reuse">' + T.icon('arrow-r', 'ic-sm') + ' Reuse</button>' +
        '<button class="btn btn-sm btn-ghost" data-act="del">' + T.icon('trash', 'ic-sm') + ' Delete</button>' +
      '</div>' +
    '</div>';
  }

  function detailBody(e){
    const row = (label, val) =>
      '<div class="field"><div class="label">' + label + '</div>' +
      '<div class="output-body" style="min-height:0">' + T.esc(val || '—') + '</div></div>';
    return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">' +
        statusBadge(e.status) +
        '<span style="color:var(--muted);font-size:13px">' + T.esc(T.fmtDate(e.date || Date.now())) + '</span>' +
      '</div>' +
      row('Input', e.input) +
      row('Context', e.context) +
      row('Output', e.output) +
      '<div class="row">' +
        '<span class="chip"><b>Action:</b> ' + T.esc(e.action || '—') + '</span>' +
        '<span class="chip"><b>Platform:</b> ' + T.esc(e.platform || '—') + '</span>' +
        (e.output ? '<span class="chip">' + T.words(e.output) + ' words</span>' : '') +
      '</div>';
  }

  function prefill(instruction, contextText){
    sessionStorage.setItem('typex_prefill', JSON.stringify({instruction, contextText}));
    T.router.navigate('app/workspace');
  }

  function onAction(id, act){
    const list = T.store.get('history', []);
    const e = list.find(x => x.id === id);
    if (!e) return;
    if (act === 'view'){
      T.ui.modal({
        wide: true,
        title: e.name || 'Task',
        body: detailBody(e),
        actions: [
          {label: 'Close', kind: 'btn-ghost'},
          {label: 'Copy Output', kind: 'btn-primary', onClick: async () => {
            const ok = await T.copy(e.output || '');
            T.ui.toast(ok ? 'Output copied.' : 'Nothing to copy.', ok ? 'success' : 'error');
          }}
        ]
      });
    } else if (act === 'edit'){
      prefill(e.input || '', e.context || '');
      T.ui.toast('Task loaded into Workspace.', 'success');
    } else if (act === 'reuse'){
      prefill(e.input || '', e.context || '');
      T.ui.toast('Task reused.', 'success');
    } else if (act === 'del'){
      T.ui.confirm({
        title: 'Delete task?',
        message: 'This will permanently remove "' + (e.name || 'this task') + '" from history.',
        okLabel: 'Delete',
        danger: true
      }).then(ok => {
        if (!ok) return;
        T.store.set('history', T.store.get('history', []).filter(x => x.id !== id));
        paint();
        T.ui.toast('Task deleted.', 'info');
      });
    }
  }

  function seedIfNeeded(){
    if (T.store.get('typex_history_seeded')) return;
    if ((T.store.get('history', []) || []).length) { T.store.set('typex_history_seeded', true); return; }
    const now = Date.now(), d = 864e5;
    T.store.set('history', [
      {
        id: T.uid('task'), name: 'Reply to Sarah about pricing',
        date: now - 2 * d,
        input: 'A customer named Sarah asked about our pricing plans over email. Draft a reply that explains the plans clearly and offers a quick call to help her choose.',
        context: 'Plans: Starter $97 one-time, Business $247 one-time, Care Plan $29/month. Sarah runs a boutique and cares most about setup speed.',
        output: 'Hi Sarah,\n\nThanks for getting in touch! Here is a quick overview of our plans:\n\n— Starter ($97 one-time): everything you need to get going fast, including your first workflow setup.\n— Business ($247 one-time): for busier stores — adds advanced automations and priority support.\n— Care Plan ($29/month): we keep everything running, updated, and supported.\n\nMost boutique owners pick Starter and upgrade later if they need more. Happy to walk you through it on a quick 10-minute call — would tomorrow morning work?\n\nBest regards',
        action: 'Email', platform: 'Workspace', status: 'Approved'
      },
      {
        id: T.uid('task'), name: 'Rewrite launch announcement',
        date: now - 5 * d,
        input: 'Rewrite this product launch announcement to sound more exciting: "We have launched a new feature that lets you edit videos by typing."',
        context: '',
        output: 'Editing video just became effortless. Our newest feature lets you edit videos simply by typing what you want — no timelines, no learning curve. Describe the cut, the caption, the style… and watch it happen. Try it today and see how fast a rough clip becomes a finished story.',
        action: 'Copied', platform: 'Workspace', status: 'Completed'
      }
    ]);
    T.store.set('typex_history_seeded', true);
  }

  function paint(){
    const wrap = T.qs('#his-list');
    if (!wrap) return;
    const list = filtered();
    if (!list.length){
      wrap.innerHTML = T.ui.emptyState({
        icon: 'history',
        title: 'No tasks yet.',
        text: 'Tell Clint X what you want to accomplish.',
        actionLabel: 'CREATE YOUR FIRST TASK'
      });
      const btn = wrap.querySelector('[data-empty-action]');
      if (btn) btn.addEventListener('click', () => { location.hash = '#/app/workspace'; });
      return;
    }
    wrap.innerHTML = list.map(cardHTML).join('');
  }

  T.pages['history'] = {
    title: 'History',
    render(){
      seedIfNeeded();
      return T.ui.pageHead(
        'History',
        'Everything CLINT X has done for you.',
        ''
      ) +
      '<div class="card card-pad" style="margin-bottom:16px"><div class="row">' +
        '<div class="field" style="flex:1;min-width:200px;margin:0"><div class="label">Search</div>' +
          '<input class="input" id="his-q" placeholder="Search tasks…" value="' + T.esc(F.q) + '"></div>' +
        '<div class="field" style="margin:0"><div class="label">Status</div>' +
          '<select class="select" id="his-status">' +
            ['All', 'Completed', 'Approved', 'Typed'].map(s =>
              '<option' + (s === F.status ? ' selected' : '') + '>' + s + '</option>').join('') +
          '</select></div>' +
        '<div class="field" style="margin:0;align-self:flex-end">' +
          '<button class="btn btn-sm btn-danger" id="his-clear">' + T.icon('trash', 'ic-sm') + ' Clear history</button></div>' +
      '</div></div>' +
      '<div class="cards-grid" id="his-list"></div>';
    },
    mount(root){
      paint();
      const q = T.qs('#his-q', root), st = T.qs('#his-status', root);
      if (q){
        q.addEventListener('input', T.debounce(() => { F.q = q.value.trim().toLowerCase(); paint(); }, 250));
      }
      if (st){
        st.addEventListener('change', () => { F.status = st.value; paint(); });
      }
      T.qs('#his-clear', root).addEventListener('click', () => {
        T.ui.confirm({
          title: 'Clear all history?',
          message: 'Every task and output will be permanently removed. This cannot be undone.',
          okLabel: 'Clear everything',
          danger: true
        }).then(ok => {
          if (!ok) return;
          T.store.set('history', []);
          paint();
          T.ui.toast('History cleared.', 'info');
        });
      });
      T.qs('#his-list', root).addEventListener('click', ev => {
        const btn = ev.target.closest('[data-act]');
        if (!btn) return;
        const card = btn.closest('[data-id]');
        if (!card) return;
        onAction(card.getAttribute('data-id'), btn.getAttribute('data-act'));
      });
    },
    unmount(){}
  };
})();
