/* TYPE X — Settings page.
   Account, AI preferences, toggles, keyboard, connections,
   security and a danger zone. All reads/writes go through
   T.store (keys: 'settings' -> typex_settings, 'user' -> typex_user). */
(function(){
  const T = window.TypeX;

  /* ---------- option lists ---------- */
  const TONES   = ['Professional','Friendly','Casual','Formal','Persuasive','Confident','Funny','Simple','Technical'];
  const LANGS   = ['English','Urdu','Roman Urdu','Hindi','Arabic','Spanish','French','German'];
  const LENGTHS = ['Short','Medium','Long'];
  const FORMATS = ['Plain Text','Paragraphs','Bullets','Numbered List','Email','Social Media'];

  /* seg group name -> settings key */
  const SEG_KEYS = {
    'set-tone': 'defaultTone',
    'set-lang': 'defaultLanguage',
    'set-length': 'defaultLength',
    'set-format': 'defaultFormat'
  };

  /* ---------- state helpers ---------- */
  function getSettings(){
    return Object.assign({}, T.DEFAULT_SETTINGS, T.store.get('settings') || {});
  }
  function getUser(){
    return T.store.get('user') || { name:'', email:'', plan:'Free', createdAt:new Date().toISOString() };
  }
  function save(patch){
    T.store.set('settings', Object.assign(getSettings(), patch));
  }

  /* ---------- small html builders ---------- */
  function toggleRow(key, title, desc, on){
    return '<div class="set-row"><div><div class="t">' + T.esc(title) + '</div>' +
      '<div class="d">' + T.esc(desc) + '</div></div>' +
      '<label class="toggle" aria-label="' + T.esc(title) + '">' +
      '<input type="checkbox" data-setting="' + key + '"' + (on ? ' checked' : '') + '>' +
      '<span class="tk"></span></label></div>';
  }

  function segField(label, hint, segName, options, current){
    return '<div class="field"><label class="label">' + T.esc(label) + '</label>' +
      T.ui.segButtons(segName, options, current) +
      (hint ? '<div class="hint">' + T.esc(hint) + '</div>' : '') + '</div>';
  }

  function card(title, iconName, inner){
    return '<div class="card card-pad"><h3 style="display:flex;align-items:center;gap:10px;margin:0 0 16px">' +
      T.icon(iconName, 'ic-md') + '<span>' + T.esc(title) + '</span></h3>' + inner + '</div>';
  }

  /* ---------- page ---------- */
  T.pages['settings'] = {
    title: 'Settings',

    render(){
      const s = getSettings();
      const u = getUser();

      const accountInner =
        '<div class="field"><label class="label">Name</label>' +
        '<input id="set-name" class="input" type="text" value="' + T.esc(u.name || '') + '" placeholder="Your name"></div>' +
        '<div class="field"><label class="label">Email</label>' +
        '<input id="set-email" class="input" type="email" value="' + T.esc(u.email || '') + '" placeholder="you@example.com"></div>' +
        '<div class="set-row"><div><div class="t">Plan</div>' +
        '<div class="d">Your current TYPE X plan.</div></div>' +
        '<span class="badge">Free plan</span></div>' +
        '<div style="margin-top:14px"><button class="btn btn-ai btn-sm" id="set-save-account">Save account</button></div>';

      const providerOptions =
        '<option value="local"' + (s.provider === 'local' ? ' selected' : '') + '>Type X Local Engine (v1 demo)</option>' +
        '<option value="cloud" disabled>Type X Cloud — Phase 2 (not connected)</option>';

      const aiInner =
        '<div class="field"><label class="label">AI provider</label>' +
        '<select id="set-provider" class="select">' + providerOptions + '</select>' +
        '<div class="hint">The local engine runs fully on your device. Cloud providers arrive in Phase 2.</div></div>' +
        segField('Default tone', 'How TYPE X sounds when it writes for you.', 'set-tone', TONES, s.defaultTone) +
        segField('Default language', 'Which language TYPE X answers in by default.', 'set-lang', LANGS, s.defaultLanguage) +
        segField('Default length', 'How long generated outputs should be.', 'set-length', LENGTHS, s.defaultLength) +
        segField('Default format', 'How outputs are structured.', 'set-format', FORMATS, s.defaultFormat);

      const togglesInner =
        toggleRow('rememberStyle', 'Remember My Writing Style',
          'TYPE X keeps your saved styles ready in the Workspace.', s.rememberStyle) +
        toggleRow('previewBeforeAction', 'Preview Before Action',
          'Always show the output before typing or sending.', s.previewBeforeAction) +
        toggleRow('requireApproval', 'Require Approval For External Actions',
          'Nothing leaves TYPE X without your approval.', s.requireApproval) +
        toggleRow('saveHistory', 'Save Task History',
          'Keep a log of tasks in History.', s.saveHistory) +
        toggleRow('showIntro', 'Show Cinematic Intro',
          'Play the 3D intro on launch.', s.showIntro) +
        toggleRow('notifications', 'Notifications',
          'Product updates and follow-up reminders.', s.notifications);

      const keyboardInner =
        '<div class="set-row"><div><div class="t"><span class="kbd">Ctrl</span> + <span class="kbd">Enter</span></div>' +
        '<div class="d">Run TYPE X on the current task.</div></div></div>' +
        '<div class="set-row"><div><div class="t"><span class="kbd">Esc</span></div>' +
        '<div class="d">Close open dialogs.</div></div></div>' +
        '<p class="hint" style="margin:12px 0 0">TYPE X is keyboard-first. No microphone, no voice features — by design.</p>';

      const connectionsInner =
        '<div class="set-row"><div><div class="t">Connected platforms</div>' +
        '<div class="d">Where TYPE X can type or send with your approval.</div></div>' +
        '<a class="btn btn-ghost btn-sm" href="#/app/connections">Manage connections</a></div>';

      const securityInner =
        '<div class="set-row"><div><div class="t">Password</div>' +
        '<div class="d">Keep your account secure.</div></div>' +
        '<button class="btn btn-ghost btn-sm" id="set-change-pw">Change password</button></div>' +
        '<div class="set-row"><div><div class="t">Active sessions</div>' +
        '<div class="d">This browser — current.</div></div></div>' +
        '<div class="set-row"><div><div class="t">Security &amp; Privacy</div>' +
        '<div class="d">How TYPE X protects your data.</div></div>' +
        '<a class="btn btn-ghost btn-sm" href="#/security">Security &amp; Privacy</a></div>';

      const dangerInner =
        '<div class="set-row"><div><div class="t">Clear task history</div>' +
        '<div class="d">Removes all entries from History. This cannot be undone.</div></div>' +
        '<button class="btn btn-danger btn-sm" id="set-clear-history">Clear task history</button></div>' +
        '<div class="set-row"><div><div class="t">Delete account</div>' +
        '<div class="d">Wipes all local TYPE X data and returns to the start.</div></div>' +
        '<button class="btn btn-danger btn-sm" id="set-delete-account">Delete account</button></div>';

      return T.ui.pageHead('Settings', 'Make TYPE X yours.', null) +
        '<div style="display:grid;gap:16px;max-width:760px">' +
        card('Account', 'user', accountInner) +
        card('AI Preferences', 'cpu', aiInner) +
        card('Behavior', 'gear', togglesInner) +
        card('Keyboard', 'keyboard', keyboardInner) +
        card('Connected Platforms', 'plug', connectionsInner) +
        card('Security & Privacy', 'shield', securityInner) +
        '<div class="card card-pad" style="border-color:rgba(239,68,68,.4)">' +
        '<h3 style="display:flex;align-items:center;gap:10px;margin:0 0 16px;color:#f87171">' +
        T.icon('alert', 'ic-md') + '<span>Danger Zone</span></h3>' + dangerInner + '</div>' +
        '</div>';
    },

    mount(root){
      /* ----- account ----- */
      const nameEl = T.qs('#set-name', root), emailEl = T.qs('#set-email', root);
      T.qs('#set-save-account', root).addEventListener('click', () => {
        const u = getUser();
        u.name = (nameEl.value || '').trim();
        u.email = (emailEl.value || '').trim();
        T.store.set('user', u);
        T.ui.toast('Account updated.');
      });

      /* ----- provider select ----- */
      T.qs('#set-provider', root).addEventListener('change', e => {
        save({ provider: e.target.value });
        T.ui.toast('Provider updated.');
      });

      /* ----- toggles (delegated) ----- */
      root.addEventListener('change', e => {
        const input = e.target.closest ? e.target.closest('input[data-setting]') : null;
        if (!input) return;
        save({ [input.dataset.setting]: !!input.checked });
      });

      /* ----- seg groups (delegated) ----- */
      root.addEventListener('click', e => {
        const btn = e.target.closest ? e.target.closest('.seg-btn') : null;
        if (!btn) return;
        const seg = btn.closest('.seg');
        if (!seg || !SEG_KEYS[seg.dataset.seg]) return;
        T.qsa('.seg-btn', seg).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        save({ [SEG_KEYS[seg.dataset.seg]]: btn.dataset.val });
      });

      /* ----- security ----- */
      T.qs('#set-change-pw', root).addEventListener('click', () => {
        T.ui.toast('Password changes are handled by real auth in Phase 2.', 'info');
      });

      /* ----- danger: clear history ----- */
      T.qs('#set-clear-history', root).addEventListener('click', () => {
        T.ui.confirm({
          title: 'Clear task history',
          message: 'This will remove every entry from History. This cannot be undone.',
          okLabel: 'Clear history',
          danger: true
        }).then(ok => {
          if (!ok) return;
          T.store.set('history', []);
          T.ui.toast('Task history cleared.');
        });
      });

      /* ----- danger: delete account (typed confirm) ----- */
      T.qs('#set-delete-account', root).addEventListener('click', () => {
        const close = T.ui.modal({
          title: 'Delete account',
          body: '<p style="color:var(--muted);font-size:14px;margin:0 0 12px">' +
            'This wipes all local TYPE X data — settings, styles, templates, history. ' +
            'Type <strong>DELETE</strong> below to confirm.</p>' +
            '<div class="field"><label class="label">Type DELETE to confirm</label>' +
            '<input id="del-type" class="input" placeholder="DELETE" autocomplete="off"></div>',
          actions: [
            { label: 'Cancel', kind: 'btn-ghost', close: false, onClick: () => close() },
            { label: 'Delete everything', kind: 'btn-danger', close: false, onClick: () => {
              const v = ((document.getElementById('del-type') || {}).value || '').trim();
              if (v !== 'DELETE'){ T.ui.toast('Type DELETE to confirm.', 'error'); return; }
              close();
              T.store.clearAll();
              location.hash = '#/';
            } }
          ]
        });
      });
    },

    unmount(){}
  };
})();
