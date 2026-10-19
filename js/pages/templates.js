/* TYPE X — Templates page: one-tap starting points for recurring work. */
(function(){
  const T = window.TypeX;

  const CATEGORIES = ['Writing', 'Rewriting', 'Communication', 'Productivity', 'Language', 'Creative'];
  const TONES = ['Professional', 'Friendly', 'Casual', 'Persuasive', 'Confident', 'Simple', 'Funny'];
  const LANGUAGES = ['English', 'Roman Urdu', 'Urdu'];
  const LENGTHS = ['Short', 'Medium', 'Long'];
  const FORMATS = ['Paragraphs', 'Email', 'Bullets', 'Social Media', 'Plain Text'];

  function all(){ return T.store.get('templates', []); }
  function save(list){ T.store.set('templates', list); }

  const F = { cat: 'All' };

  function visible(){
    return all().filter(t => F.cat === 'All' || (t.category || 'General') === F.cat);
  }

  function cardHTML(t){
    return '<div class="mini-card" data-id="' + T.esc(t.id) + '">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span class="stat-ic p" style="width:36px;height:36px">' + T.icon(t.icon || 'template', 'ic') + '</span>' +
        '<h3 style="margin:0">' + T.esc(t.name || 'Untitled') + '</h3>' +
      '</div>' +
      '<div style="margin:8px 0"><span class="badge b-b">' + T.esc(t.category || 'General') + '</span></div>' +
      '<p>' + T.esc(t.prompt && t.prompt.length > 110 ? t.prompt.slice(0, 110).trimEnd() + '…' : (t.prompt || '')) + '</p>' +
      '<div class="row" style="margin-top:12px">' +
        '<button class="btn btn-sm btn-ai" data-act="use">' + T.icon('play', 'ic-sm') + ' Use</button>' +
        '<button class="btn btn-sm" data-act="edit">' + T.icon('edit', 'ic-sm') + ' Edit</button>' +
        '<button class="btn btn-sm" data-act="dup">' + T.icon('copy', 'ic-sm') + ' Duplicate</button>' +
        '<button class="btn btn-sm btn-ghost" data-act="del">' + T.icon('trash', 'ic-sm') + ' Delete</button>' +
      '</div>' +
    '</div>';
  }

  function paint(){
    const grid = T.qs('#tpl-grid');
    if (!grid) return;
    const allList = all();
    const list = visible();
    if (!allList.length){
      grid.innerHTML = T.ui.emptyState({
        icon: 'template',
        title: 'No templates yet.',
        text: 'Create your first template to launch recurring tasks in one tap.',
        actionLabel: 'CREATE YOUR FIRST TEMPLATE'
      });
      const btn = grid.querySelector('[data-empty-action]');
      if (btn) btn.addEventListener('click', () => openEditor(null));
      return;
    }
    if (!list.length){
      grid.innerHTML = T.ui.emptyState({
        icon: 'filter',
        title: 'No templates in this category.',
        text: 'Try a different category, or create a new template.',
        actionLabel: 'NEW TEMPLATE'
      });
      const btn = grid.querySelector('[data-empty-action]');
      if (btn) btn.addEventListener('click', () => openEditor(null));
      return;
    }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  function formHTML(t){
    t = t || {name:'', category:'Writing', prompt:'', style:{tone:'Professional', language:'English', length:'Medium', format:'Paragraphs'}};
    const st = t.style || {};
    return '<div class="field"><div class="label">Name</div>' +
      '<input class="input" id="tpl-name" value="' + T.esc(t.name) + '" placeholder="e.g. Cold Email Opener"></div>' +
      '<div class="field"><div class="label">Category</div>' +
      '<select class="select" id="tpl-cat">' + CATEGORIES.map(c =>
        '<option' + (c === t.category ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div>' +
      '<div class="field"><div class="label">Prompt</div>' +
      '<textarea class="textarea" id="tpl-prompt" rows="3" placeholder="Write a professional email about: {topic}">' + T.esc(t.prompt) + '</textarea>' +
      '<div class="hint">Use {placeholder} where the task details go.</div></div>' +
      '<div class="field"><div class="label">Tone</div>' + T.ui.segButtons('tone', TONES, st.tone || 'Professional') + '</div>' +
      '<div class="field"><div class="label">Language</div>' + T.ui.segButtons('language', LANGUAGES, st.language || 'English') + '</div>' +
      '<div class="field"><div class="label">Length</div>' + T.ui.segButtons('length', LENGTHS, st.length || 'Medium') + '</div>' +
      '<div class="field"><div class="label">Format</div>' + T.ui.segButtons('format', FORMATS, st.format || 'Paragraphs') + '</div>';
  }

  function wireSeg(body){
    body.addEventListener('click', ev => {
      const b = ev.target.closest('.seg-btn');
      if (!b) return;
      T.qsa('.seg-btn', b.parentElement).forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  }

  function readForm(body){
    const v = id => body.querySelector(id).value.trim();
    const s = name => { const b = body.querySelector('[data-seg="' + name + '"] .seg-btn.active'); return b ? b.getAttribute('data-val') : ''; };
    return {
      name: v('#tpl-name'),
      category: v('#tpl-cat'),
      prompt: body.querySelector('#tpl-prompt').value.trim(),
      style: { tone: s('tone') || 'Professional', language: s('language') || 'English',
               length: s('length') || 'Medium', format: s('format') || 'Paragraphs' }
    };
  }

  function openEditor(t){
    const isNew = !t;
    const body = T.el('<div>' + formHTML(t) + '</div>');
    wireSeg(body);
    T.ui.modal({
      title: isNew ? 'New Template' : 'Edit Template',
      body: body,
      actions: [
        {label: 'Cancel', kind: 'btn-ghost'},
        {label: 'Save Template', kind: 'btn-primary', onClick: () => {
          const d = readForm(body);
          if (!d.name || !d.prompt){ T.ui.toast('Give your template a name and a prompt.', 'error'); return; }
          const list = all();
          if (isNew){
            list.push({id: T.uid('tpl'), icon: 'template', name: d.name, category: d.category, prompt: d.prompt, style: d.style});
          } else {
            const i = list.findIndex(x => x.id === t.id);
            if (i >= 0) list[i] = Object.assign({}, list[i], {name: d.name, category: d.category, prompt: d.prompt, style: d.style});
          }
          save(list); paint();
          T.ui.toast(isNew ? 'Template created.' : 'Template updated.', 'success');
        }}
      ]
    });
  }

  function onAction(id, act){
    const list = all();
    const t = list.find(x => x.id === id);
    if (!t) return;
    if (act === 'use'){
      sessionStorage.setItem('typex_prefill', JSON.stringify({instruction: t.prompt, style: t.style}));
      T.router.navigate('app/workspace');
      T.ui.toast('Template loaded into Workspace.', 'success');
    } else if (act === 'edit'){
      openEditor(t);
    } else if (act === 'dup'){
      const c = JSON.parse(JSON.stringify(t));
      c.id = T.uid('tpl');
      c.name = (t.name || 'Template') + ' (copy)';
      list.push(c); save(list); paint();
      T.ui.toast('Template duplicated.', 'success');
    } else if (act === 'del'){
      T.ui.confirm({
        title: 'Delete template?',
        message: 'This will permanently remove "' + (t.name || 'this template') + '".',
        okLabel: 'Delete',
        danger: true
      }).then(ok => {
        if (!ok) return;
        save(all().filter(x => x.id !== id));
        paint();
        T.ui.toast('Template deleted.', 'info');
      });
    }
  }

  T.pages['templates'] = {
    title: 'Templates',
    render(){
      return T.ui.pageHead(
        'Templates',
        'One-tap starting points for recurring work.',
        '<button class="btn btn-ai" id="tpl-new">' + T.icon('plus', 'ic-sm') + ' New Template</button>'
      ) +
      '<div class="card card-pad" style="margin-bottom:16px"><div class="row">' +
        '<div class="field" style="margin:0;min-width:200px"><div class="label">Category</div>' +
          '<select class="select" id="tpl-filter"><option>All</option>' +
            CATEGORIES.map(c => '<option' + (c === F.cat ? ' selected' : '') + '>' + c + '</option>').join('') +
          '</select></div>' +
        '<div class="field" style="margin:0;align-self:flex-end">' +
          '<span class="chip">' + all().length + ' templates</span></div>' +
      '</div></div>' +
      '<div class="cards-grid" id="tpl-grid"></div>';
    },
    mount(root){
      paint();
      T.qs('#tpl-new', root).addEventListener('click', () => openEditor(null));
      T.qs('#tpl-filter', root).addEventListener('change', ev => { F.cat = ev.target.value; paint(); });
      T.qs('#tpl-grid', root).addEventListener('click', ev => {
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
