'use strict';

/* ============================================================================
   TYPE X — real-send scaffold: POST /api/send
   ----------------------------------------------------------------------------
   Vercel serverless endpoint. Sends a message through a provider.

   Request (JSON):
     { "channel": "whatsapp", "to": "923001234567", "message": "Hi!" }

   Response:
     200 { ok:true, provider, channel, to, messageId? }
     4xx/5xx { ok:false, code, message, detail? }

   Env (Vercel → Project Settings → Environment Variables):
     RESPONDIO_API_KEY            required — respond.io API key (Bearer token)
     RESPONDIO_WHATSAPP_CHANNEL_ID optional — WhatsApp channel id (else inferred)
     TX_SEND_SECRET               optional — if set, requests must send it as
                                  the X-TX-Secret header (cheap abuse guard)

   NOTE: respond.io API shapes below follow public integration guides for
   respond.io API v2 — verify against https://docs.respond.io during the first
   live test. Endpoint paths are isolated in RIO_API so fixes are one-liners.
   This endpoint is NOT wired into the UI yet — wire it after the WhatsApp
   channel is connected in respond.io and a test send succeeds.
   ========================================================================== */

const RIO_API = {
  base: 'https://api.respond.io/v2',
  createContact: '/contacts', // POST { channelId?, phoneNumber }
  sendMessage: '/messages',   // POST { channelId?, contactId, message:{text} }
};

const providers = {
  respondio: sendViaRespondio,
  // future: twilio, meta_cloud, ...
};

function fail(res, status, code, message, detail) {
  const body = { ok: false, code, message };
  if (detail !== undefined) body.detail = detail;
  return res.status(status).json(body);
}

function providerError(status, code, publicMessage, detail) {
  const e = new Error(publicMessage);
  e.status = status; e.code = code;
  e.publicMessage = publicMessage; e.detail = detail;
  return e;
}

function normalizePhone(to) {
  if (to === undefined || to === null) return null;
  const digits = String(to).replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

async function rio(path, key, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(RIO_API.base + path, {
      method,
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw providerError(502, 'provider_unreachable',
      'Could not reach the respond.io API (network error).', String(e && e.message || e));
  }
  let data = null;
  try { data = await res.json(); } catch (_) { /* non-JSON body */ }
  return { status: res.status, data };
}

function rioError(action, r) {
  const detail = r.data && (r.data.message || r.data.error) ? (r.data.message || r.data.error) : r.data;
  const text = JSON.stringify(detail || '').toLowerCase();
  if (/channel.*(not|isn't|is not).*(connect|active|enabled)|no.*active.*channel/i.test(text)) {
    return providerError(502, 'channel_not_connected',
      'The WhatsApp channel is not connected in respond.io. Connect it first (respond.io → Settings → Channels), then retry.',
      detail);
  }
  if (r.status === 401 || r.status === 403) {
    return providerError(502, 'provider_auth_failed',
      'respond.io rejected the API key. Check RESPONDIO_API_KEY in Vercel env vars.', detail);
  }
  if (r.status === 429) {
    return providerError(502, 'provider_rate_limited',
      'respond.io rate-limited the request. Wait a minute and retry.', detail);
  }
  return providerError(502, 'provider_error',
    `respond.io ${action} failed (HTTP ${r.status}).`, detail);
}

async function sendViaRespondio({ to, message }) {
  const key = process.env.RESPONDIO_API_KEY;
  if (!key) {
    throw providerError(503, 'not_configured',
      'RESPONDIO_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables, then redeploy.');
  }
  const channelId = process.env.RESPONDIO_WHATSAPP_CHANNEL_ID || undefined;
  const phoneNumber = '+' + to;

  // 1. Ensure the contact exists on respond.io
  let contactId = null;
  const created = await rio(RIO_API.createContact, key, {
    method: 'POST',
    body: { ...(channelId ? { channelId } : {}), phoneNumber },
  });
  if (created.status >= 200 && created.status < 300) {
    contactId = created.data && (created.data.id || created.data.contactId) || null;
  } else {
    const dup = JSON.stringify(created.data || '').toLowerCase();
    if (!/already exists|duplicate|conflict/.test(dup)) throw rioError('create-contact', created);
    // Contact already exists — caller can pass its id directly; scaffold stops here
    // with a clear, actionable error instead of guessing search endpoints.
    throw providerError(502, 'contact_exists',
      'This number is already a respond.io contact, but its contact id could not be resolved automatically. ' +
      'Find the contact id in respond.io → Contacts and retry with { "contactId": "<id>" } added to the request.',
      created.data);
  }
  if (!contactId) {
    throw providerError(502, 'provider_error',
      'respond.io created the contact but returned no id.', created.data);
  }

  // 2. Send the message
  const sent = await rio(RIO_API.sendMessage, key, {
    method: 'POST',
    body: { ...(channelId ? { channelId } : {}), contactId, message: { text: message } },
  });
  if (sent.status < 200 || sent.status >= 300) throw rioError('send-message', sent);

  return { messageId: (sent.data && (sent.data.id || sent.data.messageId)) || null, contactId };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TX-Secret');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return fail(res, 405, 'method_not_allowed', 'Use POST with a JSON body.');
  }

  if (process.env.TX_SEND_SECRET) {
    if (req.headers['x-tx-secret'] !== process.env.TX_SEND_SECRET) {
      return fail(res, 401, 'unauthorized', 'Missing or invalid X-TX-Secret header.');
    }
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};
  const { channel, to, message, provider } = body;

  if (channel !== 'whatsapp') {
    return fail(res, 400, 'unsupported_channel', 'Only "whatsapp" is supported right now.');
  }
  const phone = normalizePhone(to);
  if (!phone) {
    return fail(res, 400, 'invalid_recipient', '"to" must be a phone number (7–15 digits).');
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return fail(res, 400, 'empty_message', '"message" must be a non-empty string.');
  }
  if (message.length > 4000) {
    return fail(res, 400, 'message_too_long', '"message" exceeds 4000 characters.');
  }

  const name = provider || 'respondio';
  const fn = providers[name];
  if (!fn) return fail(res, 400, 'unknown_provider', `Unknown provider "${name}".`);

  try {
    const result = await fn({ to: phone, message: message.trim() });
    return res.status(200).json({ ok: true, provider: name, channel, to: phone, ...result });
  } catch (err) {
    return fail(res, err.status || 500, err.code || 'internal_error',
      err.publicMessage || 'Send failed.', err.detail);
  }
};
