/* TYPE X — Help page.
   FAQ accordion, keyboard shortcuts, and a support contact card.
   Static content only; the support form is a v1-demo modal.
   New FAQ entries go in the FAQS array below — keep answers short,
   factual, and free of invented features (v1 = local only). */
(function(){
  const T = window.TypeX;

  /* ---------- FAQ data (concise, no lorem) ----------
     New FAQ entries go in the FAQS array below — keep answers short,
     factual, and free of invented features (v1 = local only). */
  const FAQS = [
    ['What is TYPE X?',
     'A universal AI typing and execution agent: you describe the task with your keyboard, ' +
     'TYPE X understands it, generates the output in your style, and — with your approval — ' +
     'helps place it where it needs to go.'],
    ['How is this different from a chatbot?',
     'Chatbots optimize for conversation. TYPE X optimizes for output: the workspace is built ' +
     'around the result, with edit, copy, and type actions front and center.'],
    ['What does approval do?',
     'With "Require Approval Before External Actions" on, nothing is typed or sent until you ' +
     'review and approve it. You always see the output first.'],
    ['What is Assisted Mode?',
     'For platforms that restrict automation, TYPE X prepares everything and you ' +
     'confirm or complete the final step. No rules are bypassed.'],
    ['Which languages are supported?',
     'English, Urdu, and Roman Urdu are fully supported in v1, with more languages coming in Phase 2.'],
    ['Is there voice input?',
     'No — TYPE X is keyboard-first by design. There is no microphone or voice input.'],
    ['Can I use TYPE X on another device?',
     'v1 keeps everything in this browser, so your data does not carry over. ' +
     'Phase 2 adds cloud sync and real auth.'],
    ['What is real in v1 vs Phase 2?',
     'v1 is the full UI with a local AI engine and local storage — everything you see works ' +
     'on this device. Phase 2 adds cloud AI, real auth, a database, and real platform connections.']
  ];

  /* ---------- small html builders ---------- */
  function card(title, iconName, inner){
    return '<div class="card card-pad"><h3 style="display:flex;align-items:center;gap:10px;margin:0 0 16px">' +
      T.icon(iconName, 'ic-md') + '<span>' + T.esc(title) + '</span></h3>' + inner + '</div>';
  }

  function faqItem(q, a){
    return '<details class="faq"><summary>' + T.esc(q) + '</summary>' +
      '<div class="faq-body">' + T.esc(a) + '</div></details>';
  }

  function shortcutRow(keys, desc){
    const keysHtml = keys.map(k => '<span class="kbd">' + T.esc(k) + '</span>').join(' + ');
    return '<div class="set-row"><div><div class="t">' + keysHtml + '</div>' +
      '<div class="d">' + T.esc(desc) + '</div></div></div>';
  }

  function stepRow(n, title, desc){
    return '<div class="set-row"><div><div class="t">' + T.esc(n + '. ' + title) + '</div>' +
      '<div class="d">' + T.esc(desc) + '</div></div></div>';
  }

  function issueRow(problem, fix){
    return '<div class="set-row"><div><div class="t">' + T.esc(problem) + '</div>' +
      '<div class="d">' + T.esc(fix) + '</div></div></div>';
  }

  function linkRow(title, desc, href){
    return '<div class="set-row"><div><div class="t">' + T.esc(title) + '</div>' +
      '<div class="d">' + T.esc(desc) + '</div></div>' +
      '<a class="btn btn-ghost btn-sm" href="' + href + '">' + T.icon('arrow-r', 'ic-sm') + '</a></div>';
  }

  /* ---------- page ---------- */
  T.pages['help'] = {
    title: 'Help',

    render(){
      const faqInner = FAQS.map(f => faqItem(f[0], f[1])).join('') +
        '<div class="set-row"><div><div class="t">Was this helpful?</div>' +
        '<div class="d">Your answer stays on this device.</div></div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn btn-ghost btn-sm" id="faq-yes">Yes</button>' +
        '<button class="btn btn-ghost btn-sm" id="faq-no">Not really</button></div></div>';

      /* Getting started: the core TYPE X loop in four steps. */
      const startInner =
        stepRow(1, 'Describe the task',
          'Type what you want in the Workspace input — a draft, a rewrite, a reply, an outreach note.') +
        stepRow(2, 'Pick your style',
          'Apply a saved writing style, a template, or the defaults from Settings to shape the output.') +
        stepRow(3, 'Review the output',
          'TYPE X generates the result front and center. Edit, regenerate, copy, or shorten it right there.') +
        stepRow(4, 'Approve and place it',
          'With approval on, nothing is typed or sent until you approve. Assisted Mode prepares ' +
          'the rest for restricted platforms.') +
        stepRow(5, 'Find it later in History',
          'Every completed task is logged with its output, so you can reuse or re-run anything.') +
        stepRow(6, 'Automate the repeats',
          'Tasks you run often can become Automations — TYPE X handles them on your schedule, ' +
          'still under your approval rules.') +
        '<p class="hint" style="margin:12px 0 0">Tip: ' +
        'set your default tone, language, and length in Settings so most tasks need zero tweaks.</p>';

      const keysInner =
        '<p style="color:var(--muted);font-size:13px;margin:0 0 6px">Two shortcuts run the ' +
        'whole app. Everything else is a button or a typed instruction.</p>' +
        shortcutRow(['Ctrl', 'Enter'], 'Run TYPE X on the current task.') +
        shortcutRow(['Esc'], 'Close the open dialog.') +
        '<p class="hint" style="margin:12px 0 0">TYPE X is keyboard-first. No microphone, ' +
        'no voice features — by design.</p>';

      const supportInner =
        '<p style="color:var(--muted);font-size:14px;margin:0 0 14px">Something broken? ' +
        'Write to ' + T.esc('support@typex.example') + ' — or use the button below ' +
        'and your message is noted for the team.</p>' +
        '<button class="btn btn-ai btn-sm" id="help-contact">Contact Support</button>';

      /* Quick links to the places new users ask about most. */
      const resourcesInner =
        linkRow('Workspace', 'Where tasks are described and outputs are made.', '#/app') +
        linkRow('Templates', 'Ready-made starting points for common tasks.', '#/app/templates') +
        linkRow('Styles', 'Your saved writing styles.', '#/app/styles') +
        linkRow('Settings', 'Defaults, behavior, and preferences.', '#/app/settings');

      /* Common v1 gotchas and their fixes. */
      const troubleInner =
        '<p style="color:var(--muted);font-size:13px;margin:0 0 6px">Quick fixes before ' +
        'writing to support — most issues are one toggle away.</p>' +
        issueRow('Output is in the wrong language or tone',
          'Check your default language and tone in Settings — they apply to every new task.') +
        issueRow('Nothing is being typed or sent',
          'Approval is likely on. Review the pending approval dialog, or turn off ' +
          '"Require Approval For External Actions" in Settings if you want automatic actions.') +
        issueRow('I approved something by mistake',
          'Check History to see what was done. External actions cannot be unsent in v1, ' +
          'so keep approval on to stay in control.') +
        issueRow('My templates or history disappeared',
          'v1 stores everything in this browser. Clearing site data wipes it — ' +
          'Phase 2 adds cloud sync.') +
        issueRow('The intro does not play on launch',
          'Enable "Show Cinematic Intro" in Settings. It also plays only after your first visit.') +
        issueRow('Shortcuts do nothing',
          'Click inside the page first so the app has keyboard focus — shortcuts only work ' +
          'while the TYPE X window is active.') +
        issueRow('Support message did not seem to send',
          'In the v1 demo your message is only noted locally; write directly to ' +
          'support@typex.example for a real reply.');

      /* Privacy in one place — v1 keeps everything on this device. */
      const privacyInner =
        '<p style="color:var(--muted);font-size:14px;margin:0">In v1, your settings, styles, ' +
        'templates, history, and tasks never leave this browser — there is no account, no ' +
        'server, and no tracking. Deleting your browser data for this site removes everything. ' +
        'Real auth, encryption, and cloud backup arrive with Phase 2.</p>' +
        '<p style="margin:12px 0 0"><a class="btn btn-ghost btn-sm" href="#/security">' +
        'Security &amp; Privacy</a></p>';

      return T.ui.pageHead('Help', 'Answers, shortcuts, and support.', null) +
        '<div class="help-grid" style="display:grid;gap:16px;max-width:760px">' +
        card('Getting Started', 'play', startInner) +
        card('Frequently Asked Questions', 'info', '<div class="faq-list">' + faqInner + '</div>') +
        card('Keyboard Shortcuts', 'keyboard', keysInner) +
        card('Troubleshooting', 'wand', troubleInner) +
        card('Your Privacy', 'shield', privacyInner) +
        card('Resources', 'globe', resourcesInner) +
        card('Contact Support', 'mail', supportInner) +
        '</div>';
    },

    mount(root){
      /* ----- FAQ feedback: toast only, nothing is sent anywhere in v1 ----- */
      const yes = T.qs('#faq-yes', root), no = T.qs('#faq-no', root);
      if (yes) yes.addEventListener('click', () => T.ui.toast('Glad this helped.'));
      if (no) no.addEventListener('click', () =>
        T.ui.toast('Thanks — tell us what is missing via Contact Support below.', 'info'));

      /* ----- support modal (v1 demo):
             the "close: false" pattern keeps the modal open until we read the
             textarea value ourselves, then close() and toast. ----- */
      T.qs('#help-contact', root).addEventListener('click', () => {
        const close = T.ui.modal({
          title: 'Contact Support',
          body: '<p style="color:var(--muted);font-size:14px;margin:0 0 12px">Describe the issue ' +
            'and we will get back to you from ' + T.esc('support@typex.example') + '.</p>' +
            '<div class="field"><label class="label">Your message</label>' +
            '<textarea id="sup-msg" class="textarea" rows="5" ' +
            'placeholder="What is not working?"></textarea></div>',
          actions: [
            { label: 'Cancel', kind: 'btn-ghost', close: false, onClick: () => close() },
            { label: 'Send', kind: 'btn-ai', close: false, onClick: () => {
              const v = ((document.getElementById('sup-msg') || {}).value || '').trim();
              if (!v){ T.ui.toast('Write a message first.', 'error'); return; }
              close();
              T.ui.toast('Message noted (v1 demo). We\'ll reply from support@typex.example.');
            } }
          ]
        });
      });
    },

    unmount(){}
  };
})();
