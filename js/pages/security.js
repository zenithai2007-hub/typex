(function(){
  const T = window.TypeX;

  T.pages['security'] = {
    title: 'Security & Privacy',
    render(){
      return `
<nav class="land-nav">
  <div class="land-nav-in">
    <a href="#/" class="brand">${T.logo(28)}<span>TYPE&nbsp;X</span></a>
    <div class="land-cta">
      <a href="#/" class="btn btn-ghost btn-sm">Back to home</a>
    </div>
  </div>
</nav>

<section class="section">
  <span class="sec-kicker">Trust &amp; privacy</span>
  <h1>Security &amp; Privacy</h1>
  <p class="prose">Type X is built to earn your trust. Here is exactly how your account, your data and your integrations are protected — and what is always in your control.</p>

  <ul class="sec-list">
    <li class="sec-item">${T.icon('shield')} <div><strong>Secure authentication</strong><p>Your account is protected from the first login, with safe session handling and no shortcuts around sign-in.</p></div></li>
    <li class="sec-item">${T.icon('lock')} <div><strong>Encrypted local storage</strong><p>Everything Type X stores in this browser is kept in encrypted form — your data is never sitting around in plain text.</p></div></li>
    <li class="sec-item">${T.icon('key')} <div><strong>No API keys in the frontend</strong><p>Credentials and API keys never live in the browser or in page code. They stay server-side, out of reach.</p></div></li>
    <li class="sec-item">${T.icon('eye')} <div><strong>You control every permission</strong><p>Type X only does what you allow. Integrations run on the permissions you grant — and nothing more.</p></div></li>
    <li class="sec-item">${T.icon('plug')} <div><strong>Disconnect integrations anytime</strong><p>Revoke access to any connected tool in one step. When you disconnect, Type X stops using it immediately.</p></div></li>
    <li class="sec-item">${T.icon('trash')} <div><strong>Delete history &amp; activity logs</strong><p>Clear your history and activity logs whenever you want. Nothing is kept against your will.</p></div></li>
    <li class="sec-item">${T.icon('users')} <div><strong>Delete your account</strong><p>Leaving? Delete your account and all associated data goes with it. Your call, no hoops.</p></div></li>
  </ul>

  <div class="card card-glow-o card-pad" style="margin-top:24px">
    <div class="fi">${T.icon('alert','ic-lg')}</div>
    <p style="margin:8px 0 0"><strong>Type X does not bypass third-party security, anti-spam systems or platform restrictions.</strong></p>
    <p class="hint">Automation happens only where platforms allow it. Where it is restricted, Type X switches to assisted mode — drafting for you, never going around the rules.</p>
  </div>

  <div class="hero-actions" style="margin-top:24px">
    <button id="del-history" class="btn btn-ghost">Delete my history</button>
    <button id="del-account" class="btn btn-danger">Delete my account</button>
  </div>
</section>

<footer class="land-footer">
  <div class="land-footer-in">
    <div class="brand-col">
      <a href="#/" class="brand">${T.logo(24)}<span>TYPE&nbsp;X</span></a>
      <p class="tagline">Your AI that types, creates &amp; gets things done.</p>
    </div>
    <div class="cols">
      <div class="col"><h4>Product</h4><a href="#/app/workspace">Workspace</a><a href="#/app/templates">Templates</a><a href="#pricing">Pricing</a></div>
      <div class="col"><h4>Company</h4><a href="#/security">Security</a><a href="#/login">Log in</a><a href="#/signup">Get Started</a></div>
    </div>
  </div>
  <div class="copyright">&copy; 2026 TYPE X. v1 front-end demo.</div>
</footer>`;
    },
    mount(root){
      root.querySelector('#del-history').addEventListener('click', async () => {
        const ok = await T.ui.confirm({ title: 'Delete history?', message: 'This clears your Type X history and activity logs stored in this browser.', okLabel: 'Delete history', danger: true });
        if (ok) {
          T.store.del('typex_history');
          T.store.del('history');
          T.ui.toast('History deleted.', 'success');
        }
      });
      root.querySelector('#del-account').addEventListener('click', async () => {
        const ok = await T.ui.confirm({ title: 'Delete your account?', message: 'This removes your account and all Type X data stored in this browser. This cannot be undone.', okLabel: 'Delete my account', danger: true });
        if (ok) {
          T.store.clearAll();
          location.hash = '#/';
        }
      });
    }
  };
})();
