/* TYPE X — Agent Mode page (#/agent).
   One instruction -> the agent runs the whole conversation loop:
   send -> wait -> on reply, generate a contextual reply -> send -> repeat.
   Polling runs client-side every 15s while this page is open (v1).
*/
(function(){
  const T = window.TypeX;
  const POLL_MS = 15000;

  /* ---------------- render ---------------- */
  function render(){
    return (
    T.ui.pageHead('Agent Mode', 'Ek instruction do — agent baat-cheet khud chalata rahega. Send, wait, reply, repeat.') +

    '<div class="card panel">' +
      '<div class="panel-head"><h2>' + T.icon('keyboard','ic-sm') + ' Agent ko instruction do</h2></div>' +
      '<div class="agent-bar">' +
        '<textarea id="ag-instruction" class="textarea agent-cmd" rows="3"' +
          ' placeholder="Misal: My Bunny ko WhatsApp par message karo, us se baat karte raho — jab reply aaye to jawab do…"></textarea>' +
        '<div class="agent-targets">' +
          '<div class="field"><div class="label">Contact name</div>' +
            '<input id="ag-name" class="input" placeholder="Misal: My Bunny"></div>' +
          '<div class="field"><div class="label">Phone / WhatsApp number</div>' +
            '<input id="ag-phone" class="input" inputmode="tel" placeholder="Misal: 0300 1234567"></div>' +
          '<div class="field"><div class="label">Channel</div>' +
            '<select id="ag-channel" class="input select">' +
              '<option value="whatsapp">WhatsApp</option>' +
              '<option value="instagram" disabled>Instagram (jald)</option>' +
              '<option value="facebook" disabled>Facebook (jald)</option>' +
            '</select></div>' +
        '</div>' +
        '<div class="agent-modes">' +
          '<div class="label">Reply mode</div>' +
          '<div class="seg" data-seg="ag-mode">' +
            '<button class="seg-btn active" data-val="approval">Har reply se pehle approval lo</button>' +
            '<button class="seg-btn" data-val="auto">Auto mode</button>' +
          '</div>' +
          '<p class="hint warn" id="ag-auto-warn" style="display:none;margin-top:8px">' +
            T.icon('alert','ic-sm') + ' Auto mode mein agent har reply <b>bina pooche</b> bhej dega.' +
            ' Contact number aur instruction double-check kar lein.</p>' +
        '</div>' +
        '<button class="btn btn-primary btn-lg btn-block" id="ag-start" style="margin-top:14px">' +
          T.icon('play','ic-sm') + ' START AGENT</button>' +
        '<p class="hint" style="margin-top:10px">Agent tab khula rehne par har 15 second mein naye replies check karta hai.</p>' +
      '</div>' +
    '</div>' +

    '<div class="card panel" id="ag-setup-banner" style="display:none;border-color:rgba(255,176,32,.45)">' +
      '<div class="panel-head"><h2>' + T.icon('alert','ic-sm') + ' Backend setup baqi hai</h2></div>' +
      '<p style="font-size:14px;color:var(--muted);margin:0 0 12px">' +
        'Real WhatsApp bhejne ke liye do cheezein chahiye — uske baghair agent sirf demo dikha sakta hai:</p>' +
      '<div class="how-step"><div class="how-n">1</div><div><b>respond.io mein WhatsApp channel connect karo</b>' +
        '<div class="mini-desc">respond.io → Settings → Channels → WhatsApp (Facebook login + SIM OTP — sirf tum kar sakte ho). Trial 20 Oct ko khatam ho raha hai.</div></div></div>' +
      '<div class="how-step"><div class="how-n">2</div><div><b>Vercel mein <span class="kbd">RESPONDIO_API_KEY</span> set karo</b>' +
        '<div class="mini-desc">Vercel → Project Settings → Environment Variables → key add karo → redeploy. Phir wapas aakar START AGENT dabao.</div></div></div>' +
    '</div>' +

    '<div class="ws-grid" style="grid-template-columns:1.15fr .85fr">' +
      '<div class="ws-col">' +
        '<div class="card panel">' +
          '<div class="panel-head">' +
            '<h2>' + T.icon('msg','ic-sm') + ' Live conversation</h2>' +
            '<span class="badge b-g" id="ag-state">IDLE</span>' +
          '</div>' +
          '<div class="chat-thread" id="ag-thread">' +
            '<div class="empty" style="padding:26px">' +
              '<div class="empty-icon">' + T.icon('msg','ic-lg') + '</div>' +
              '<h3>Abhi koi conversation nahi</h3>' +
              '<p>Upar instruction likho aur START AGENT dabao.</p>' +
            '</div>' +
          '</div>' +
          '<div class="controls-row" style="margin-top:12px">' +
            '<button class="btn btn-sm" id="ag-pause" disabled>' + T.icon('pause','ic-sm') + ' PAUSE</button>' +
            '<button class="btn btn-sm" id="ag-resume" disabled>' + T.icon('play','ic-sm') + ' RESUME</button>' +
            '<button class="btn btn-sm btn-ghost" id="ag-stop" disabled>' + T.icon('stop','ic-sm') + ' STOP</button>' +
          '</div>' +
          '<p class="hint" style="margin-top:10px">Pause/Stop par agent kuch nahi bhejta — har external action tumhare control mein hai.</p>' +
        '</div>' +
      '</div>' +
      '<div class="ws-col">' +
        '<div class="card panel">' +
          '<div class="panel-head"><h2>' + T.icon('cpu','ic-sm') + ' Agent activity</h2></div>' +
          '<div class="agent-log" id="ag-log" style="max-height:420px"></div>' +
        '</div>' +
      '</div>' +
    '</div>');
  }

  /* ---------------- state ---------------- */
  let R = null;
  let S = null;

  function freshState(){
    return {
      active:false, paused:false, starting:false,
      instruction:'', name:'', phone:'', contactId:null, since:0,
      timer:null, approvalMode:true, seenIds:{}, errStreak:0,
      history: [] // {dir:'in'|'out', text, at}
    };
  }

  function qs(sel){ return T.qs(sel, R); }

  function setState(kind, text){
    const b = qs('#ag-state');
    b.textContent = text;
    b.className = 'badge ' + (kind==='running' ? 'b-o' : kind==='paused' ? 'b-b' : kind==='error' ? 'b-r' : 'b-g');
  }

  function controls(){
    const on = S.active;
    qs('#ag-start').disabled = on || S.starting;
    qs('#ag-pause').disabled = !on || S.paused;
    qs('#ag-resume').disabled = !on || !S.paused;
    qs('#ag-stop').disabled = !on;
  }

  function scrollThread(){
    const th = qs('#ag-thread');
    th.scrollTop = th.scrollHeight;
  }

  function clearEmpty(){
    const e = qs('#ag-thread .empty');
    if (e) e.remove();
  }

  function addBubble(dir, text){
    clearEmpty();
    const d = document.createElement('div');
    d.className = 'bubble-row ' + (dir === 'out' ? 'sent' : 'recv');
    d.innerHTML = '<div class="bubble">' + T.esc(text) +
      '<div class="bubble-time">' + T.fmtTime(Date.now()) + '</div></div>';
    qs('#ag-thread').appendChild(d);
    S.history.push({dir:dir, text:text, at:Date.now()});
    scrollThread();
  }

  function addNotice(text){
    clearEmpty();
    const d = document.createElement('div');
    d.className = 'bubble-notice';
    d.textContent = text;
    qs('#ag-thread').appendChild(d);
    scrollThread();
  }

  /* ---------------- API calls ---------------- */
  async function apiSend(text){
    const res = await fetch('/api/send', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({channel:'whatsapp', to:S.phone, message:text, name:S.name || undefined})
    });
    let data = null;
    try { data = await res.json(); } catch(e){}
    if (!res.ok || !data || !data.ok){
      throw new Error((data && data.message) || ('Send failed (HTTP ' + res.status + ')'));
    }
    return data;
  }

  async function apiReplies(){
    const p = new URLSearchParams();
    if (S.contactId) p.set('contactId', S.contactId); else p.set('to', S.phone);
    p.set('since', String(S.since));
    p.set('limit', '20');
    const res = await fetch('/api/replies?' + p.toString());
    let data = null;
    try { data = await res.json(); } catch(e){}
    if (!res.ok || !data || !data.ok){
      const err = new Error((data && data.message) || ('Reply check failed (HTTP ' + res.status + ')'));
      err.code = data && data.code;
      throw err;
    }
    return data;
  }

  /* ---------------- approval card ---------------- */
  function approvalCard(text, onDone){
    clearEmpty();
    const card = T.el(
      '<div class="approval-card">' +
        '<div class="ap-head">' + T.icon('shield','ic-sm') +
        ' <b>Type X prepared this reply.</b><span class="ap-tag">needs approval</span></div>' +
        '<div class="ap-text"></div>' +
        '<textarea class="textarea ap-edit" rows="3" style="display:none"></textarea>' +
        '<div class="btn-row" style="margin-top:10px">' +
          '<button class="btn btn-sm btn-primary" data-x="approve">APPROVE &amp; SEND</button>' +
          '<button class="btn btn-sm" data-x="edit">EDIT</button>' +
          '<button class="btn btn-sm btn-ghost" data-x="skip">SKIP</button>' +
        '</div></div>');
    card.querySelector('.ap-text').textContent = text;
    const ta = card.querySelector('.ap-edit');
    card.querySelector('[data-x="approve"]').addEventListener('click', function(){
      const finalText = ta.style.display === 'none' ? text : ta.value.trim();
      if (!finalText){ T.ui.toast('Reply khaali hai', 'error'); return; }
      card.querySelectorAll('button').forEach(function(b){ b.disabled = true; });
      onDone('approved', finalText, card);
    });
    card.querySelector('[data-x="edit"]').addEventListener('click', function(){
      const open = ta.style.display !== 'none';
      ta.style.display = open ? 'none' : '';
      if (!open){ ta.value = text; ta.focus(); }
      card.querySelector('[data-x="edit"]').textContent = open ? 'EDIT' : 'HIDE EDITOR';
    });
    card.querySelector('[data-x="skip"]').addEventListener('click', function(){
      card.remove();
      T.agent.log('Reply skipped by user', 'action');
      onDone('skipped', null, card);
    });
    qs('#ag-thread').appendChild(card);
    scrollThread();
    return card;
  }

  /* ---------------- reply generation ---------------- */
  function convoContext(){
    return S.history.slice(-12).map(function(h){
      return (h.dir === 'out' ? 'You' : (S.name || 'Contact')) + ': ' + h.text;
    }).join('\n');
  }

  function aiStyle(){
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    return { tone:'Friendly', language: s.defaultLanguage || 'English', length:'Short', format:'Plain Text' };
  }

  function generateReply(lastInbound){
    const handle = T.ai.generate({
      instruction: 'Write a short, natural WhatsApp reply to the last message below. ' +
        'Stay on this goal: ' + S.instruction + '. ' +
        'Reply ONLY with the message text — no quotes, no explanations.',
      contextText: 'Conversation so far:\n' + convoContext() + '\n\nLatest message from ' +
        (S.name || 'contact') + ': ' + lastInbound,
      style: aiStyle()
    });
    return handle.promise;
  }

  function generateOpener(){
    const handle = T.ai.generate({
      instruction: 'Write the FIRST short WhatsApp message to ' + (S.name || 'this contact') +
        ' for this goal: ' + S.instruction + '. ' +
        'Reply ONLY with the message text — no quotes, no explanations.',
      contextText: '',
      style: aiStyle()
    });
    return handle.promise;
  }

  /* ---------------- loop ---------------- */
  function startPolling(){
    stopPolling();
    S.timer = setInterval(tick, POLL_MS);
  }
  function stopPolling(){
    if (S.timer){ clearInterval(S.timer); S.timer = null; }
  }

  async function tick(){
    if (!S.active || S.paused) return;
    try {
      const data = await apiReplies();
      S.errStreak = 0;
      if (data.contactId && !S.contactId) S.contactId = data.contactId;
      const fresh = (data.messages || []).filter(function(m){
        return m.dir === 'in' && m.at >= S.since && !S.seenIds[m.id];
      });
      if (!fresh.length) return;
      fresh.forEach(function(m){ S.seenIds[m.id] = 1; });
      const latest = fresh[fresh.length - 1];
      S.since = Math.max(S.since, latest.at);
      fresh.forEach(function(m){ addBubble('in', m.text); });
      T.agent.log('Reply detected (' + fresh.length + ') — generating answer…');
      setState('running', 'REPLYING');
      let reply;
      try {
        reply = ((await generateReply(latest.text)) || '').trim();
      } catch(e){
        T.agent.log('Reply generation failed', 'action');
        setState('running', 'WAITING');
        return;
      }
      if (!reply){ setState('running', 'WAITING'); return; }
      if (!S.active || S.paused){ setState(S.paused ? 'paused' : 'running', S.paused ? 'PAUSED' : 'WAITING'); return; }
      if (S.approvalMode){
        setState('paused', 'APPROVAL NEEDED');
        T.agent.log('Waiting for approval', 'action');
        approvalCard(reply, function(decision, finalText){
          if (!S.active) return;
          if (decision === 'approved') sendOut(finalText);
          else setState('running', 'WAITING');
        });
      } else {
        await sendOut(reply);
      }
    } catch(e){
      S.errStreak++;
      T.agent.log('Reply check failed', 'action');
      if (S.errStreak >= 3){
        T.ui.toast('Reply check lagatar fail ho raha hai — agent rok diya gaya', 'error');
        stopAgent();
      }
    }
  }

  async function sendOut(text){
    setState('running', 'SENDING');
    T.agent.log('Sending reply…');
    try {
      const r = await apiSend(text);
      if (r.contactId && !S.contactId) S.contactId = r.contactId;
      S.since = Date.now();
      S.seenIds = S.seenIds || {};
      addBubble('out', text);
      T.agent.log('Reply sent', 'action');
      const u = T.store.get('usage', {});
      T.store.set('usage', Object.assign(u, {
        messagesSent: (u.messagesSent || 0) + 1,
        approvedActions: (u.approvedActions || 0) + 1
      }));
      setState('running', 'WAITING');
    } catch(e){
      T.agent.log('Send failed', 'action');
      T.ui.toast('Bhejne mein masla', 'error');
      setState('error', 'SEND ERROR');
    }
  }

  /* ---------------- start / stop ---------------- */
  async function startAgent(){
    const instruction = qs('#ag-instruction').value.trim();
    const name = qs('#ag-name').value.trim();
    const phoneRaw = qs('#ag-phone').value.trim();
    const phone = phoneRaw.replace(/[^\d]/g, '');
    if (!instruction){ T.ui.toast('Pehle instruction likho', 'error'); qs('#ag-instruction').focus(); return; }
    if (phone.length < 7 || phone.length > 15){
      T.ui.toast('Sahi phone number likho (digits)', 'error'); qs('#ag-phone').focus(); return;
    }
    S = freshState();
    S.active = true; S.starting = true;
    S.instruction = instruction; S.name = name; S.phone = phone;
    S.since = Date.now();
    controls();
    qs('#ag-setup-banner').style.display = 'none';
    T.agent.clear();
    T.agent.start('Instruction received');
    T.agent.log('Target: ' + (name ? name + ' (' + phoneRaw + ')' : phoneRaw));
    T.agent.log('Mode: ' + (S.approvalMode ? 'approval (har reply se pehle poochega)' : 'auto (khud bhejega)'));
    setState('running', 'CHECKING BACKEND');
    addNotice('Agent start ho raha hai…');

    let backendOk = false;
    try {
      await apiReplies();
      backendOk = true;
      T.agent.log('Backend connected');
    } catch(e){
      if (e.code === 'not_configured'){
        T.agent.log('Backend not configured — setup needed', 'action');
        setState('error', 'SETUP NEEDED');
        qs('#ag-setup-banner').style.display = '';
        addNotice('Backend setup baqi hai — upar steps dekho.');
        S.active = false; S.starting = false; controls();
        return;
      }
      if (e.code === 'contact_not_found'){
        backendOk = true; // naya contact — pehla message banayega
        T.agent.log('Backend connected (nayi conversation)');
      } else {
        T.agent.log('Backend check failed', 'action');
        setState('error', 'ERROR');
        T.ui.toast('Backend se rabta nahi ho saka', 'error');
        S.active = false; S.starting = false; controls();
        return;
      }
    }
    if (!backendOk){
      S.active = false; S.starting = false; controls(); return;
    }

    S.starting = false;
    setState('running', 'PREPARING');
    addNotice('Pehla message tayyar ho raha hai…');
    T.agent.log('Generating opening message…');
    let opener = '';
    try {
      opener = ((await generateOpener()) || '').trim();
    } catch(e){
      T.agent.log('Opening message failed', 'action');
      setState('error', 'ERROR');
      S.active = false; controls();
      return;
    }
    if (!opener){
      setState('error', 'ERROR');
      S.active = false; controls();
      return;
    }
    controls();
    if (S.approvalMode){
      setState('paused', 'APPROVAL NEEDED');
      T.agent.log('Waiting for approval', 'action');
      approvalCard(opener, function(decision, finalText){
        if (!S.active) return;
        if (decision === 'approved'){
          sendOut(finalText).then(function(){
            if (S.active){ setState('running', 'WAITING'); startPolling(); }
          });
        } else {
          setState('running', 'WAITING');
          startPolling();
          T.agent.log('Loop chal raha hai — reply ka intezar', 'action');
        }
      });
    } else {
      await sendOut(opener);
      if (S.active){ setState('running', 'WAITING'); startPolling(); }
    }
    controls();
  }

  function pauseAgent(){
    if (!S.active || S.paused) return;
    S.paused = true;
    stopPolling();
    T.agent.pause();
    setState('paused', 'PAUSED');
    controls();
  }

  function resumeAgent(){
    if (!S.active || !S.paused) return;
    S.paused = false;
    T.agent.resume();
    setState('running', 'WAITING');
    startPolling();
    tick();
    controls();
  }

  function stopAgent(){
    if (!S.active && !S.starting) return;
    stopPolling();
    S.active = false; S.paused = false; S.starting = false;
    T.agent.stop();
    setState('idle', 'IDLE');
    addNotice('Agent rok diya gaya.');
    controls();
  }

  /* ---------------- mount ---------------- */
  function mount(root){
    R = root;
    S = freshState();
    T.agent.renderInto(qs('#ag-log'));
    setState('idle', 'IDLE');
    controls();

    T.qsa('[data-seg="ag-mode"] .seg-btn', R).forEach(function(btn){
      btn.addEventListener('click', function(){
        T.qsa('[data-seg="ag-mode"] .seg-btn', R).forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        S.approvalMode = btn.dataset.val !== 'auto';
        qs('#ag-auto-warn').style.display = S.approvalMode ? 'none' : '';
        T.agent.log('Mode: ' + (S.approvalMode ? 'approval' : 'auto'), 'action');
      });
    });

    qs('#ag-start').addEventListener('click', startAgent);
    qs('#ag-pause').addEventListener('click', pauseAgent);
    qs('#ag-resume').addEventListener('click', resumeAgent);
    qs('#ag-stop').addEventListener('click', stopAgent);
  }

  function unmount(){
    stopPolling();
    R = null;
  }

  T.pages = T.pages || {};
  T.pages['agent'] = {
    title: 'Agent Mode',
    render: render,
    mount: mount,
    unmount: unmount
  };
})();
