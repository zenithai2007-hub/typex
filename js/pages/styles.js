/* TYPE X — Saved Styles page: your voice, remembered. */
(function(){
  const T = window.TypeX;

  const TONES = ['Professional', 'Friendly', 'Casual', 'Persuasive', 'Confident', 'Simple', 'Funny'];
  const LANGUAGES = ['English', 'Roman Urdu', 'Urdu'];
  const LENGTHS = ['Short', 'Medium', 'Long'];
  const FORMATS = ['Paragraphs', 'Email', 'Bullets', 'Social Media', 'Plain Text'];

  function all(){ return T.store.get('styles', []); }
  function save(list){ T.store.set('styles', list); }

  function chip(label, val){
    return '<span class="chip"><b>' + T.esc(label) + ':</b> ' + T.esc(val || '—') + '</span>';
  }

  function cardHTML(s){
    const rules = (s.rules || []);
    return '<div class="mini-card" data-id="' + T.esc(s.id) + '">' +
      '<h3>' + T.esc(s.name || 'Untitled style') +
        (s.active ? ' <span class="badge b-g">Active</span>' : '') + '</h3>' +
      '<div class="row" style="margin:8px 0">' +
        chip('Tone', s.tone) + chip('Language', s.language) +
      '</div>' +
      '<div class="row" style="margin-bottom:8px">' +
        chip('Length', s.length) + chip('Format', s.format) +
      '</div>' +
      (rules.length
        ? '<div class="label" style="margin-top:4px">Rules</div><ul style="margin:4px 0 0 18px;padding:0;font-size:13px;color:var(--muted)">' +
          rules.map(r => '<li>' + T.esc(r) + '</li>').join('') + '</ul>'
        : '<p style="color:var(--muted2);font-size:13px">No rules yet.</p>') +
      '<div class="row" style="margin-top:12px">' +
        '<button class="btn btn-sm" data-act="use">' + T.icon('check', 'ic-sm') + ' Use</button>' +
        '<button class="btn btn-sm" data-act="activate">' + T.icon('star', 'ic-sm') + ' Activate</button>' +
        '<button class="btn btn-sm" data-act="edit">' + T.icon('edit', 'ic-sm') + ' Edit</button>' +
        '<button class="btn btn-sm" data-act="dup">' + T.icon('copy', 'ic-sm') + ' Duplicate</button>' +
        '<button class="btn btn-sm btn-ghost" data-act="del">' + T.icon('trash', 'ic-sm') + ' Delete</button>' +
      '</div>' +
    '</div>';
  }

  function paint(){
    const grid = T.qs('#sty-grid');
    if (!grid) return;
    const list = all();
    if (!list.length){
      grid.innerHTML = T.ui.emptyState({
        icon: 'style',
        title: 'No styles yet.',
        text: 'Save your writing style once and TYPE X will write like you, every time.',
        actionLabel: 'CREATE YOUR FIRST STYLE'
      });
      const btn = grid.querySelector('[data-empty-action]');
      if (btn) btn.addEventListener('click', () => openEditor(null));
      return;
    }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  function formHTML(s){
    s = s || {name:'', tone:'Professional', language:'English', length:'Medium', format:'Paragraphs', rules:[]};
    return '<div class="field"><div class="label">Name</div>' +
      '<input class="input" id="sty-name" value="' + T.esc(s.name) + '" placeholder="e.g. My Email Voice"></div>' +
      '<div class="field"><div class="label">Tone</div>' +
      '<input class="input" id="sty-tone" list="sty-tone-list" value="' + T.esc(s.tone) + '" placeholder="e.g. Professional + Friendly">' +
      '<datalist id="sty-tone-list">' + TONES.map(o => '<option>' + o + '</option>').join('') + '</datalist></div>' +
      '<div class="field"><div class="label">Language</div>' +
      '<input class="input" id="sty-lang" list="sty-lang-list" value="' + T.esc(s.language) + '">' +
      '<datalist id="sty-lang-list">' + LANGUAGES.map(o => '<option>' + o + '</option>').join('') + '</datalist></div>' +
      '<div class="field"><div class="label">Length</div>' +
      '<select class="select" id="sty-length">' + LENGTHS.map(o =>
        '<option' + (o === s.length ? ' selected' : '') + '>' + o + '</option>').join('') + '</select></div>' +
      '<div class="field"><div class="label">Format</div>' +
      '<select class="select" id="sty-format">' + FORMATS.map(o =>
        '<option' + (o === s.format ? ' selected' : '') + '>' + o + '</option>').join('') + '</select></div>' +
      '<div class="field"><div class="label">Rules</div>' +
      '<textarea class="textarea" id="sty-rules" rows="3" placeholder="One rule per line">' + T.esc((s.rules || []).join('\n')) + '</textarea>' +
      '<div class="hint">One rule per line — e.g. "No unnecessary words".</div></div>';
  }

  function readForm(body){
    const v = id => body.querySelector(id).value.trim();
    const rules = v('#sty-rules').split('\n').map(r => r.trim()).filter(Boolean);
    return {
      name: v('#sty-name'),
      tone: v('#sty-tone'),
      language: v('#sty-lang'),
      length: body.querySelector('#sty-length').value,
      format: body.querySelector('#sty-format').value,
      rules: rules
    };
  }

  function openEditor(s){
    const isNew = !s;
    const body = T.el('<div>' + formHTML(s) + '</div>');
    T.ui.modal({
      title: isNew ? 'New Style' : 'Edit Style',
      body: body,
      actions: [
        {label: 'Cancel', kind: 'btn-ghost'},
        {label: 'Save Style', kind: 'btn-primary', onClick: () => {
          const d = readForm(body);
          if (!d.name){ T.ui.toast('Give your style a name.', 'error'); return; }
          const list = all();
          if (isNew){
            list.push(Object.assign({id: T.uid('sty'), active: false}, d));
          } else {
            const i = list.findIndex(x => x.id === s.id);
            if (i >= 0) list[i] = Object.assign({}, list[i], d);
          }
          save(list); paint();
          T.ui.toast(isNew ? 'Style created.' : 'Style updated.', 'success');
        }}
      ]
    });
  }

  function applyAsDefault(s){
    const settings = T.store.get('settings', T.DEFAULT_SETTINGS);
    if (TONES.indexOf(s.tone) >= 0) settings.defaultTone = s.tone;
    if (LANGUAGES.indexOf(s.language) >= 0) settings.defaultLanguage = s.language;
    if (LENGTHS.indexOf(s.length) >= 0) settings.defaultLength = s.length;
    if (FORMATS.indexOf(s.format) >= 0) settings.defaultFormat = s.format;
    T.store.set('settings', settings);
  }

  function onAction(id, act){
    const list = all();
    const s = list.find(x => x.id === id);
    if (!s) return;
    const settings = T.store.get('settings', T.DEFAULT_SETTINGS);
    if (act === 'use'){
      applyAsDefault(s);
      T.ui.toast('Style applied as default.', 'success');
    } else if (act === 'activate'){
      if (!settings.rememberStyle){
        T.ui.toast('Turn on "Remember My Writing Style" in Settings to activate styles.', 'info');
        return;
      }
      list.forEach(x => { x.active = (x.id === id); });
      save(list);
      settings.activeStyleId = id;
      T.store.set('settings', settings);
      paint();
      T.ui.toast('Style activated.', 'success');
    } else if (act === 'edit'){
      openEditor(s);
    } else if (act === 'dup'){
      const c = JSON.parse(JSON.stringify(s));
      c.id = T.uid('sty');
      c.name = (s.name || 'Style') + ' (copy)';
      c.active = false;
      list.push(c); save(list); paint();
      T.ui.toast('Style duplicated.', 'success');
    } else if (act === 'del'){
      T.ui.confirm({
        title: 'Delete style?',
        message: 'This will permanently remove "' + (s.name || 'this style') + '".',
        okLabel: 'Delete',
        danger: true
      }).then(ok => {
        if (!ok) return;
        save(all().filter(x => x.id !== id));
        if (s.active){
          const st = T.store.get('settings', T.DEFAULT_SETTINGS);
          st.activeStyleId = null;
          T.store.set('settings', st);
        }
        paint();
        T.ui.toast('Style deleted.', 'info');
      });
    }
  }

  T.pages['styles'] = {
    title: 'Saved Styles',
    render(){
      return T.ui.pageHead(
        'Saved Styles',
        'Your voice, remembered. Activate one and TYPE X writes like you.',
        '<button class="btn btn-ai" id="sty-new">' + T.icon('plus', 'ic-sm') + ' New Style</button>'
      ) + '<div class="cards-grid" id="sty-grid"></div>';
    },
    mount(root){
      paint();
      T.qs('#sty-new', root).addEventListener('click', () => openEditor(null));
      T.qs('#sty-grid', root).addEventListener('click', ev => {
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
