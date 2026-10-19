/* CLINT X — AI provider: api (stub for the Phase-2 real backend).
   The engine tries the configured provider; 'api' is reserved for the
   future hosted model endpoint. Never expose keys in the frontend —
   all real AI calls will go through the backend in Phase 2. */
(function(){
  const T = window.TypeX;
  T.aiProviders = T.aiProviders || {};
  T.aiProviders.api = {
    name: 'api',
    label: 'Clint X Cloud (Phase 2)',
    async generate(){
      throw new Error('cloud-unavailable');
    }
  };
})();
