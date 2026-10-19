/* CLINT X — AI engine: provider selection, streaming, retry, error mapping.
   TypeX.ai.generate({ instruction, contextText, style, onToken, onDone, onError }) -> { cancel(), promise }
   TypeX.ai.quick(instruction, styleOverrides) -> Promise<string> (no streaming)
*/
(function(){
  const T = window.TypeX;

  function pickProvider(){
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    const name = (s && s.provider) || 'local';
    return (T.aiProviders && T.aiProviders[name]) || T.aiProviders.local;
  }

  function friendlyError(e){
    const m = String((e && e.message) || e || '');
    if (m === 'cancelled') return null; // silent
    if (m === 'empty') return {title:'Nothing to work with', text:'Type an instruction first — tell CLINT X what you want.'};
    if (m === 'cloud-unavailable') return {title:'Cloud engine not connected', text:'The Phase-2 cloud backend is not configured yet. The local engine is active instead.'};
    return {title:"Clint X couldn't complete this task.", text:'Something interrupted generation. Your instruction is safe — try again or edit it.'};
  }

  function generate(opts){
    const signal = {cancelled:false};
    const provider = pickProvider();
    let promise = (async () => {
      try {
        const text = await provider.generate({
          instruction: opts.instruction,
          contextText: opts.contextText || '',
          style: opts.style || {},
          signal,
          onToken: opts.onToken
        });
        if (opts.onDone) opts.onDone(text);
        return text;
      } catch(e){
        if (signal.cancelled) return '';
        // one automatic retry on the local provider
        if (provider.name === 'local' && !opts._retried && String(e.message||'') !== 'simulated'){
          opts._retried = true;
          await new Promise(r => setTimeout(r, 600));
          return generate(opts).promise;
        }
        const fe = friendlyError(e);
        if (fe && opts.onError) opts.onError(fe);
        throw e;
      }
    })();
    return { cancel(){ signal.cancelled = true; }, promise };
  }

  async function quick(instruction, styleOverrides){
    const s = T.store.get('settings', T.DEFAULT_SETTINGS);
    const style = Object.assign(
      {tone:s.defaultTone, language:s.defaultLanguage, length:s.defaultLength, format:s.defaultFormat},
      styleOverrides || {});
    const r = generate({instruction, contextText:'', style});
    return r.promise;
  }

  T.ai = { generate, quick, detectType: (i) => T.aiProviders.local.detectType(i) };
})();
