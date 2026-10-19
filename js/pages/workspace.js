/* TYPE X — Workspace page: instruction input + context + dominant output panel + style engine + agent. */
(function(){
  const T = window.TypeX;

  const TONES  = ['Professional','Friendly','Casual','Formal','Persuasive','Confident','Funny','Simple','Technical','Custom'];
  const LANGS  = ['English','Urdu','Roman Urdu','Hindi','Arabic','Spanish','French','German','Custom'];
  const LENGTHS = ['Short','Medium','Long','Custom'];
  const FORMATS = ['Plain Text','Paragraphs','Bullets','Numbered List','Email','Social Media','Custom'];

  const EXAMPLES = [
    'Write a professional reply.',
    'Rewrite this in a friendly tone.',
    'Translate this into Urdu.',
    'Create a short social media response.',
    'Format this information.',
    'Make this message persuasive but natural.'
  ];

  /* ---------------- render ---------------- */
  function render(){
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    return `
    <div class="card ws-topbar">
      <div class="ws-task">
        <div style="font-size:11px;color:var(--muted2);letter-spacing:.08em">Current Task</div>
        <small id="ws-task-name" style="font-size:16px;font-weight:700;color:var(--text)">Untitled Task</small>
        <span class="status-pill" id="ws-status"><span class="status-dot"></span><span id="ws-status-tx">Ready</span></span>
      </div>
      <div class="ws-actions">
        <button class="btn btn-sm" id="ws-pause">${T.icon('pause','ic-sm')} Pause</button>
        <button class="btn btn-sm" id="ws-stop">${T.icon('stop','ic-sm')} Stop</button>
        <button class="btn btn-icon btn-ghost" id="ws-settings" title="Settings">${T.icon('gear')}</button>
      </div>
    </div>

    <div class="ws-grid">
      <!-- LEFT column -->
      <div class="ws-col">
        <div class="card panel">
          <div class="panel-head"><h2>${T.icon('spark','ic-sm')} What do you want Type X to do?</h2></div>
          <textarea id="ws-input" class="textarea" rows="5" placeholder="Tell Type X what you want…"></textarea>
          <div class="examples" style="margin-top:10px">
            ${EXAMPLES.map(e => '<button class="example" data-ex="' + T.esc(e) + '">' + T.esc(e) + '</button>').join('')}
          </div>
          <div style="display:grid;gap:8px;margin-top:14px">
            <button class="btn btn-ai btn-block" id="ws-run">${T.icon('bolt','ic-sm')} RUN TYPE X</button>
            <button class="btn btn-ghost btn-block" id="ws-clear">CLEAR</button>
          </div>
          <p class="hint" style="margin-top:10px"><span class="kbd">Ctrl</span> + <span class="kbd">Enter</span> to run</p>
        </div>

        <div class="card panel">
          <div class="panel-head"><h2>${T.icon('layers','ic-sm')} Context</h2></div>
          <div class="controls-row">
            <button class="btn btn-sm" id="ws-ctx-paste">${T.icon('doc','ic-sm')} Paste Text</button>
            <button class="btn btn-sm" id="ws-ctx-file">${T.icon('upload','ic-sm')} Add Document</button>
            <button class="btn btn-sm" id="ws-ctx-field">${T.icon('plus','ic-sm')} Add Context</button>
            <button class="btn btn-sm" id="ws-ctx-url">${T.icon('link','ic-sm')} Add URL</button>
            <button class="btn btn-sm" id="ws-ctx-sel">${T.icon('eye','ic-sm')} Select Current Context</button>
          </div>
          <input type="file" id="ws-ctx-filein" accept=".txt,.md,.csv" style="display:none">
          <div class="field" id="ws-ctx-textwrap" style="display:none;margin-top:10px">
            <textarea id="ws-ctx-text" class="textarea" rows="3" placeholder="Paste text to use as context…"></textarea>
          </div>
          <div class="field" id="ws-ctx-addwrap" style="display:none;margin-top:10px">
            <input id="ws-ctx-add" class="input" placeholder="Type a short context note…">
          </div>
          <div class="field" id="ws-ctx-urlwrap" style="display:none;margin-top:10px">
            <input id="ws-ctx-urlin" class="input" placeholder="https://…">
            <p class="hint">URL content is referenced, not fetched, in v1.</p>
          </div>
          <details class="ctx-preview" id="ws-ctxprev" style="margin-top:12px">
            <summary>CONTEXT DETECTED</summary>
            <div class="body" id="ws-ctxbody">No context added yet.</div>
          </details>
        </div>
      </div>

      <!-- RIGHT column -->
      <div class="ws-col">
        <div class="card panel output-panel">
          <div class="panel-head">
            <h2>${T.icon('bolt','ic-sm')} TYPE X OUTPUT</h2>
            <span class="badge b-o" id="ws-phase" style="display:none">WORKING</span>
          </div>
          <div id="ws-genstatus" class="gen-status" style="display:none"></div>
          <div class="output-body" id="ws-output">
            <div class="empty" style="padding:30px">
              <div class="empty-icon">${T.icon('spark','ic-lg')}</div>
              <h3>Your output appears here</h3>
              <p>Tell TYPE X what to do, then press RUN TYPE X.</p>
            </div>
          </div>
          <div class="meta-row" id="ws-meta" style="display:none">
            <div class="meta">Word Count <b id="m-words">0</b></div>
            <div class="meta">Character Count <b id="m-chars">0</b></div>
            <div class="meta">Language <b id="m-lang">—</b></div>
            <div class="meta">Tone <b id="m-tone">—</b></div>
            <div class="meta">Format <b id="m-format">—</b></div>
          </div>
          <div class="controls-row" style="margin-top:12px">
            <button class="btn btn-sm" id="ws-edit">${T.icon('edit','ic-sm')} EDIT</button>
            <button class="btn btn-sm" id="ws-copy">${T.icon('copy','ic-sm')} COPY</button>
            <button class="btn btn-sm" id="ws-regen">${T.icon('refresh','ic-sm')} REGENERATE</button>
            <button class="btn btn-sm" id="ws-shorten">${T.icon('shorten','ic-sm')} SHORTEN</button>
            <button class="btn btn-sm" id="ws-expand">${T.icon('expand','ic-sm')} EXPAND</button>
            <button class="btn btn-sm" id="ws-translate">${T.icon('translate','ic-sm')} TRANSLATE</button>
            <button class="btn btn-sm" id="ws-tone">${T.icon('wand','ic-sm')} CHANGE TONE</button>
            <button class="btn btn-sm" id="ws-format">${T.icon('type','ic-sm')} FORMAT</button>
          </div>
          <div class="type-row" style="margin-top:12px">
            <button class="btn btn-primary btn-lg" id="ws-type">${T.icon('type','ic-sm')} TYPE OUTPUT</button>
            <button class="btn btn-lg" id="ws-approve-type">${T.icon('check','ic-sm')} APPROVE &amp; TYPE</button>
          </div>
        </div>

        <div class="card panel">
          <div class="panel-head"><h2>${T.icon('style','ic-sm')} Style Engine</h2></div>
          <div class="style-grid">
            <div class="field"><div class="label">STYLE</div>
              ${T.ui.segButtons('tone', TONES, (s||{}).defaultTone || 'Professional')}</div>
            <div class="field"><div class="label">LANGUAGE</div>
              ${T.ui.segButtons('language', LANGS, (s||{}).defaultLanguage || 'English')}</div>
            <div class="field"><div class="label">LENGTH</div>
              ${T.ui.segButtons('length', LENGTHS, (s||{}).defaultLength || 'Medium')}</div>
            <div class="field"><div class="label">FORMAT</div>
              ${T.ui.segButtons('format', FORMATS, (s||{}).defaultFormat || 'Paragraphs')}</div>
          </div>
          <div class="full" style="margin-top:12px">
            <button class="btn btn-ai btn-sm" id="ws-save-style">${T.icon('star','ic-sm')} SAVE AS MY STYLE</button>
          </div>
        </div>

        <div class="card panel">
          <div class="panel-head">
            <h2>${T.icon('cpu','ic-sm')} TYPE X AGENT</h2>
            <span class="badge b-g" id="ws-agent-state">READY</span>
          </div>
          <div class="controls-row">
            <button class="btn btn-sm" id="ws-agent-start">${T.icon('play','ic-sm')} START</button>
            <button class="btn btn-sm" id="ws-agent-pause">${T.icon('pause','ic-sm')} PAUSE</button>
            <button class="btn btn-sm" id="ws-agent-stop">${T.icon('stop','ic-sm')} STOP</button>
          </div>
          <div class="agent-log" id="ws-agentlog"></div>
          <p class="hint" style="margin-top:10px">The agent never performs hidden actions — every external step waits for your approval.</p>
        </div>
      </div>
    </div>`;
  }

  /* ---------------- state ---------------- */
  let R = null;            // root element refs cache
  let current = null;      // current output text
  let currentStyle = null; // {tone,language,length,format}
  let cancelGen = null;    // active generation cancel fn
  let generating = false;
  let timers = [];         // staged agent-log timeouts
  let agentBadgeTimer = null;

  function qs(sel){ return T.qs(sel, R); }

  function segVal(name){
    const btn = qs('[data-seg="' + name + '"] .seg-btn.active');
    return btn ? btn.dataset.val : null;
  }

  function readStyle(){
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    currentStyle = {
      tone:     segVal('tone')     || s.defaultTone     || 'Professional',
      language: segVal('language') || s.defaultLanguage || 'English',
      length:   segVal('length')   || s.defaultLength   || 'Medium',
      format:   segVal('format')   || s.defaultFormat   || 'Paragraphs'
    };
    return currentStyle;
  }

  /* ---------------- status helpers ---------------- */
  function setStatus(kind, text){
    // kind: ready | working | paused | error
    const pill = qs('#ws-status'), tx = qs('#ws-status-tx');
    const dot = pill.querySelector('.status-dot');
    dot.style.background = kind === 'working' ? '#ffb020'
      : kind === 'paused' ? '#38bdf8'
      : kind === 'error' ? '#f43f5e' : '#22c55e';
    tx.textContent = text || 'Ready';
    const phase = qs('#ws-phase');
    if (kind === 'working'){
      phase.style.display = ''; phase.textContent = 'WORKING'; phase.className = 'badge b-o';
    } else if (kind === 'paused'){
      phase.style.display = ''; phase.textContent = 'PAUSED'; phase.className = 'badge b-b';
    } else if (kind === 'error'){
      phase.style.display = ''; phase.textContent = 'ERROR'; phase.className = 'badge b-r';
    } else if (kind === 'ready' && current){
      phase.style.display = ''; phase.textContent = 'READY'; phase.className = 'badge b-g';
    } else {
      phase.style.display = 'none';
    }
  }

  function setAgentBadge(kind, text){
    const b = qs('#ws-agent-state');
    b.textContent = text;
    b.className = 'badge ' + (kind === 'running' ? 'b-o' : kind === 'paused' ? 'b-b' : 'b-g');
  }

  function genStatus(html, show){
    const el = qs('#ws-genstatus');
    el.style.display = show ? '' : 'none';
    if (html != null) el.innerHTML = html;
  }

  function outputSkeleton(){
    const out = qs('#ws-output');
    out.classList.add('generating');
    out.innerHTML = '<div class="skeleton" style="width:96%"></div>' +
      '<div class="skeleton" style="width:88%"></div>' +
      '<div class="skeleton" style="width:93%"></div>' +
      '<div class="skeleton" style="width:70%"></div>';
  }

  function outputText(text){
    const out = qs('#ws-output');
    out.classList.remove('generating');
    out.innerHTML = '<div style="white-space:pre-wrap;word-break:break-word">' + T.esc(text) + '</div>';
  }

  function outputEmpty(){
    const out = qs('#ws-output');
    out.classList.remove('generating');
    out.innerHTML = '<div class="empty" style="padding:30px"><div class="empty-icon">' +
      T.icon('spark','ic-lg') + '</div><h3>Your output appears here</h3>' +
      '<p>Tell TYPE X what to do, then press RUN TYPE X.</p></div>';
  }

  function updateMeta(text){
    qs('#ws-meta').style.display = '';
    qs('#m-words').textContent = T.words(text);
    qs('#m-chars').textContent = T.chars(text);
    qs('#m-lang').textContent  = currentStyle ? currentStyle.language : '—';
    qs('#m-tone').textContent  = currentStyle ? currentStyle.tone : '—';
    qs('#m-format').textContent = currentStyle ? currentStyle.format : '—';
  }

  /* ---------------- context ---------------- */
  function ctxParts(){
    const parts = [];
    const t = qs('#ws-ctx-text').value.trim();
    if (t) parts.push(t);
    const a = qs('#ws-ctx-add').value.trim();
    if (a) parts.push(a);
    const u = qs('#ws-ctx-urlin').value.trim();
    if (u) parts.push('Reference URL: ' + u);
    return parts;
  }

  function combinedContext(){
    return ctxParts().join('\n\n---\n\n');
  }

  function refreshCtxPreview(){
    const body = qs('#ws-ctxbody');
    const parts = ctxParts();
    if (!parts.length){ body.textContent = 'No context added yet.'; return; }
    body.innerHTML = parts.map(p => {
      const s = p.length > 160 ? p.slice(0, 160) + '…' : p;
      return '<div style="margin-bottom:8px">' + T.esc(s) + '</div>';
    }).join('');
  }

  /* ---------------- generation ---------------- */
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

  function stage(ms, fn){ timers.push(setTimeout(() => { if (generating) fn(); }, ms)); }

  function run(overrides){
    overrides = overrides || {};
    const instruction = overrides.instruction != null
      ? overrides.instruction
      : qs('#ws-input').value.trim();
    if (!instruction){
      T.ui.toast('Type an instruction first', 'error');
      qs('#ws-input').focus();
      return;
    }

    // cancel any in-flight generation first
    if (cancelGen){ cancelGen(); cancelGen = null; }
    clearTimers();
    clearTimeout(agentBadgeTimer);

    const style = overrides.style || readStyle();
    const ctx = overrides.contextText != null ? overrides.contextText : combinedContext();
    const hasCtx = !!ctx.trim();

    generating = true;
    const runBtn = qs('#ws-run');
    runBtn.disabled = true;
    setStatus('working', 'Working');
    setAgentBadge('running', 'WORKING');
    outputSkeleton();
    genStatus('<div class="spinner"></div><span>Type X is creating your output…</span>', true);

    T.agent.start('Instruction received');

    const type = T.ai.detectType ? T.ai.detectType(instruction) : 'writing';
    if (hasCtx) stage(700,  () => T.agent.log('Context detected (' + ctxParts().length + ' source' + (ctxParts().length > 1 ? 's' : '') + ')'));
    stage(1500, () => T.agent.log('Task analyzed (type: ' + type + ')'));

    const taskName = qs('#ws-task-name');
    taskName.textContent = instruction.length > 48 ? instruction.slice(0, 48) + '…' : instruction;

    const handle = T.ai.generate({
      instruction,
      contextText: ctx,
      style,
      onToken: (tk, acc) => {
        const out = qs('#ws-output');
        out.classList.add('generating');
        out.innerHTML = '<div style="white-space:pre-wrap;word-break:break-word">' + T.esc(acc) + '</div>';
      },
      onDone: (text) => { finishRun(instruction, ctx, style, text, runBtn); },
      onError: (fe) => { failRun(fe, runBtn); }
    });
    cancelGen = handle.cancel;
  }

  function finishRun(instruction, ctx, style, text, runBtn){
    generating = false; cancelGen = null; clearTimers();
    runBtn.disabled = false;
    current = text;
    currentStyle = style;
    outputText(text);
    updateMeta(text);
    genStatus(null, false);
    setStatus('ready', 'Ready');
    setAgentBadge('ready', 'READY');
    stageDone(instruction, ctx, text);
    T.agent.log('Output generated');
    T.agent.log('Waiting for approval', 'action');
    T.ui.toast('Output ready', 'success');
  }

  function stageDone(instruction, ctx, text){
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    if (s.saveHistory){
      const h = T.store.get('history', []);
      h.unshift({
        id: T.uid('task'),
        name: instruction.slice(0, 48) || 'Untitled Task',
        date: Date.now(),
        input: instruction,
        context: ctx,
        output: text,
        action: 'Generated',
        platform: 'Workspace',
        status: 'Completed'
      });
      T.store.set('history', h.slice(0, 100));
    }
    const u = T.store.get('usage', {});
    T.store.set('usage', Object.assign(u, {
      tasksCompleted: (u.tasksCompleted || 0) + 1,
      outputsGenerated: (u.outputsGenerated || 0) + 1,
      timeSavedMin: (u.timeSavedMin || 0) + 12
    }));
  }

  function failRun(fe, runBtn){
    generating = false; cancelGen = null; clearTimers();
    runBtn.disabled = false;
    genStatus(null, false);
    setStatus('error', 'Error');
    const out = qs('#ws-output');
    out.classList.remove('generating');
    out.innerHTML =
      '<div style="text-align:center;padding:24px 16px">' +
        '<div style="color:#f43f5e;margin-bottom:10px">' + T.icon('alert','ic-lg') + '</div>' +
        '<h3 style="margin:0 0 6px">' + T.esc(fe.title || 'Something went wrong') + '</h3>' +
        '<p style="color:var(--muted);font-size:14px;margin:0 0 16px">' + T.esc(fe.text || '') + '</p>' +
        '<div class="controls-row" style="justify-content:center">' +
          '<button class="btn btn-sm btn-primary" id="ws-err-retry">TRY AGAIN</button>' +
          '<button class="btn btn-sm" id="ws-err-edit">EDIT INSTRUCTION</button>' +
          '<button class="btn btn-sm btn-ghost" id="ws-err-support">CONTACT SUPPORT</button>' +
        '</div></div>';
    qs('#ws-err-retry').addEventListener('click', () => run());
    qs('#ws-err-edit').addEventListener('click', () => { qs('#ws-input').focus(); qs('#ws-input').select(); });
    qs('#ws-err-support').addEventListener('click', () =>
      T.ui.toast('Support: support@typex.example — include your instruction text', 'info'));
    T.agent.log('Generation failed: ' + (fe.title || 'error'), 'action');
  }

  /* quick transform helpers (shorten / expand / tone / translate / format) */
  function requireOutput(){
    if (!current){ T.ui.toast('Generate output first', 'error'); return false; }
    return true;
  }

  function transform(instruction, styleOverrides, label){
    if (!requireOutput()) return;
    setStatus('working', label || 'Working');
    genStatus('<div class="spinner"></div><span>' + T.esc(label || 'Working') + '…</span>', true);
    T.agent.log(label + '…');
    T.ai.quick(instruction, styleOverrides).then(text => {
      current = text;
      outputText(text);
      updateMeta(text);
      genStatus(null, false);
      setStatus('ready', 'Ready');
      T.agent.log('Output ' + (label || 'updated').toLowerCase());
      T.ui.toast('Done', 'success');
    }).catch(() => {
      genStatus(null, false);
      setStatus('error', 'Error');
      T.ui.toast('That did not work — try again', 'error');
    });
  }

  /* ---------------- edit mode ---------------- */
  function enterEditMode(){
    if (!requireOutput()) return;
    const out = qs('#ws-output');
    const ta = T.el('<textarea class="textarea" rows="8" style="min-height:180px"></textarea>');
    ta.value = current;
    const row = T.el('<div class="controls-row" style="margin-top:10px">' +
      '<button class="btn btn-sm btn-primary" data-x="save">Save</button>' +
      '<button class="btn btn-sm btn-ghost" data-x="cancel">Cancel</button></div>');
    out.innerHTML = '';
    out.appendChild(ta); out.appendChild(row);
    row.querySelector('[data-x="save"]').addEventListener('click', () => {
      current = ta.value;
      outputText(current); updateMeta(current);
      T.ui.toast('Output updated', 'success');
    });
    row.querySelector('[data-x="cancel"]').addEventListener('click', () => outputText(current));
    ta.focus();
  }

  /* ---------------- approve & type ---------------- */
  function approveAndType(){
    if (!requireOutput()) return;
    T.ui.approval({
      title: 'Approve action',
      previewLabel: 'Output to type',
      output: current,
      actionLabel: 'Approve & Type',
      onApprove: () => {
        T.agent.log('Action approved — typing output', 'action');
        setStatus('working', 'Typing…');
        setAgentBadge('running', 'WORKING');
        timers.push(setTimeout(() => {
          const u = T.store.get('usage', {});
          T.store.set('usage', Object.assign(u, {approvedActions: (u.approvedActions || 0) + 1}));
          setStatus('ready', 'Ready');
          setAgentBadge('ready', 'READY');
          T.agent.log('Action completed', 'action');
          T.ui.toast('Output typed (v1 demo). Connect a destination in Connections to type directly into apps.', 'success');
        }, 900));
      },
      onEdit: enterEditMode
    });
  }

  /* ---------------- pick modal (translate / tone / format) ---------------- */
  function pickModal(title, options, currentVal, onPick){
    const body = T.el('<div><div class="label" style="margin-bottom:8px">' + T.esc(title) + '</div>' +
      T.ui.segButtons('ws-pick', options, currentVal) + '</div>');
    let picked = currentVal;
    body.querySelectorAll('.seg-btn').forEach(b =>
      b.addEventListener('click', () => {
        body.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); picked = b.dataset.val;
      }));
    T.ui.modal({
      title,
      body,
      actions: [
        {label:'Cancel', kind:'btn-ghost'},
        {label:'Apply', kind:'btn-primary', onClick:() => onPick(picked)}
      ]
    });
  }

  /* ---------------- save style ---------------- */
  function saveStyle(){
    readStyle();
    const styles = T.store.get('styles', []);
    const body = T.el('<div class="field"><div class="label">Style name</div>' +
      '<input class="input" id="ws-sty-name" placeholder="e.g. My Email Style" style="width:100%"></div>');
    T.ui.modal({
      title: 'Save as my style',
      body,
      actions: [
        {label:'Cancel', kind:'btn-ghost'},
        {label:'Save style', kind:'btn-ai', onClick:() => {
          const name = body.querySelector('#ws-sty-name').value.trim() || 'Untitled Style';
          styles.push({id: T.uid('sty'), name, tone: currentStyle.tone, language: currentStyle.language,
            length: currentStyle.length, format: currentStyle.format, rules: [], active: false});
          T.store.set('styles', styles);
          T.ui.toast('Style saved', 'success');
        }}
      ]
    });
    setTimeout(() => { const i = body.querySelector('#ws-sty-name'); if (i) i.focus(); }, 50);
  }

  /* ---------------- mount ---------------- */
  function mount(root){
    R = root;
    readStyle();
    T.agent.renderInto(qs('#ws-agentlog'));
    setAgentBadge('ready', 'READY');

    /* prefill from sessionStorage */
    try {
      const raw = sessionStorage.getItem('typex_prefill');
      if (raw){
        const p = JSON.parse(raw);
        sessionStorage.removeItem('typex_prefill');
        if (p.instruction){ qs('#ws-input').value = p.instruction; }
        if (p.contextText){ qs('#ws-ctx-text').value = p.contextText; qs('#ws-ctx-textwrap').style.display = ''; refreshCtxPreview(); }
        if (p.style){
          Object.keys({tone:1,language:1,length:1,format:1}).forEach(name => {
            const val = p.style[name];
            if (!val) return;
            T.qsa('[data-seg="' + name + '"] .seg-btn', R).forEach(b =>
              b.classList.toggle('active', b.dataset.val === val));
          });
        }
        readStyle();
      }
    } catch(e){}

    /* ?new=1 clears */
    if (T.route && T.route.query && T.route.query.new === '1'){
      qs('#ws-input').value = '';
      ['#ws-ctx-text','#ws-ctx-add','#ws-ctx-urlin'].forEach(s => { qs(s).value = ''; });
      ['#ws-ctx-textwrap','#ws-ctx-addwrap','#ws-ctx-urlwrap'].forEach(s => { qs(s).style.display = 'none'; });
      outputEmpty(); refreshCtxPreview();
      qs('#ws-meta').style.display = 'none';
      current = null; setStatus('ready', 'Ready');
    }

    /* style segs */
    T.qsa('[data-seg] .seg-btn', R).forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('[data-seg]');
        group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        readStyle();
      });
    });

    /* examples */
    T.qsa('.example', R).forEach(ch =>
      ch.addEventListener('click', () => {
        qs('#ws-input').value = ch.dataset.ex;
        qs('#ws-input').focus();
      }));

    /* Ctrl+Enter */
    qs('#ws-input').addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ e.preventDefault(); run(); }
    });

    qs('#ws-run').addEventListener('click', () => run());
    qs('#ws-clear').addEventListener('click', () => {
      qs('#ws-input').value = '';
      ['#ws-ctx-text','#ws-ctx-add','#ws-ctx-urlin'].forEach(s => { qs(s).value = ''; });
      refreshCtxPreview();
      qs('#ws-input').focus();
    });

    /* context toggles */
    function toggle(wrap){ const w = qs(wrap); w.style.display = w.style.display === 'none' ? '' : 'none'; }
    qs('#ws-ctx-paste').addEventListener('click', () => toggle('#ws-ctx-textwrap'));
    qs('#ws-ctx-field').addEventListener('click', () => toggle('#ws-ctx-addwrap'));
    qs('#ws-ctx-url').addEventListener('click', () => toggle('#ws-ctx-urlwrap'));
    qs('#ws-ctx-file').addEventListener('click', () => qs('#ws-ctx-filein').click());
    qs('#ws-ctx-filein').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const existing = qs('#ws-ctx-text').value;
        qs('#ws-ctx-text').value = (existing ? existing + '\n\n' : '') + '[' + f.name + ']\n' + String(rd.result || '').slice(0, 20000);
        qs('#ws-ctx-textwrap').style.display = '';
        refreshCtxPreview();
        T.ui.toast('Document added to context', 'success');
      };
      rd.readAsText(f);
      e.target.value = '';
    });
    qs('#ws-ctx-sel').addEventListener('click', () => {
      const sel = (window.getSelection ? window.getSelection().toString() : '').trim();
      if (!sel){ T.ui.toast('Select some text on the page first', 'info'); return; }
      const existing = qs('#ws-ctx-text').value;
      qs('#ws-ctx-text').value = (existing ? existing + '\n\n' : '') + sel;
      qs('#ws-ctx-textwrap').style.display = '';
      refreshCtxPreview();
      T.ui.toast('Selection added to context', 'success');
    });
    ['#ws-ctx-text','#ws-ctx-add','#ws-ctx-urlin'].forEach(sel =>
      qs(sel).addEventListener('input', refreshCtxPreview));

    /* output controls */
    qs('#ws-edit').addEventListener('click', enterEditMode);
    qs('#ws-copy').addEventListener('click', async () => {
      if (!requireOutput()) return;
      const ok = await T.copy(current);
      T.ui.toast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'success' : 'error');
    });
    qs('#ws-regen').addEventListener('click', () => { if (requireOutput()) run(); });
    qs('#ws-shorten').addEventListener('click', () =>
      transform('Make this shorter: "' + (current || '').slice(0, 400) + '"', {length:'Short'}, 'Shortening'));
    qs('#ws-expand').addEventListener('click', () =>
      transform('Expand with more detail: "' + (current || '').slice(0, 400) + '"', {length:'Long'}, 'Expanding'));
    qs('#ws-translate').addEventListener('click', () => {
      if (!requireOutput()) return;
      pickModal('Translate output', LANGS, currentStyle.language, lang =>
        transform('Translate this text: "' + current.slice(0, 400) + '"', {language: lang}, 'Translating'));
    });
    qs('#ws-tone').addEventListener('click', () => {
      if (!requireOutput()) return;
      pickModal('Change tone', TONES, currentStyle.tone, tone =>
        transform('Rewrite in a ' + tone + ' tone: "' + current.slice(0, 400) + '"', {tone}, 'Changing tone'));
    });
    qs('#ws-format').addEventListener('click', () => {
      if (!requireOutput()) return;
      pickModal('Format output', FORMATS, currentStyle.format, fmt =>
        transform('Format as ' + fmt + ': "' + current.slice(0, 400) + '"', {format: fmt}, 'Formatting'));
    });

    /* type actions */
    qs('#ws-type').addEventListener('click', approveAndType);
    qs('#ws-approve-type').addEventListener('click', approveAndType);

    /* save style */
    qs('#ws-save-style').addEventListener('click', saveStyle);

    /* top bar: pause / stop / settings */
    qs('#ws-pause').addEventListener('click', () => {
      if (generating){
        if (cancelGen){ cancelGen(); cancelGen = null; }
        generating = false; clearTimers();
        qs('#ws-run').disabled = false;
        T.agent.pause();
        setStatus('paused', 'Paused');
        setAgentBadge('paused', 'PAUSED');
        T.ui.toast('Generation paused');
      } else if (T.agent.state === 'paused'){
        T.agent.resume();
        setStatus('ready', 'Ready');
        setAgentBadge('ready', 'READY');
      }
    });
    qs('#ws-stop').addEventListener('click', () => {
      if (cancelGen){ cancelGen(); cancelGen = null; }
      generating = false; clearTimers();
      qs('#ws-run').disabled = false;
      genStatus(null, false);
      const out = qs('#ws-output');
      out.classList.remove('generating');
      T.agent.stop();
      setStatus('ready', 'Ready');
      setAgentBadge('ready', 'READY');
      if (current){ outputText(current); updateMeta(current); }
      else outputEmpty();
    });
    qs('#ws-settings').addEventListener('click', () => T.router.navigate('#/app/settings'));

    /* agent controls */
    qs('#ws-agent-start').addEventListener('click', () => {
      T.agent.start('Agent started — waiting for instruction');
      setAgentBadge('running', 'WORKING');
      agentBadgeTimer = setTimeout(() => setAgentBadge('ready', 'READY'), 3000);
    });
    qs('#ws-agent-pause').addEventListener('click', () => {
      T.agent.pause();
      setAgentBadge('paused', 'PAUSED');
    });
    qs('#ws-agent-stop').addEventListener('click', () => {
      T.agent.stop();
      setAgentBadge('ready', 'READY');
    });
  }

  /* ---------------- unmount ---------------- */
  function unmount(){
    if (cancelGen){ cancelGen(); cancelGen = null; }
    generating = false;
    clearTimers();
    clearTimeout(agentBadgeTimer);
    R = null;
  }

  T.pages = T.pages || {};
  T.pages['workspace'] = {
    title: 'Workspace',
    render,
    mount,
    unmount
  };
})();
