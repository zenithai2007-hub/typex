'use strict';

/* ============================================================================
   TYPE X — inbound replies: GET /api/replies
   ----------------------------------------------------------------------------
   Polls respond.io for new inbound messages from one contact so the Agent
   Mode loop can detect replies and answer them.

   Query:
     contactId=<respond.io contact id>   (preferred — /api/send returns it)
     ...or to=<phone digits>              (resolved via list + match)
     since=<ms epoch or ISO>              (only messages after this; default 0)
     limit=<1..50>                        (max messages returned; default 20)

   Response:
     200 { ok:true, contactId, conversationId, checkedAt,
           messages:[ { id, dir:'in'|'out', text, at } ] }   // dir:'in' = from contact
     4xx/5xx { ok:false, code, message, detail? }

   Env: same as /api/send (RESPONDIO_API_KEY required).

   NOTE: conversation/message shapes are normalized defensively in api/_rio.js
   (normMessage) because exact field names are unverified without a live key.
   During the first live test, log one raw response and tighten the mapping.
   ========================================================================== */

const R = require('./_rio');

function pickConversation(list, contactId) {
  if (!Array.isArray(list) || !list.length) return null;
  // Prefer open conversations, newest first.
  const sorted = list.slice().sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
  const open = sorted.find(c => {
    const st = String(c.status || c.state || 'open').toLowerCase();
    return st === 'open' || st === 'active';
  });
  return open || sorted[0];
}

function convMatchesContact(c, contactId) {
  const ids = [
    c.contactId, c.contact && c.contact.id,
    c.contact_id, c.contactID,
  ].filter(Boolean).map(String);
  return ids.includes(String(contactId));
}

async function listConversations(key, contactId) {
  // Try a filtered query first (param name unverified), fall back to full list.
  const attempts = [
    '/conversations?contactId=' + encodeURIComponent(contactId),
    '/conversations',
  ];
  let lastErr = null;
  for (const path of attempts) {
    const r = await R.rio(path, key);
    if (r.status >= 200 && r.status < 300) {
      const raw = r.data;
      const list = Array.isArray(raw) ? raw
        : (raw && (raw.conversations || raw.data || raw.items)) || [];
      // If the API honored the filter, use as-is; otherwise match locally.
      const matched = list.filter(c => convMatchesContact(c, contactId));
      return matched.length ? matched : list;
    }
    lastErr = r;
  }
  throw R.rioError('list-conversations', lastErr);
}

module.exports = async (req, res) => {
  R.cors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return R.fail(res, 405, 'method_not_allowed', 'Use GET with query params.');
  }

  const q = req.query || {};
  let contactId = q.contactId || null;
  const sinceRaw = q.since;
  const since = sinceRaw ? new Date(sinceRaw).getTime() : 0;
  const limit = Math.min(50, Math.max(1, parseInt(q.limit, 10) || 20));

  let key;
  try { key = R.getKey(); }
  catch (e) { return R.fail(res, e.status || 500, e.code, e.publicMessage); }

  try {
    if (!contactId) {
      const phone = R.normalizePhone(q.to);
      if (!phone) {
        return R.fail(res, 400, 'missing_recipient',
          'Provide ?contactId=<id> or ?to=<phone digits>.');
      }
      contactId = await R.resolveContactByPhone(key, phone);
      if (!contactId) {
        return R.fail(res, 404, 'contact_not_found',
          'No respond.io contact found for this number. Send them a first message via /api/send first.');
      }
    }

    const convs = await listConversations(key, contactId);
    const conv = pickConversation(convs, contactId);
    if (!conv) {
      return res.status(200).json({
        ok: true, contactId: String(contactId), conversationId: null,
        checkedAt: Date.now(), messages: [],
      });
    }
    const convId = conv.id || conv.conversationId || conv._id;
    if (!convId) {
      return R.fail(res, 502, 'provider_error',
        'respond.io returned a conversation without an id.', conv);
    }

    const mr = await R.rio('/conversations/' + encodeURIComponent(convId) + '/messages', key);
    if (mr.status < 200 || mr.status >= 300) throw R.rioError('list-messages', mr);
    const rawList = Array.isArray(mr.data) ? mr.data
      : (mr.data && (mr.data.messages || mr.data.data || mr.data.items)) || [];

    const sinceMs = Number.isFinite(since) ? since : 0;
    const messages = rawList
      .map(R.normMessage)
      .filter(Boolean)
      .filter(m => m.at >= sinceMs)
      .sort((a, b) => a.at - b.at)
      .slice(-limit);

    return res.status(200).json({
      ok: true,
      contactId: String(contactId),
      conversationId: String(convId),
      checkedAt: Date.now(),
      messages,
    });
  } catch (err) {
    return R.fail(res, err.status || 500, err.code || 'internal_error',
      err.publicMessage || 'Reply check failed.', err.detail);
  }
};
