/* CLINT X — Outreach Mode page.
   Personalized, consent-respecting, approval-gated outreach.
   No spam, no CAPTCHA/rate-limit bypass, no platform-rule violations. */
(function(){
  const T = window.TypeX;

  const BADGE = {
    'New':'b-b', 'Analyzing':'b-p', 'Draft Ready':'b-o', 'Approved':'b-g',
    'Sent':'b-p', 'Replied':'b-g', 'Follow-up':'b-o', 'Completed':'b-g'
  };

  const PLATFORMS = ['LinkedIn','Email','Instagram','Upwork','Fiverr','Other'];

  function getLeads(){ return T.store.get('leads') || []; }
  function saveLeads(l){ T.store.set('leads', l); }
  function getUsage(){ return T.store.get('usage') || {}; }
  function saveUsage(u){ T.store.set('usage', u); }
  function findLead(id){ return getLeads().find(l => l.id === id); }
  function updateLead(id, patch){
    const leads = getLeads();
    const i = leads.findIndex(l => l.id === id);
    if (i > -1){ leads[i] = Object.assign({}, leads[i], patch); saveLeads(leads); }
    return leads[i];
  }

  function trunc(s, n){
    s = String(s || '');
    return s.length > n ? s.slice(0, n).trim() + '…' : s;
  }

  /* ---------- stats ---------- */
  function statsHtml(){
    const leads = getLeads(), u = getUsage();
    const withMsg = leads.filter(l => l.message && l.message.trim()).length;
    const prepared = (u.messagesPrepared || 0) + withMsg;
    const sent = u.messagesSent || 0;
    const replies = u.replies || 0;
    const positive = Math.floor(replies * 0.6);
    const followups = leads.filter(l => l.status === 'Follow-up').length;
    const conv = sent ? Math.round(positive / sent * 100) + '%' : '—';
    return '<div class="stat-grid">' +
      T.ui.statCard({label:'Total Leads', value:leads.length, icon:'users', accent:'p'}) +
      T.ui.statCard({label:'Messages Prepared', value:prepared, icon:'edit', accent:'o'}) +
      T.ui.statCard({label:'Messages Sent', value:sent, icon:'send', accent:'p'}) +
      T.ui.statCard({label:'Replies', value:replies, icon:'msg', accent:'o'}) +
      T.ui.statCard({label:'Positive Replies', value:positive, icon:'check', accent:'p'}) +
      T.ui.statCard({label:'Follow-ups', value:followups, icon:'cal', accent:'o'}) +
      T.ui.statCard({label:'Conversion Rate', value:conv, icon:'target', accent:'p'}) +
      '</div>';
  }

  /* ---------- table ---------- */
  function tableHtml(){
    const leads = getLeads();
    if (!leads.length){
      return T.ui.emptyState({
        icon:'users', title:'No leads yet',
        text:'Add your first lead and CLINT X will help you reach out the right way — personalized, relevant, and always with your approval.',
        actionLabel:'+ New Lead', onAction: newLeadModal
      });
    }
    const rows = leads.map(l => {
      const b = BADGE[l.status] || 'b-b';
      return '<tr>' +
        '<td><strong>' + T.esc(l.name) + '</strong></td>' +
        '<td>' + T.esc(l.platform) + '</td>' +
        '<td class="ctx">' + T.esc(trunc(l.context, 60)) + '</td>' +
        '<td><span class="badge ' + b + '">' + T.esc(l.status) + '</span></td>' +
        '<td>' + (l.lastContact ? T.timeAgo(l.lastContact) : '—') + '</td>' +
        '<td>' + (l.nextFollowUp ? T.fmtDate(l.nextFollowUp) : '—') + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" data-view="' + T.esc(l.id) + '">' +
          T.icon('eye') + '<span>View</span></button></td>' +
        '</tr>';
    }).join('');
    return '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Name</th><th>Platform</th><th>Context</th><th>Status</th>' +
      '<th>Last Contact</th><th>Next Follow-up</th><th>Actions</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
  }

  /* ---------- lead detail modal ---------- */
  function leadModal(id){
    const render = () => {
      const l = findLead(id);
      if (!l){ paint(); return; }
      const b = BADGE[l.status] || 'b-b';
      const msg = (l.message && l.message.trim()) ? l.message : '';
      const statusOpts = Object.keys(BADGE).map(s =>
        '<option value="' + s + '"' + (l.status === s ? ' selected' : '') + '>' + s + '</option>'
      ).join('');

      const body = T.el(
        '<div>' +
        '<div class="lead-head"><h4>' + T.esc(l.name) + '</h4>' +
        '<span class="badge ' + b + '">' + T.esc(l.status) + '</span>' +
        '<span class="chip">' + T.esc(l.platform) + '</span></div>' +
        '<div class="divider"></div>' +
        '<div class="label">WHY THIS MESSAGE</div>' +
        '<p class="why-text">' + T.esc(l.context || 'No context added yet.') + '</p>' +
        '<div class="label">GENERATED MESSAGE</div>' +
        '<div class="msg-wrap">' +
        (msg
          ? '<div class="output-body">' + T.esc(msg) + '</div>'
          : '<div class="empty">No draft yet — generate one below.</div>') +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-ai btn-sm" id="lm-gen">' + T.icon('spark') + '<span>Generate Draft</span></button>' +
          (msg ? '<button class="btn btn-ghost btn-sm" id="lm-edit">' + T.icon('edit') + '<span>Edit</span></button>' : '') +
          '<button class="btn btn-ghost btn-sm" id="lm-copy">' + T.icon('copy') + '<span>Copy</span></button>' +
          '<button class="btn btn-ghost btn-sm" id="lm-approve">' + T.icon('check') + '<span>Approve</span></button>' +
          '<button class="btn btn-primary btn-sm" id="lm-send">' + T.icon('send') + '<span>Type / Send</span></button>' +
        '</div>' +
        '<div class="divider"></div>' +
        '<div class="field"><div class="label">Status</div>' +
        '<select class="select" id="lm-status">' + statusOpts + '</select>' +
        '<div class="hint">Advance manually — e.g. mark Replied when the person answers you.</div></div>' +
        '</div>'
      );

      const close = T.ui.modal({
        title: 'Lead', wide: true,
        body: body,
        actions: [
          { label:'Delete', kind:'danger', onClick: async () => {
              const ok = await T.ui.confirm({
                title:'Delete lead?',
                message:'Remove ' + l.name + ' and their draft message from your leads.',
                okLabel:'Delete', danger:true
              });
              if (!ok) return;
              saveLeads(getLeads().filter(x => x.id !== id));
              close(); paint();
              T.ui.toast('Lead deleted.', 'info');
          }, close:false },
          { label:'Close', kind:'ghost', close:true }
        ]
      });

      const rerender = () => { close(); leadModal(id); };

      const genBtn = T.qs('#lm-gen', body);
      genBtn.addEventListener('click', async () => {
        genBtn.disabled = true;
        genBtn.classList.add('busy');
        try{
          const draft = await T.ai.quick(
            'Write a short professional message for this potential client and mention something relevant from their context: ' +
            l.name + ' — ' + (l.context || ''),
            { tone:'Professional', language:'English', length:'Short' }
          );
          updateLead(id, { message: draft, status: 'Draft Ready' });
          const u = getUsage();
          u.messagesPrepared = (u.messagesPrepared || 0) + 1;
          saveUsage(u);
          paint();
          rerender();
          T.ui.toast('Draft ready — review before anything goes out.', 'success');
        }catch(e){
          T.ui.toast('Could not generate a draft. Try again.', 'error');
        }finally{
          genBtn.disabled = false;
          genBtn.classList.remove('busy');
        }
      });

      T.qs('#lm-copy', body).addEventListener('click', () => {
        if (!msg){ T.ui.toast('Nothing to copy yet.', 'info'); return; }
        T.copy(msg).then(ok => T.ui.toast(ok ? 'Copied to clipboard.' : 'Copy failed.', ok ? 'success' : 'error'));
      });

      const editBtn = T.qs('#lm-edit', body);
      if (editBtn){
        editBtn.addEventListener('click', () => {
          const ta = T.el('<div class="field" style="margin-top:10px">' +
            '<textarea class="textarea" id="lm-ta" rows="6">' + T.esc(msg) + '</textarea>' +
            '<div class="btn-row" style="margin-top:8px">' +
            '<button class="btn btn-primary btn-sm" id="lm-save">Save</button>' +
            '<button class="btn btn-ghost btn-sm" id="lm-cancel">Cancel</button></div></div>');
          T.qs('.msg-wrap', body).appendChild(ta);
          editBtn.disabled = true;
          T.qs('#lm-cancel', ta).addEventListener('click', () => { ta.remove(); editBtn.disabled = false; });
          T.qs('#lm-save', ta).addEventListener('click', () => {
            const v = T.qs('#lm-ta', ta).value.trim();
            updateLead(id, { message: v });
            paint(); rerender();
            T.ui.toast('Message saved.', 'success');
          });
        });
      }

      T.qs('#lm-approve', body).addEventListener('click', () => {
        if (!msg){ T.ui.toast('Generate a draft first.', 'info'); return; }
        updateLead(id, { status:'Approved' });
        paint(); rerender();
        T.ui.toast('Approved. Nothing sends without your go-ahead.', 'success');
      });

      T.qs('#lm-send', body).addEventListener('click', () => {
        if (!msg){ T.ui.toast('Generate a draft first.', 'info'); return; }
        T.ui.approval({
          title:'Approve outreach',
          previewLabel:'Message to ' + l.name + ' via ' + l.platform,
          output: msg,
          actionLabel:'Approve & Send',
          onApprove(){
            updateLead(id, { status:'Sent', lastContact: Date.now() });
            const u = getUsage();
            u.messagesSent = (u.messagesSent || 0) + 1;
            u.approvedActions = (u.approvedActions || 0) + 1;
            saveUsage(u);
            close(); paint();
            T.ui.toast('Sent in ASSISTED MODE (v1 demo) — confirm in the actual app.', 'success');
          }
        });
      });

      T.qs('#lm-status', body).addEventListener('change', (e) => {
        updateLead(id, { status: e.target.value });
        paint(); rerender();
      });
    };
    render();
  }

  /* ---------- new lead modal ---------- */
  function newLeadModal(){
    const platOpts = PLATFORMS.map(p => '<option value="' + p + '">' + p + '</option>').join('');
    const body = T.el(
      '<div>' +
      '<div class="field"><div class="label">Name</div>' +
      '<input class="input" id="nl-name" placeholder="e.g. Sarah Mitchell"></div>' +
      '<div class="field"><div class="label">Platform</div>' +
      '<select class="select" id="nl-platform">' + platOpts + '</select></div>' +
      '<div class="field"><div class="label">Context</div>' +
      '<textarea class="textarea" id="nl-context" rows="4" placeholder="What do you know about them? Role, company, something they posted or need…"></textarea>' +
      '<div class="hint">Good context is what makes a message personal instead of spammy.</div></div>' +
      '</div>'
    );
    T.ui.modal({
      title:'New Lead',
      body: body,
      actions:[
        { label:'Cancel', kind:'ghost', close:true },
        { label:'Add Lead', kind:'ai', onClick:() => {
            const name = T.qs('#nl-name', body).value.trim();
            if (!name){ T.ui.toast('Give the lead a name.', 'error'); return; }
            const lead = {
              id: T.uid('lead'),
              name: name,
              platform: T.qs('#nl-platform', body).value,
              context: T.qs('#nl-context', body).value.trim(),
              status:'New', lastContact:null, nextFollowUp:null, message:''
            };
            saveLeads(getLeads().concat([lead]));
            paint();
            T.ui.toast('Lead added. Generate a draft when ready.', 'success');
        }, close:true }
      ]
    });
  }

  /* ---------- paint / page ---------- */
  let root = null;
  function paint(){
    if (!root) return;
    T.qs('[data-ox="stats"]', root).innerHTML = statsHtml();
    T.qs('[data-ox="table"]', root).innerHTML = tableHtml();
    T.qsa('[data-view]', root).forEach(b =>
      b.addEventListener('click', () => leadModal(b.getAttribute('data-view')))
    );
  }

  T.pages['outreach'] = {
    title:'Outreach Mode',
    render(){
      return T.ui.pageHead('Outreach Mode',
        'Personalized outreach — legitimate, relevant, approval-gated.',
        '<button class="btn btn-ai btn-sm" id="ox-new">' + T.icon('plus') +
        '<span>New Lead</span></button>') +
        '<div class="card card-pad compliance-card">' +
          '<div class="comp-head">' + T.icon('shield', 'comp-ic') +
          '<h3>Outreach the right way</h3></div>' +
          '<p>CLINT X writes personalized messages from real context — never bulk-identical blasts. ' +
          'It does not bypass CAPTCHAs, rate limits, anti-spam systems, or platform automation rules. ' +
          'Where automation is restricted, it works in ASSISTED MODE: Clint X prepares the action while ' +
          'you confirm and complete it.</p>' +
        '</div>' +
        '<div data-ox="stats"></div>' +
        '<div data-ox="table"></div>';
    },
    mount(r){
      root = r;
      T.qs('#ox-new', r).addEventListener('click', newLeadModal);
      paint();
    },
    unmount(){ root = null; }
  };
})();
