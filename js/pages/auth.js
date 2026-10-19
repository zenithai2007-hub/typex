(function(){
  const T = window.TypeX;

  function smallPrint(){
    return `<p class="hint">v1 demo — accounts live in this browser only. Real authentication ships in Phase 2.</p>`;
  }

  function finishAuth(name, email){
    T.store.set('user', { name: name, email: email, plan: 'Free plan', createdAt: Date.now() });
    T.ui.toast('Welcome to TYPE X', 'success');
    T.router.navigate('app/workspace');
  }

  T.pages['auth-login'] = {
    title: 'Log in to TYPE X',
    render(){
      return `
<div class="auth-wrap">
  <div class="auth-card card">
    <a href="#/" class="brand">${T.logo(36)}<span>TYPE&nbsp;X</span></a>
    <h1>Log in to TYPE X</h1>
    <p class="sub">Welcome back. Your words are waiting.</p>
    <form id="login-form">
      <div class="field">
        <label class="label" for="login-email">Email</label>
        <input class="input" type="email" id="login-email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="field">
        <label class="label" for="login-password">Password</label>
        <input class="input" type="password" id="login-password" placeholder="Your password" autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-ai btn-block">Log in</button>
      <button type="button" id="demo-login" class="btn btn-ghost btn-block">Continue as demo</button>
    </form>
    <div class="auth-alt">New to TYPE X? <a href="#/signup">Create an account</a></div>
    ${smallPrint()}
  </div>
</div>`;
    },
    mount(root){
      const form = root.querySelector('#login-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = root.querySelector('#login-email').value.trim();
        const password = root.querySelector('#login-password').value;
        if (!email || !password) { T.ui.toast('Enter your email and password.', 'error'); return; }
        if (!email.includes('@')) { T.ui.toast('Enter a valid email address.', 'error'); return; }
        finishAuth(email.split('@')[0], email);
      });
      root.querySelector('#demo-login').addEventListener('click', () => {
        finishAuth('Demo User', 'demo@typex.app');
      });
    }
  };

  T.pages['auth-signup'] = {
    title: 'Create your TYPE X account',
    render(){
      return `
<div class="auth-wrap">
  <div class="auth-card card">
    <a href="#/" class="brand">${T.logo(36)}<span>TYPE&nbsp;X</span></a>
    <h1>Create your TYPE X account</h1>
    <p class="sub">Start typing. Type X does the rest.</p>
    <div class="auth-alt" style="margin-top:0">Already have an account? <a href="#/login">Log in</a></div>
    <form id="signup-form">
      <div class="field">
        <label class="label" for="signup-name">Name</label>
        <input class="input" type="text" id="signup-name" placeholder="Your name" autocomplete="name">
      </div>
      <div class="field">
        <label class="label" for="signup-email">Email</label>
        <input class="input" type="email" id="signup-email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="field">
        <label class="label" for="signup-password">Password</label>
        <input class="input" type="password" id="signup-password" placeholder="Choose a password" autocomplete="new-password">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Create account</button>
    </form>
    ${smallPrint()}
  </div>
</div>`;
    },
    mount(root){
      const form = root.querySelector('#signup-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = root.querySelector('#signup-name').value.trim();
        const email = root.querySelector('#signup-email').value.trim();
        const password = root.querySelector('#signup-password').value;
        if (!name || !email || !password) { T.ui.toast('Fill in your name, email and password.', 'error'); return; }
        if (!email.includes('@')) { T.ui.toast('Enter a valid email address.', 'error'); return; }
        finishAuth(name, email);
      });
    }
  };
})();
