(function(){
  const T = window.TypeX;

  const DEMO_FULL_TEXT = "Hi Sarah, thanks for reaching out. I'd be happy to help with that. Could you share a little more detail about the issue you're seeing? Once I have that, I'll get it sorted for you right away — and I'll follow up personally to make sure everything's resolved.";

  T.pages['landing'] = {
    title: 'TYPE X — AI That Types & Gets Things Done',
    render(){
      return `
<nav class="land-nav">
  <div class="land-nav-in">
    <a href="#/" class="brand">${T.logo(28)}<span>TYPE&nbsp;X</span></a>
    <div class="land-links">
      <a href="#product">Product</a>
      <a href="#how">How It Works</a>
      <a href="#features">Features</a>
      <a href="#usecases">Use Cases</a>
      <a href="#outreach">Outreach</a>
      <a href="#pricing">Pricing</a>
      <a href="#security">Security</a>
    </div>
    <div class="land-cta">
      <a href="#/login" class="btn btn-ghost btn-sm">Log in</a>
      <a href="#/signup" class="btn btn-primary btn-sm">Get Started</a>
    </div>
  </div>
</nav>

<header class="hero" id="product">
  <div class="hero-inner">
    <div class="hero-copy">
      <span class="sec-kicker">Meet TYPE X</span>
      <h1>Your AI That <span class="grad">Types, Creates</span> &amp; Gets Things Done</h1>
      <p class="hero-sub">Tell Type X what you want. It understands your intent and produces the right output in your style — wherever you work.</p>
      <div class="hero-actions">
        <a href="#/signup" class="btn btn-primary btn-lg">Start Using TYPE X</a>
        <a href="#how" class="btn btn-ghost btn-lg">See How It Works</a>
      </div>
    </div>
    <div class="hero-demo">
      <div class="demo-window">
        <div class="demo-bar"><span></span><span></span><span></span></div>
        <div class="demo-label">USER INPUT</div>
        <div class="demo-input">Write a professional but friendly reply to this customer.</div>
        <div class="demo-thinking">Understanding context&hellip;</div>
        <div class="demo-label">OUTPUT</div>
        <div class="demo-output" id="demo-output"></div>
        <div class="demo-btns">
          <a href="#/signup" class="btn btn-ghost btn-sm">Edit</a>
          <a href="#/signup" class="btn btn-ghost btn-sm">Copy</a>
          <a href="#/signup" class="btn btn-ai btn-sm">Type Output</a>
        </div>
        <div class="ratio-bar">
          <div class="ratio-track">
            <div class="ratio-out" style="width:60%"></div>
            <div class="ratio-in" style="width:40%"></div>
          </div>
          <div class="ratio-meta"><span>60% OUTPUT</span><span>40% INPUT</span></div>
        </div>
      </div>
    </div>
  </div>
</header>

<section class="section" id="philosophy">
  <span class="sec-kicker">Product philosophy</span>
  <h2>Less Typing. More Getting Things Done.</h2>
  <div class="philo-grid">
    <div class="philo-card"><div class="num">01</div><h3>TELL</h3><p>You say what you want in plain words — no commands to memorize, no menus to learn.</p></div>
    <div class="philo-card"><div class="num">02</div><h3>UNDERSTAND</h3><p>Type X reads your intent, context and style before it produces a single word.</p></div>
    <div class="philo-card dominant"><div class="num">03</div><h3>EXECUTE</h3><p>It creates the output — and with your approval, it takes the action.</p></div>
  </div>
</section>

<section class="section" id="how">
  <span class="sec-kicker">How it works</span>
  <h2>Four Steps. Zero Friction.</h2>
  <div class="steps-grid">
    <div class="step-card"><div class="num">01</div><h3>TELL TYPE X</h3><p>Describe the task in one sentence — write, reply, summarize, convert, send.</p></div>
    <div class="step-card"><div class="num">02</div><h3>TYPE X UNDERSTANDS</h3><p>It parses intent, tone and context, and shows you exactly what it understood.</p></div>
    <div class="step-card dominant"><div class="num">03</div><h3>TYPE X PRODUCES</h3><p>Output streams in your style — edit anything before it ever leaves the room.</p></div>
    <div class="step-card dominant"><div class="num">04</div><h3>TYPE X EXECUTES</h3><p>Approve once and it takes the action — sends, saves, schedules, files it away.</p></div>
  </div>
</section>

<section class="section" id="features">
  <span class="sec-kicker">Features</span>
  <h2>One Engine. Every Kind of Work.</h2>
  <div class="feat-grid">
    <div class="feat"><div class="fi">${T.icon('cpu','ic-lg')}</div><h3>Universal task engine</h3><p>Writing, replying, translating, summarizing, converting — one engine handles it all.</p></div>
    <div class="feat"><div class="fi">${T.icon('style','ic-lg')}</div><h3>Style engine</h3><p>Your tone, vocabulary and formatting — applied to every output automatically.</p></div>
    <div class="feat"><div class="fi">${T.icon('bolt','ic-lg')}</div><h3>Streaming output</h3><p>Watch the output type itself in real time. Stop, steer or regenerate mid-stream.</p></div>
    <div class="feat"><div class="fi">${T.icon('check','ic-lg')}</div><h3>Approval-first actions</h3><p>Nothing is sent, posted or changed without your explicit approval. Ever.</p></div>
    <div class="feat"><div class="fi">${T.icon('send','ic-lg')}</div><h3>Outreach mode</h3><p>Personalized messages built from real context — reviewed by you before sending.</p></div>
    <div class="feat"><div class="fi">${T.icon('plug','ic-lg')}</div><h3>Connections &amp; assisted mode</h3><p>Connect your tools and let Type X work where you already work, with guardrails.</p></div>
    <div class="feat"><div class="fi">${T.icon('template','ic-lg')}</div><h3>Templates library</h3><p>Start from proven templates for emails, posts, pitches and docs — then make them yours.</p></div>
    <div class="feat"><div class="fi">${T.icon('chart','ic-lg')}</div><h3>Analytics</h3><p>See what you produced, how much time you saved, and where Type X helps most.</p></div>
  </div>
</section>

<section class="section" id="usecases">
  <span class="sec-kicker">Use cases</span>
  <h2>Whatever You Type, Type X Can Help.</h2>
  <div class="use-grid">
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Freelancers</h3><p>Proposals, invoices and client updates in your voice.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Students</h3><p>Notes, essays and study plans that actually make sense.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Developers</h3><p>Docs, comments, READMEs and commit messages without the slog.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Writers</h3><p>Drafts, rewrites and outlines at the speed of thought.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Creators</h3><p>Scripts, captions and hooks tuned to each platform.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Sales Teams</h3><p>Follow-ups, sequences and battle cards that sound human.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Customer Support</h3><p>Fast, accurate replies in your brand's tone.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Recruiters</h3><p>Outreach, screenings and offer letters — personal, every time.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Businesses</h3><p>SOPs, reports and announcements minus the busywork.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Social Media Managers</h3><p>A week of content planned and written in an afternoon.</p></div>
    <div class="use-card"><div class="fi">${T.icon('users','ic-lg')}</div><h3>Job Seekers</h3><p>Resumes, cover letters and thank-you notes that stand out.</p></div>
  </div>
</section>

<section class="section" id="outreach">
  <span class="sec-kicker">Outreach mode</span>
  <h2>Outreach That Stays Personal — and Legitimate.</h2>
  <p class="prose">Type X drafts personalized messages from real context about each person — never generic blasts. You review and approve every message before anything is sent. It never bypasses spam filters, rate limits, CAPTCHAs or platform restrictions. Where automation is restricted, assisted mode drafts the work and you send it in one tap.</p>
  <div class="hero-actions"><a href="#/signup" class="btn btn-ai btn-lg">Explore Outreach Mode</a></div>
</section>

<section class="section" id="pricing">
  <span class="sec-kicker">Pricing</span>
  <h2>Simple Plans. Serious Output.</h2>
  <div class="price-grid">
    <div class="price-card">
      <h3>FREE</h3>
      <div class="amt">$0</div><div class="per">forever</div>
      <ul class="sec-list">
        <li class="sec-item">Core typing &amp; output engine</li>
        <li class="sec-item">Limited daily outputs</li>
        <li class="sec-item">Starter template library</li>
        <li class="sec-item">Basic history</li>
      </ul>
      <a href="#/signup" class="btn btn-ghost btn-block">Get Started</a>
      <p class="price-note">Placeholder pricing — final pricing announced at launch.</p>
    </div>
    <div class="price-card featured">
      <h3>PRO</h3>
      <div class="amt">$12</div><div class="per">per month</div>
      <ul class="sec-list">
        <li class="sec-item">Unlimited outputs</li>
        <li class="sec-item">Style engine with custom styles</li>
        <li class="sec-item">Outreach mode with approvals</li>
        <li class="sec-item">Connections &amp; assisted mode</li>
        <li class="sec-item">Analytics dashboard</li>
      </ul>
      <a href="#/signup" class="btn btn-primary btn-block">Get Started</a>
      <p class="price-note">Placeholder pricing — final pricing announced at launch.</p>
    </div>
    <div class="price-card">
      <h3>BUSINESS</h3>
      <div class="amt">$39</div><div class="per">per month</div>
      <ul class="sec-list">
        <li class="sec-item">Everything in PRO</li>
        <li class="sec-item">Team workspaces</li>
        <li class="sec-item">Shared templates &amp; styles</li>
        <li class="sec-item">Priority processing</li>
        <li class="sec-item">Usage controls &amp; roles</li>
        <li class="sec-item">Team analytics</li>
      </ul>
      <a href="#/signup" class="btn btn-ghost btn-block">Get Started</a>
      <p class="price-note">Placeholder pricing — final pricing announced at launch.</p>
    </div>
  </div>
</section>

<section class="section" id="security">
  <span class="sec-kicker">Security</span>
  <h2>Built to Be Trusted.</h2>
  <ul class="sec-list">
    <li class="sec-item"><strong>Secure authentication</strong> — your account is protected from the first login.</li>
    <li class="sec-item"><strong>Encrypted storage</strong> — your data is stored encrypted, not in plain text.</li>
    <li class="sec-item"><strong>No API keys in the frontend</strong> — credentials never live in the browser.</li>
    <li class="sec-item"><strong>You control permissions</strong> — connect integrations and disconnect anytime.</li>
    <li class="sec-item"><strong>Delete history and account anytime</strong> — your data leaves when you say so.</li>
    <li class="sec-item">Type X does not bypass third-party security, anti-spam systems or platform restrictions.</li>
  </ul>
  <div class="hero-actions"><a href="#/security" class="btn btn-ghost">Read the Security Page</a></div>
</section>

<footer class="land-footer">
  <div class="land-footer-in">
    <div class="brand-col">
      <a href="#/" class="brand">${T.logo(24)}<span>TYPE&nbsp;X</span></a>
      <p class="tagline">Your AI that types, creates &amp; gets things done.</p>
    </div>
    <div class="cols">
      <div class="col"><h4>Product</h4><a href="#/app/workspace">Workspace</a><a href="#/app/templates">Templates</a><a href="#/app/outreach">Outreach</a><a href="#pricing">Pricing</a></div>
      <div class="col"><h4>Company</h4><a href="#/security">Security</a><a href="#/help">Help</a><a href="#/login">Log in</a><a href="#/signup">Get Started</a></div>
    </div>
  </div>
  <div class="copyright">&copy; 2026 TYPE X. v1 front-end demo.</div>
</footer>`;
    },
    mount(root){
      const out = root.querySelector('#demo-output');
      if (!out) return;
      const text = DEMO_FULL_TEXT;
      let i = 0;
      const self = this;
      function tick(){
        i++;
        out.textContent = text.slice(0, i);
        if (i < text.length) {
          self._demoTimer = setTimeout(tick, 14);
        } else {
          self._demoTimer = setTimeout(() => { i = 0; out.textContent = ''; self._demoTimer = setTimeout(tick, 500); }, 4000);
        }
      }
      tick();
    },
    unmount(){
      if (this._demoTimer) { clearTimeout(this._demoTimer); this._demoTimer = null; }
    }
  };
})();
