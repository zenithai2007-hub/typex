/* CLINT X — core utils. Defines window.TypeX namespace. */
window.TypeX = window.TypeX || {};
(function(){
  const T = window.TypeX;
  T.esc = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };
  T.el = function(html){
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };
  T.qs = (sel, root) => (root||document).querySelector(sel);
  T.qsa = (sel, root) => Array.from((root||document).querySelectorAll(sel));
  T.uid = function(p){ return (p||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); };
  T.clamp = (n,a,b) => Math.max(a, Math.min(b, n));
  T.debounce = function(fn, ms){
    let t; return function(){ clearTimeout(t); const a=arguments,s=this; t=setTimeout(()=>fn.apply(s,a), ms||250); };
  };
  T.words = s => (String(s||'').trim().match(/\S+/g)||[]).length;
  T.chars = s => String(s||'').length;
  T.fmtDate = function(ts){
    const d = new Date(ts);
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  };
  T.fmtTime = function(ts){
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  };
  T.timeAgo = function(ts){
    const s = Math.floor((Date.now()-ts)/1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  };
  T.copy = async function(text){
    try { await navigator.clipboard.writeText(text); return true; }
    catch(e){
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch(_){}
      ta.remove(); return ok;
    }
  };
  T.download = function(filename, text, mime){
    const b = new Blob([text], {type: mime || 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
})();
