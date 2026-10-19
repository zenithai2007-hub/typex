/* TYPE X — Automations page.
   If this, then TYPE X. Automations never act silently:
   APPROVAL is on by default and every run is logged. */
(function(){
  const T = window.TypeX;

  const TRIGGERS = [
    'New relevant message detected',
    'New lead added',
    'Scheduled time',
    'Manual'
  ];

  const ACTIONS = [
    'Type / send where supported',
    'Draft only',
    'Notify me'
  ];

  const STEP_META = {
    trigger:   { cls:'f-trigger',   icon:'bolt' },
    condition: { cls:'f-condition', icon:'filter' },
    ai:        { cls:'f-ai',        icon:'spark' },
    output:    { cls:'f-output',    icon:'output' },
    approval:  { cls:'f-approval',  icon:'shield' },
    action:    { cls:'f-action',     icon:'send' }
  };

  const SUGGESTED = [
    { name:'Lead follow-up nudge',
      trigger:'Scheduled time',
      condition:'Lead status is Follow-up and next follow-up is today.',
      action:'Draft only' },
    { name:'New lead welcome draft',
      trigger:'New lead added',
      condition:'Lead has context and has not been contacted before.',
      action:'Draft only' },
    { name:'Relevant message responder',
      trigger:'New relevant message detected',
      condition:'Message is relevant, non-spam, and the sender has consented.',
      action:'Notify me' }
  ];

  function buildSteps(trigger, condition, action){
    return [
      { type:'trigger',   title:'TRIGGER',  desc: trigger },
      { type:'condition', title:'CONDITION', desc: condition },
      { type:'ai',        title:'AI ANALYSIS', desc:'Analyze with TYPE X' },
      { type:'output',    title:'OUTPUT',   desc:'Generate personalized output' },
      { type:'approval',  title:'APPROVAL', desc:'Require approval (recommended ON)' },
      { type:'action',    title:'ACTION',   desc: action }
    ];
  }

  function getAutos(){ return T.store.get('automations') || []; }
  function saveAutos(a){ T.store.set('automations', a); }
  function getRuns(){ return T.store.get('automation_runs') || []; }
  function saveRuns(r){ T.store.set('automation_runs', r); }

  function logRun(autoId, name, result){
    const runs = getRuns();
    runs.unshift({ id:T.uid('run'), autoId:autoId, name:name, at:Date.now(), result:result });
    saveRuns(runs.slice(0, 50));
    if (T.agent && T.agent.log) T.agent.log('Automation "' + name + '" run: ' + result, 'auto');
  }

  let root = null;

  function flowHtml(steps){
    return '<div class="flow">' + steps.map((s, i) => {
      const m = STEP_META[s.type] || STEP_META.action;
      const node = '<div class="flow-node ' + m.cls + '">' +
        '<div class="fi">' + T.icon(m.icon) + '</div>' +
        '<div class="fn-body"><div class="fn-title">' + T.esc(s.title) + '</div>' +
        '<div class="fn-desc">' + T.esc(s.desc) + '</div></div></div>';
      const arrow = i < steps.length - 1
        ? '<div class="flow-arrow">' + T.icon('chev-d') + '</div>' : '';
      return node + arrow;
    }).join('') + '</div>';
  }

  function cardHtml(a){
    return '<div class="card card-pad" data-auto="' + T.esc(a.id) + '">' +
      '<div class="auto-head">' +
        '<h3>' + T.esc(a.name) + '</h3>' +
        '<div class="auto-ctl">' +
          '<label class="toggle" title="Enabled"><input type="checkbox" data-toggle="' + T.esc(a.id) + '"' +
            (a.enabled ? ' checked' : '') + '><span class="toggle-ui"></span></label>' +
          '<button class="btn btn-ai btn-sm" data-run="' + T.esc(a.id) + '">' +
            T.icon('play') + '<span>Run</span></button>' +
          '<button class="btn btn-icon btn-danger" data-del="' + T.esc(a.id) + '" title="Delete">' +
            T.icon('trash') + '</button>' +
        '</div>' +
      '</div>' +
      flowHtml(a.steps || []) +
    '</div>';
  }

  function listHtml(){
    const autos = getAutos();
    if (!autos.length){
      return T.ui.emptyState({
        icon:'bolt', title:'No automations yet',
        text:'Build one to turn a repeatable pattern into a supervised flow: TYPE X drafts and proposes, you approve.',
        actionLabel:'+ New Automation', onAction: newAutomationModal
      });
    }
    return autos.map(cardHtml).join('');
  }

  function newAutomationModal(){
    const trigOpts = TRIGGERS.map(t => '<option value="' + T.esc(t) + '">' + T.esc(t) + '</option>').join('');
    const actOpts = ACTIONS.map(t => '<option value="' + T.esc(t) + '">' + T.esc(t) + '</option>').join('');
    const body = T.el(
      '<div>' +
      '<div class="field"><div class="label">Name</div>' +
      '<input class="input" id="na-name" placeholder="e.g. Reply to new leads"></div>' +
      '<div class="field"><div class="label">Trigger</div>' +
      '<select class="select" id="na-trigger">' + trigOpts + '</select></div>' +
      '<div class="field"><div class="label">Condition</div>' +
      '<input class="input" id="na-condition" placeholder="e.g. lead is relevant and consented">' +
      '<div class="hint">Leave empty for the default: relevance and consent check.</div></div>' +
      '<div class="field"><div class="label">Action</div>' +
      '<select class="select" id="na-action">' + actOpts + '</select>' +
      '<div class="hint">The approval step stays on — TYPE X never acts silently.</div></div>' +
      '</div>'
    );
    T.ui.modal({
      title:'New Automation',
      body: body,
      actions:[
        { label:'Cancel', kind:'ghost', close:true },
        { label:'Create', kind:'ai', onClick:() => {
            const name = T.qs('#na-name', body).value.trim();
            if (!name){ T.ui.toast('Give the automation a name.', 'error'); return; }
            const trigger = T.qs('#na-trigger', body).value;
            const condition = T.qs('#na-condition', body).value.trim() || 'Only run when the message is relevant and the contact has consented.';
            const action = T.qs('#na-action', body).value;
            const auto = { id: T.uid('auto'), name: name, enabled: true,
                           steps: buildSteps(trigger, condition, action),
                           createdAt: Date.now() };
            saveAutos(getAutos().concat([auto]));
            paint();
            T.ui.toast('Automation created — approval step on.', 'success');
        }, close:true }
      ]
    });
  }

  function suggestedHtml(){
    return '<div class="card card-pad"><div class="label">Suggested automations</div>' +
      '<p class="intro-text">One-click starting points. Every template ships with the approval step on.</p>' +
      '<div class="btn-row">' + SUGGESTED.map((s, i) =>
        '<button class="btn btn-ghost btn-sm" data-install="' + i + '">' +
        T.icon('plus') + '<span>' + T.esc(s.name) + '</span></button>'
      ).join('') + '</div></div>';
  }

  function historyHtml(){
    const runs = getRuns();
    if (!runs.length){
      return '<div class="card card-pad"><div class="label">Run history</div>' +
        '<p class="intro-text">No runs yet. Press Run on any automation — it prepares output and waits for your approval, and every run is recorded here and in the agent activity log.</p></div>';
    }
    const rows = runs.map(r =>
      '<tr><td><strong>' + T.esc(r.name) + '</strong></td>' +
      '<td>' + T.esc(r.result) + '</td>' +
      '<td>' + T.timeAgo(r.at) + '</td></tr>'
    ).join('');
    return '<div class="card card-pad"><div class="label">Run history</div>' +
      '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Automation</th><th>Result</th><th>When</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';
  }

  function paint(){
    if (!root) return;
    T.qs('[data-ax="list"]', root).innerHTML = listHtml();
    T.qs('[data-ax="suggested"]', root).innerHTML = suggestedHtml();
    T.qs('[data-ax="history"]', root).innerHTML = historyHtml();

    T.qsa('[data-install]', root).forEach(b =>
      b.addEventListener('click', () => {
        const s = SUGGESTED[+b.getAttribute('data-install')];
        const auto = { id: T.uid('auto'), name: s.name, enabled: true,
                       steps: buildSteps(s.trigger, s.condition, s.action),
                       createdAt: Date.now() };
        saveAutos(getAutos().concat([auto]));
        paint();
        T.ui.toast('"' + s.name + '" added — approval step on.', 'success');
      })
    );

    T.qsa('[data-run]', root).forEach(b =>
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-run');
        const a = getAutos().find(x => x.id === id);
        if (!a) return;
        if (!a.enabled){ T.ui.toast('Enable the automation first.', 'info'); return; }
        const ok = await T.ui.confirm({
          title:'Run "' + a.name + '"?',
          message:'The automation will analyze and prepare output, then wait for your approval before any action.',
          okLabel:'Run'
        });
        if (!ok) return;
        logRun(a.id, a.name, 'Draft prepared — awaiting your approval');
        paint();
        T.ui.toast('Run complete: draft prepared, approval pending.', 'success');
      })
    );

    T.qsa('[data-toggle]', root).forEach(t =>
      t.addEventListener('change', () => {
        const id = t.getAttribute('data-toggle');
        const autos = getAutos();
        const a = autos.find(x => x.id === id);
        if (a){ a.enabled = t.checked; saveAutos(autos); }
        T.ui.toast(a.enabled ? 'Automation enabled.' : 'Automation paused.', 'info');
      })
    );

    T.qsa('[data-del]', root).forEach(b =>
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-del');
        const a = getAutos().find(x => x.id === id);
        const ok = await T.ui.confirm({
          title:'Delete automation?',
          message:'Remove "' + (a ? a.name : 'this automation') + '" and its flow.',
          okLabel:'Delete', danger:true
        });
        if (!ok) return;
        saveAutos(getAutos().filter(x => x.id !== id));
        paint();
        T.ui.toast('Automation deleted.', 'info');
      })
    );
  }

  T.pages['automations'] = {
    title:'Automations',
    render(){
      return T.ui.pageHead('Automations', 'If this, then TYPE X.',
        '<button class="btn btn-ai btn-sm" id="ax-new">' + T.icon('plus') +
        '<span>New Automation</span></button>') +
        '<div class="card card-pad">' +
          '<p class="intro-text">Automations never act silently: the APPROVAL step is on by default ' +
          'and every run is logged in the agent activity log.</p>' +
        '</div>' +
        '<div data-ax="suggested"></div>' +
        '<div data-ax="list"></div>' +
        '<div data-ax="history"></div>';
    },
    mount(r){
      root = r;
      T.qs('#ax-new', r).addEventListener('click', newAutomationModal);
      paint();
    },
    unmount(){ root = null; }
  };
})();
