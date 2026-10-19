# CLINT X — "Tell Clint X what to do. Clint X gets it done."

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
  "Clint X prepared this action." with EDIT / APPROVE & TYPE / CANCEL while
  *Require Approval Before External Actions* is ON (default).
- **No voice anywhere** — keyboard/text input only, by design.
- **No fake integrations** — restricted platforms are labeled ASSISTED MODE;
  outreach is personalized-only, no spam/rate-limit bypass.

## Phase 2 (not in v1)

Real backend API + database, real authentication, cloud AI provider
(`js/ai/providers/api.js` is a stub waiting for it), real OAuth connections,
server-side outreach sending. The UI contracts are already shaped for it:
`TypeX.ai.generate()` keeps the same signature when the provider swaps.

## Real sending — WhatsApp via respond.io (scaffold)

`api/send.js` is a Vercel serverless endpoint (deployed, **not wired into the
UI yet** — wiring happens after the WhatsApp channel is connected in
respond.io and a test send succeeds).

**Contract**

```http
POST /api/send   Content-Type: application/json
{ "channel": "whatsapp", "to": "923096997438", "message": "Hi!" }

→ 200 { ok:true, provider:"respondio", channel:"whatsapp", to:"923096997438",
        messageId:"...", contactId:"..." }
→ 4xx/5xx { ok:false, code:"not_configured"|"channel_not_connected"|..., message:"..." }
```

**Setup**

1. Vercel Dashboard → the `typex` project → Settings → Environment Variables:
   - `RESPONDIO_API_KEY` = your respond.io API key (Settings → Developer/API
     in respond.io). **Never put this key in frontend code.**
   - `RESPONDIO_WHATSAPP_CHANNEL_ID` = the WhatsApp channel id (optional;
     find it in respond.io → Settings → Channels).
   - `TX_SEND_SECRET` = any random string (optional; if set, every request
     must include it as the `X-TX-Secret` header).
2. Redeploy (env vars need a fresh deployment to take effect).
3. Test:
   ```bash
   curl -X POST https://typex-zenithai2007-5539s-projects.vercel.app/api/send \
     -H 'Content-Type: application/json' \
     -d '{"channel":"whatsapp","to":"<your-own-number>","message":"CLINT X test"}'
   ```
   Test on your own number first. Before that works, the WhatsApp channel
   must be **connected and verified** in respond.io (trial ends 2026-10-20 —
   connect it before then or messaging stops working).

**Notes**

- API shapes follow public respond.io API v2 integration guides; verify
  against https://docs.respond.io during the first live test — endpoint
  paths are isolated in `api/_rio.js` (shared by both endpoints).
- WhatsApp Business rules apply: the first message to a contact outside the
  24h window must use an approved template — handle in the UI wiring step.
- No key input fields were added to the UI on purpose; the key lives only in
  Vercel env vars.

## Agent Mode (`#/agent`) — conversation loop

One instruction → the agent runs the whole loop: send → wait → on reply,
generate a contextual reply (on-device AI, fed the conversation history) →
approval card or auto-send → repeat.

- **Instruction bar** (keypad-styled): instruction + contact name + phone +
  channel (WhatsApp; more later) + START AGENT.
- **Reply mode**: "Har reply se pehle approval lo" (default ON) vs Auto mode
  (clear warning label; sends without asking).
- **Live thread**: sent/received bubbles; **activity log**: timestamped lines
  with PAUSE / RESUME / STOP (agent never acts while paused/stopped).
- **Approval cards**: "Clint X prepared this reply." + exact text +
  APPROVE & SEND / EDIT / SKIP.

**Polling architecture (v1, honest)**: client-side `setInterval` every 15s
calls the new endpoint below while the Agent tab is open. Server-side
cron/webhooks come later.

```http
GET /api/replies?contactId=<id>&since=<ms-epoch>&limit=20
GET /api/replies?to=<phone-digits>&since=<ISO>   (contact resolved by phone)

→ 200 { ok:true, contactId, conversationId, checkedAt,
        messages:[ { id, dir:"in"|"out", text, at } ] }   // dir:"in" = from contact
→ 4xx/5xx { ok:false, code:"not_configured"|"contact_not_found"|"channel_not_connected"|..., message:"..." }
```

- `since` filters server-side; the page additionally dedupes by message id.
- Conversation/message field shapes are normalized defensively
  (`normMessage` in `api/_rio.js`) — log one raw response on the first live
  test and tighten the mapping if needed.
- Without `RESPONDIO_API_KEY` the page shows a Roman-Urdu setup banner
  (connect WhatsApp in respond.io → set the env var → redeploy → START).
