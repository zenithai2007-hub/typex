'use strict';

/* ============================================================================
   CLINT X — shared respond.io API v2 helpers for the serverless api/ endpoints.

   Verified shapes (2026-10-19) against respond.io API v2 integration docs:
     POST /v2/contacts   { name?, phoneNumber } | { channelId, phoneNumber }
     POST /v2/messages   { channelId?, contactId, message: { text } }
     GET  /v2/conversations
     GET  /v2/conversations/{id}/messages

   Still unverified (no live key yet — flag for first live test):
     - exact query params for searching contacts by phone (we list + match locally)
     - conversation list filter params (we list + match locally by contact id)
     - exact inbound-message field names (we normalize defensively)

   Docs: https://docs.respond.io (check during first live test)
   ========================================================================== */

const RIO_BASE = 'https://api.respond.io/v2';

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

function cors(res, methods) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods || 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TX-Secret');
}

function getKey() {
  const key = process.env.RESPONDIO_API_KEY;
  if (!key) {
    throw providerError(503, 'not_configured',
      'RESPONDIO_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables, then redeploy.');
  }
  return key;
}

function normalizePhone(to) {
  if (to === undefined || to === null) return null;
  const digits = String(to).replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

async function rio(path, key, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(RIO_BASE + path, {
      method,
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw providerError(502, 'provider_unreachable',
      'Could not reach the respond.io API (network error).', String((e && e.message) || e));
  }
  let data = null;
  try { data = await res.json(); } catch (_) { /* non-JSON body */ }
  return { status: res.status, data };
}

function rioError(action, r) {
  const detail = (r.data && (r.data.message || r.data.error)) ? (r.data.message || r.data.error) : r.data;
  const text = JSON.stringify(detail || '').toLowerCase();
  if (/channel.*(not|isn't|is not).*(connect|active|enabled)|no.*active.*channel|channel not found/i.test(text)) {
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
  if (r.status === 404) {
    return providerError(502, 'provider_not_found',
      `respond.io ${action} failed: resource not found (HTTP 404). The API shape may have changed — check the endpoint against https://docs.respond.io.`,
      detail);
  }
  return providerError(502, 'provider_error',
    `respond.io ${action} failed (HTTP ${r.status}).`, detail);
}

/* Find a contact id by phone number: list contacts and match digits locally.
   (Exact server-side search params are unverified — this works regardless.) */
async function resolveContactByPhone(key, phone) {
  const r = await rio('/contacts', key);
  if (r.status < 200 || r.status >= 300) throw rioError('list-contacts', r);
  const list = Array.isArray(r.data) ? r.data
    : (r.data && (r.data.contacts || r.data.data || r.data.items)) || [];
  const want = String(phone).replace(/[^\d]/g, '');
  for (const c of list) {
    const phones = [c.phoneNumber, c.phone, c.mobile, c.whatsapp]
      .concat(c.channels ? c.channels.map(ch => ch.phoneNumber || ch.phone) : [])
      .filter(Boolean).map(p => String(p).replace(/[^\d]/g, ''));
    if (phones.some(p => p === want || p.endsWith(want) || want.endsWith(p))) {
      return c.id || c.contactId || c._id || null;
    }
  }
  return null;
}

/* Normalize one message from respond.io's conversation-messages response.
   Field names vary across docs — check each plausible shape. */
function normMessage(m) {
  if (!m || typeof m !== 'object') return null;
  const text = (m.message && m.message.text) || m.text || m.body || m.content || '';
  if (!String(text).trim()) return null;
  const dirRaw = String(m.direction || m.type || m.from || '').toLowerCase();
  const inbound = m.fromContact === true || m.isFromContact === true ||
    /inbound|incoming|received/.test(dirRaw) || dirRaw === 'contact';
  const atRaw = m.createdAt || m.timestamp || m.sentAt || m.created_at || m.time;
  const at = atRaw ? new Date(atRaw).getTime() : 0;
  return {
    id: String(m.id || m.messageId || m._id || (at + ':' + text).slice(0, 64)),
    dir: inbound ? 'in' : 'out',
    text: String(text).trim(),
    at: Number.isFinite(at) ? at : 0,
  };
}

module.exports = {
  fail, providerError, cors, getKey, normalizePhone, rio, rioError,
  resolveContactByPhone, normMessage,
};
