/* TYPE X — Output page: every finished generation, ready to reuse.
   Sourced from typex_history entries that carry an output. */
(function(){
  const T = window.TypeX;

  function entries(){
    return T.store.get('history', [])
      .filter(e => e && e.output)
      .sort((a,b) => (b.date || 0) - (a.date || 0));
  }

  function snippet(s, n){
    s = String(s || '');
    return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
  }

  function prefillWorkspace(instruction, contextText){
    sessionStorage.setItem('typex_prefill', JSON.stringify({instruction, contextText}));
    T.router.navigate('app/workspace');
  }

  function cardHTML(e){
    return '<div class="mini-card" data-id="' + T.esc(e.id) + '">' +
      '<h3>' + T.esc(e.name || 'Untitled task') + '</h3>' +
      '<div class="row" style="margin:8px 0">' +
        '<span class="chip">' + T.icon('cal', 'ic-sm') + ' ' + T.esc(T.timeAgo(e.date || Date.now())) + '</span>' +
        (e.platform ? '<span class="chip">' + T.esc(e.platform) + '</span>' : '') +
        '<span class="chip">' + T.words(e.output) + ' words</span>' +
      '</div>' +
      '<p>' + T.esc(snippet(e.output, 140)) + '</p>' +
      '<div class="row" style="margin-top:12px">' +
        '<button class="btn btn-sm" data-act="view">' + T.icon('eye', 'ic-sm') + ' View</button>' +
        '<button class="btn btn-sm" data-act="copy">' + T.icon('copy', 'ic-sm') + ' Copy</button>' +
        '<button class="btn btn-sm" data-act="reuse">' + T.icon('arrow-r', 'ic-sm') + ' Reuse</button>' +
        '<button class="btn btn-sm btn-ghost" data-act="del">' + T.icon('trash', 'ic-sm') + ' Delete</button>' +
      '</div>' +
    '</div>';
  }

  function paint(){
    const grid = T.qs('#out-grid');
    if (!grid) return;
    const list = entries();
    if (!list.length){
      grid.innerHTML = T.ui.emptyState({
        icon: 'output',
        title: 'No outputs yet.',
        text: 'Run your first task in the Workspace and finished outputs will land here.',
        actionLabel: 'CREATE YOUR FIRST TASK'
      });
      const btn = grid.querySelector('[data-empty-action]');
      if (btn) btn.addEventListener('click', () => { location.hash = '#/app/workspace'; });
      return;
    }
    const totalWords = list.reduce((n, e) => n + T.words(e.output), 0);
    grid.innerHTML =
      '<div class="row" style="margin-bottom:12px">' +
        T.ui.statCard({label: 'Saved outputs', value: list.length, icon: 'output'}) +
        T.ui.statCard({label: 'Total words', value: totalWords, icon: 'doc', accent: 'g'}) +
      '</div>' +
      list.map(cardHTML).join('');
  }

  function findEntry(id){
    return T.store.get('history', []).find(e => e.id === id);
  }

  function onAction(id, act){
    const e = findEntry(id);
    if (!e) return;
    if (act === 'view'){
      T.ui.modal({
        wide: true,
        title: e.name || 'Output',
        body: '<div class="output-body">' + T.esc(e.output || '') + '</div>',
        actions: [
          {label: 'Close', kind: 'btn-ghost'},
          {label: 'Copy', kind: 'btn-primary', onClick: async () => {
            const ok = await T.copy(e.output || '');
            T.ui.toast(ok ? 'Output copied.' : 'Copy failed.', ok ? 'success' : 'error');
          }}
        ]
      });
    } else if (act === 'copy'){
      T.copy(e.output || '').then(ok => T.ui.toast(ok ? 'Output copied.' : 'Copy failed.', ok ? 'success' : 'error'));
    } else if (act === 'reuse'){
      prefillWorkspace('Reuse and improve: ' + (e.input || e.name || ''), e.output || '');
      T.ui.toast('Output loaded into Workspace.', 'success');
    } else if (act === 'del'){
      T.ui.confirm({
        title: 'Delete output?',
        message: 'This will remove "' + (e.name || 'this task') + '" from your history. This cannot be undone.',
        okLabel: 'Delete',
        danger: true
      }).then(ok => {
        if (!ok) return;
        T.store.set('history', T.store.get('history', []).filter(h => h.id !== id));
        paint();
        T.ui.toast('Output deleted.', 'info');
      });
    }
  }

  T.pages['output'] = {
    title: 'Output',
    render(){
      return T.ui.pageHead(
        'Output',
        'Every finished generation, ready to reuse.',
        '<a class="btn btn-ai" href="#/app/workspace?new=1">' + T.icon('plus', 'ic-sm') + ' New Task</a>'
      ) + '<div class="cards-grid" id="out-grid"></div>';
    },
    mount(root){
      paint();
      const grid = T.qs('#out-grid', root) || root;
      grid.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-act]');
        if (!btn) return;
        const card = btn.closest('[data-id]');
        if (!card) return;
        onAction(card.getAttribute('data-id'), btn.getAttribute('data-act'));
      });
      const empty = grid.querySelector('[data-empty-action]');
      if (empty) empty.addEventListener('click', () => { location.hash = '#/app/workspace'; });
    },
    unmount(){}
  };
})();
