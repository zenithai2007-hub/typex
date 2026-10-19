/* CLINT X — boot. Intro -> router. Global shortcuts + helpers. */
(function(){
  const T = window.TypeX;

  function boot(){
    T.storeInit();
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    const seen = T.store.get('seen_intro', false);
    const start = () => T.router.render();
    if (!seen && s.showIntro !== false){
      T.intro.play(start);
    } else if (!seen){
      T.store.set('seen_intro', true);
      start();
    } else if (s.showIntro !== false){
      T.intro.quick(start);
    } else {
      start();
    }

    // global shortcuts
    document.addEventListener('keydown', e => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !typing){
        // let focused pages handle their own Ctrl+Enter; nothing global
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
