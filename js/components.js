/* CLINT X — shared UI components: modal, toast, approval, agent log, misc.
   Contract for page modules:
   TypeX.ui.toast(msg, type)                 // type: 'success' | 'error' | 'info'
   TypeX.ui.modal({title, body, actions:[{label,kind,onClick,close}], wide}) -> close()
   TypeX.ui.confirm({title, message, okLabel, danger}) -> Promise<boolean>
   TypeX.ui.emptyState({icon,title,text,actionLabel,onAction}) -> html string
   TypeX.ui.statCard({label,value,icon,accent}) -> html string
   TypeX.ui.pageHead(title, sub, actionsHtml) -> html string
   TypeX.ui.approval({title, previewLabel, output, actionLabel, onApprove, onEdit})
        -> if settings.requireApproval is OFF, calls onApprove() immediately.
   TypeX.agent = { state, events, log(msg, kind), clear(), pause(), resume(), stop(), renderInto(el) }
*/
(function(){
  const T = window.TypeX;

  /* ---------- toast ---------- */
  function toast(msg, type){
    const root = document.getElementById('toast-root');
    const t = T.el('<div class="toast ' + (type||'') + '">' +
      T.icon(type==='error'?'alert':type==='success'?'check':'info') +
      '<span>' + T.esc(msg) + '</span></div>');
    root.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(), 320); }, 2600);
  }

  /* ---------- modal ---------- */
  function modal(opts){
    const root = document.getElementById('modal-root');
    const bd = T.el('<div class="modal-backdrop"><div class="modal card' +
      (opts.wide ? '" style="max-width:760px' : '') + '">' +
      '<div class="modal-head"><h3>' + T.esc(opts.title||'') + '</h3>' +
      '<button class="btn btn-icon btn-ghost" data-x="close">' + T.icon('x-close') + '</button></div>' +
      '<div class="modal-body"></div><div class="modal-foot"></div></div></div>');
    const body = bd.querySelector('.modal-body'), foot = bd.querySelector('.modal-foot');
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    function close(){ bd.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e){ if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    bd.querySelector('[data-x="close"]').addEventListener('click', close);
    bd.addEventListener('mousedown', e => { if (e.target === bd) close(); });
    (opts.actions || []).forEach(a => {
      const b = T.el('<button class="btn ' + (a.kind||'') + '">' + T.esc(a.label) + '</button>');
      b.addEventListener('click', () => { if (a.close !== false) close(); if (a.onClick) a.onClick(); });
      foot.appendChild(b);
    });
    root.appendChild(bd);
    return close;
  }

  function confirm(opts){
    return new Promise(resolve => {
      modal({
        title: opts.title || 'Are you sure?',
        body: '<p style="color:var(--muted);font-size:14px">' + T.esc(opts.message||'') + '</p>',
        actions: [
          {label:'Cancel', kind:'btn-ghost', onClick:()=>resolve(false)},
          {label: opts.okLabel || 'Confirm', kind: opts.danger ? 'btn-danger' : 'btn-primary', onClick:()=>resolve(true)}
        ]
      });
    });
  }

  /* ---------- misc ---------- */
  function emptyState(o){
    return '<div class="empty"><div class="empty-icon">' + T.icon(o.icon||'spark','ic-lg') +
      '</div><h3>' + T.esc(o.title) + '</h3><p>' + T.esc(o.text) + '</p>' +
      (o.actionLabel ? '<button class="btn btn-ai" data-empty-action>' + T.esc(o.actionLabel) + '</button>' : '') + '</div>';
  }
  function statCard(o){
    return '<div class="card stat-card"><div class="stat-ic ' + (o.accent||'p') + '">' + T.icon(o.icon||'chart') +
      '</div><div><div class="v">' + T.esc(String(o.value)) + '</div><div class="l">' + T.esc(o.label) + '</div></div></div>';
  }
  function pageHead(title, sub, actionsHtml){
    return '<div class="page-head"><div><h1>' + T.esc(title) + '</h1>' +
      (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      (actionsHtml ? '<div class="page-actions">' + actionsHtml + '</div>' : '') + '</div>';
  }
  function segButtons(name, options, current, extra){
    return '<div class="seg" data-seg="' + name + '">' + options.map(o =>
      '<button class="seg-btn' + (o===current?' active':'') + (extra||'') + '" data-val="' + T.esc(o) + '">' + T.esc(o) + '</button>'
    ).join('') + '</div>';
  }

  /* ---------- approval modal ---------- */
  function approval(o){
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    if (!s.requireApproval){ o.onApprove(); return; }
    const body = T.el('<div>' +
      '<p style="color:var(--muted);font-size:14px;margin-bottom:12px">' +
      T.icon('shield','ic-sm') + ' <b style="color:var(--text)">Clint X prepared this action.</b> Review it before anything happens.</p>' +
      '<div class="label">' + T.esc(o.previewLabel || 'Action preview') + '</div>' +
      '<div class="output-body" style="min-height:120px;max-height:300px;overflow:auto">' + T.esc(o.output||'') + '</div>' +
      '<p class="hint" style="margin-top:10px">Nothing is sent or typed until you approve. You can edit first, or cancel.</p></div>');
    modal({
      title: o.title || 'Approve action',
      body: body,
      actions: [
        {label:'Cancel', kind:'btn-ghost'},
        {label:'Edit', kind:'', onClick:()=>{ if(o.onEdit) o.onEdit(); }},
        {label: o.actionLabel || 'Approve & Type', kind:'btn-primary', onClick:()=>{ if(o.onApprove) o.onApprove(); }}
      ]
    });
  }

  /* ---------- agent (activity log + state) ---------- */
  const agent = {
    state: 'idle', events: [], _targets: [],
    log(msg, kind){
      this.events.push({t: Date.now(), msg, kind: kind || 'ai'});
      if (this.events.length > 200) this.events.shift();
      this._paint();
    },
    clear(){ this.events = []; this._paint(); },
    pause(){ if (this.state==='running'){ this.state='paused'; this.log('Paused by user','action'); } },
    resume(){ if (this.state==='paused'){ this.state='running'; this.log('Resumed','action'); } },
    stop(){ if (this.state!=='idle'){ this.state='idle'; this.log('Stopped by user','action'); } this._paint(); },
    start(label){ this.state='running'; this.log(label || 'Instruction received'); },
    renderInto(el){ if (el && this._targets.indexOf(el) < 0) this._targets.push(el); this._paint(); },
    _paint(){
      const html = this.events.length
        ? this.events.slice().reverse().map(e =>
            '<div class="log-row"><span class="log-time">' + T.fmtTime(e.t) + '</span>' +
            '<span class="log-dot' + (e.kind==='action'?' o':'') + '"></span><span>' + T.esc(e.msg) + '</span></div>').join('')
        : '<div style="color:var(--muted2);font-size:13px;padding:8px 0">No activity yet. Run a task and watch CLINT X work here.</div>';
      this._targets = this._targets.filter(el => el.isConnected);
      this._targets.forEach(el => { el.innerHTML = html; });
    }
  };

  T.ui = { toast, modal, confirm, emptyState, statCard, pageHead, segButtons, approval };
  T.agent = agent;
})();
