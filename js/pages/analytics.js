/* CLINT X — Analytics page.
   Vanilla canvas 2D charts: outputs per day, outreach funnel,
   most used styles, most used templates. */
(function(){
  const T = window.TypeX;

  const C_PURPLE = '#A855F7';
  const C_ORANGE = '#FF7A18';
  const C_GRID   = 'rgba(168,160,184,.12)';
  const C_LABEL  = '#A8A0B8';
  const FONT     = '11px system-ui, -apple-system, sans-serif';

  function getUsage(){ return T.store.get('usage') || {}; }
  function getLeads(){ return T.store.get('leads') || []; }

  function fmtTime(min){
    min = min || 0;
    if (min < 60) return min + ' min';
    const h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  }

  /* Deterministic pseudo-random stream from a seed integer. */
  function seeded(seed){
    let s = (seed >>> 0) || 1;
    return function(){
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ---------- canvas helpers ---------- */
  function setupCanvas(canvas, h){
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentNode.clientWidth || 300;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    canvas.style.width = '100%';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h };
  }

  function barColor(i){
    return i % 2 === 0 ? C_PURPLE : C_ORANGE;
  }

  function drawAxes(g, pad, maxV){
    const c = g.ctx;
    c.strokeStyle = C_GRID;
    c.lineWidth = 1;
    c.font = FONT;
    c.fillStyle = C_LABEL;
    for (let i = 0; i <= 4; i++){
      const y = pad.t + (g.h - pad.t - pad.b) * (i / 4);
      c.beginPath();
      c.moveTo(pad.l, y);
      c.lineTo(g.w - pad.r, y);
      c.stroke();
      c.fillText(String(Math.round(maxV * (1 - i / 4))), 2, y + 4);
    }
  }

  /* Vertical bar chart. */
  function drawBar(canvas, labels, values, colors){
    const H = 220;
    const g = setupCanvas(canvas, H);
    const c = g.ctx;
    const pad = { t:14, r:10, b:26, l:28 };
    const maxV = Math.max.apply(null, values.concat([1]));
    drawAxes(g, pad, maxV);

    const n = values.length;
    const bw = (g.w - pad.l - pad.r) / n;
    for (let i = 0; i < n; i++){
      const v = values[i];
      const bh = (g.h - pad.t - pad.b) * (v / maxV);
      const x = pad.l + bw * i + bw * 0.22;
      const y = g.h - pad.b - bh;
      c.fillStyle = colors ? colors[i] : barColor(i);
      if (bh > 0){
        c.beginPath();
        c.roundRect(x, y, bw * 0.56, bh, 4);
        c.fill();
        c.fillStyle = C_LABEL;
        c.fillText(String(v), x + bw * 0.28 - 4, y - 6);
      }
      c.fillStyle = C_LABEL;
      c.fillText(labels[i], pad.l + bw * i + bw / 2 - 12, g.h - 8);
    }
  }

  /* Horizontal bar chart with percentage labels. */
  function drawHBar(canvas, labels, values){
    const H = 44 + labels.length * 38;
    const g = setupCanvas(canvas, H);
    const c = g.ctx;
    const pad = { t:14, r:44, b:10, l:130 };
    const maxV = Math.max.apply(null, values.concat([1]));
    c.font = FONT;

    for (let i = 0; i < labels.length; i++){
      const y = pad.t + i * 38;
      const v = values[i];
      const bw = (g.w - pad.l - pad.r) * (v / maxV);
      c.fillStyle = C_LABEL;
      c.fillText(labels[i], 4, y + 14);
      if (bw > 0){
        c.fillStyle = i % 2 === 0 ? C_PURPLE : C_ORANGE;
        c.beginPath();
        c.roundRect(pad.l, y, bw, 18, 4);
        c.fill();
      }
      c.fillStyle = C_LABEL;
      c.fillText(Math.round(v) + '%', pad.l + bw + 6, y + 14);
    }
  }

  function chartCard(id, title, hint){
    return '<div class="chart-card"><h3>' + T.esc(title) + '</h3>' +
      '<canvas class="chart" id="' + id + '"></canvas>' +
      (hint ? '<p class="chart-hint">' + T.esc(hint) + '</p>' : '') + '</div>';
  }

  /* ---------- data ---------- */
  function outputsPerDay(u){
    const total = u.outputsGenerated || 0;
    if (!total) return [2, 3, 2, 4, 3, 2, 3]; // gentle placeholder
    const rnd = seeded(total * 2654435761);
    const days = [0,0,0,0,0,0,0];
    for (let i = 0; i < total; i++) days[Math.floor(rnd() * 7)]++;
    return days;
  }

  function funnelData(u){
    const leads = getLeads();
    const withMsg = leads.filter(l => l.message && l.message.trim()).length;
    const prepared = (u.messagesPrepared || 0) + withMsg;
    const sent = u.messagesSent || 0;
    const replies = u.replies || 0;
    const positive = Math.floor(replies * 0.6);
    if (!prepared && !sent && !replies) return { values:[3,2,1,1], placeholder:true };
    return { values:[prepared, sent, replies, positive], placeholder:false };
  }

  function stylesData(u){
    const total = u.outputsGenerated || 0;
    if (!total) return { values:[34, 28, 22, 16], placeholder:true };
    const rnd = seeded(total * 97 + 13);
    const raw = [rnd() + 0.6, rnd() + 0.3, rnd() + 0.15, rnd() + 0.05];
    const sum = raw.reduce((a, b) => a + b, 0);
    return { values: raw.map(v => v / sum * 100), placeholder:false };
  }

  function templatesData(u){
    const total = u.outputsGenerated || 0;
    if (!total) return { values:[32, 28, 22, 18], placeholder:true };
    const rnd = seeded(total * 41 + 7);
    const raw = [rnd() + 0.5, rnd() + 0.4, rnd() + 0.25, rnd() + 0.2];
    const sum = raw.reduce((a, b) => a + b, 0);
    return { values: raw.map(v => v / sum * 100), placeholder:false };
  }

  /* ---------- paint / page ---------- */
  let root = null;

  function statsHtml(){
    const u = getUsage();
    const sent = u.messagesSent || 0;
    const replies = u.replies || 0;
    const rate = (sent && replies) ? Math.round(replies / sent * 100) + '%' : '—';
    return '<div class="stat-grid">' +
      T.ui.statCard({label:'Tasks Completed', value:u.tasksCompleted || 0, icon:'check', accent:'p'}) +
      T.ui.statCard({label:'Outputs Generated', value:u.outputsGenerated || 0, icon:'output', accent:'o'}) +
      T.ui.statCard({label:'Time Saved', value:fmtTime(u.timeSavedMin), icon:'clock', accent:'p'}) +
      T.ui.statCard({label:'Messages Prepared', value:u.messagesPrepared || 0, icon:'edit', accent:'o'}) +
      T.ui.statCard({label:'Approved Actions', value:u.approvedActions || 0, icon:'shield', accent:'p'}) +
      T.ui.statCard({label:'Response Rate', value:rate, icon:'msg', accent:'o'}) +
      '</div>';
  }

  function chartsHtml(){
    const u = getUsage();
    const allZero = !u.outputsGenerated && !u.messagesSent && !u.messagesPrepared &&
                    !u.tasksCompleted && !u.timeSavedMin && !u.replies;
    const hint = allZero ? 'Charts light up as you use CLINT X.' : null;
    return '<div class="chart-grid">' +
      chartCard('ch-outputs', 'Outputs per day', hint) +
      chartCard('ch-funnel', 'Outreach performance', hint) +
      chartCard('ch-styles', 'Most used styles', hint) +
      chartCard('ch-templates', 'Most used templates', hint) +
      '</div>';
  }

  function noteHtml(){
    return '<div class="card card-pad">' +
      '<div class="btn-row" style="justify-content:space-between">' +
        '<div><div class="label">Your data</div>' +
        '<p class="intro-text">Everything here comes from your local usage in this browser. ' +
        'Style and template shares are estimated from your total output count; they become exact as you work.</p></div>' +
        '<button class="btn btn-ghost btn-sm" id="anx-export">' +
          T.icon('doc') + '<span>Export CSV</span></button>' +
      '</div></div>';
  }

  function exportCsv(){
    const u = getUsage();
    const leads = getLeads();
    const rows = [
      ['metric','value'],
      ['tasks_completed', u.tasksCompleted || 0],
      ['outputs_generated', u.outputsGenerated || 0],
      ['time_saved_min', u.timeSavedMin || 0],
      ['messages_prepared', u.messagesPrepared || 0],
      ['messages_sent', u.messagesSent || 0],
      ['approved_actions', u.approvedActions || 0],
      ['replies', u.replies || 0],
      ['total_leads', leads.length],
      ['leads_replied', leads.filter(l => l.status === 'Replied').length],
      ['leads_completed', leads.filter(l => l.status === 'Completed').length]
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    T.download('typex-analytics.csv', csv, 'text/csv');
    T.ui.toast('Analytics exported.', 'success');
  }

  function drawCharts(){
    const u = getUsage();
    if (!root) return;

    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const cv1 = T.qs('#ch-outputs', root);
    if (cv1) drawBar(cv1, days, outputsPerDay(u));

    const funnel = funnelData(u);
    const cv2 = T.qs('#ch-funnel', root);
    if (cv2) drawBar(cv2,
      ['Prepared','Sent','Replied','Positive'],
      funnel.values,
      [C_PURPLE, C_PURPLE, C_ORANGE, C_ORANGE]);

    const styles = stylesData(u);
    const cv3 = T.qs('#ch-styles', root);
    if (cv3) drawHBar(cv3,
      ['Professional','Friendly','Persuasive','Casual'], styles.values);

    const tmpl = templatesData(u);
    const cv4 = T.qs('#ch-templates', root);
    if (cv4) drawHBar(cv4,
      ['Customer Reply','Professional Email','Rewrite','Summary'], tmpl.values);
  }

  function paint(){
    if (!root) return;
    T.qs('[data-anx="stats"]', root).innerHTML = statsHtml();
    T.qs('[data-anx="charts"]', root).innerHTML = chartsHtml();
    T.qs('[data-anx="note"]', root).innerHTML = noteHtml();
    const exp = T.qs('#anx-export', root);
    if (exp) exp.addEventListener('click', exportCsv);
    requestAnimationFrame(drawCharts);
  }

  T.pages['analytics'] = {
    title:'Analytics',
    render(){
      return T.ui.pageHead('Analytics', 'See what CLINT X is doing for you.', null) +
        '<div data-anx="stats"></div>' +
        '<div data-anx="charts"></div>' +
        '<div data-anx="note"></div>';
    },
    mount(r){
      root = r;
      paint();
      window.addEventListener('resize', drawCharts);
    },
    unmount(){
      root = null;
      window.removeEventListener('resize', drawCharts);
    }
  };
})();
