# TYPE X — "Tell Type X what to do. Type X gets it done."

A universal AI typing & execution agent. **v1 is a front-end demo**: a complete,
production-quality static single-page app with a working local AI engine
(simulated provider), cinematic 3D intro, landing page, and a full authenticated
dashboard (workspace, output panel, templates, styles, outreach, connections,
automations, analytics, history, settings, security).

## Run it

No build step. Serve the folder statically:

```bash
cd ~/workspace/typex
python3 -m http.server 8080
# open http://localhost:8080
```

The live deployment is on Vercel (static, zero config).

## What's real in v1

- **Local AI engine** (`js/ai/`) — modular provider interface. The `local`
  provider genuinely detects task type (email, reply, rewrite, translate,
  caption, summary, proposal…), applies tone / language (English, Roman Urdu,
  Urdu) / length / format, and streams output with a typewriter effect.
- **Persistence** — history, templates, styles, leads, automations, settings
  all live in `localStorage`. Demo auth (login-first) is local-only.
- **Approval gate** — external actions (TYPE OUTPUT / send) always show
  "Type X prepared this action." with EDIT / APPROVE & TYPE / CANCEL while
  *Require Approval Before External Actions* is ON (default).
- **No voice anywhere** — keyboard/text input only, by design.
- **No fake integrations** — restricted platforms are labeled ASSISTED MODE;
  outreach is personalized-only, no spam/rate-limit bypass.

## Phase 2 (not in v1)

Real backend API + database, real authentication, cloud AI provider
(`js/ai/providers/api.js` is a stub waiting for it), real OAuth connections,
server-side outreach sending. The UI contracts are already shaped for it:
`TypeX.ai.generate()` keeps the same signature when the provider swaps.
