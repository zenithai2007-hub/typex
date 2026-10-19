'use strict';

/* ============================================================================
   TYPE X — real-send: POST /api/send
   ----------------------------------------------------------------------------
   Vercel serverless endpoint. Sends a message through a provider.

   Request (JSON):
     { "channel": "whatsapp", "to": "923001234567", "message": "Hi!",
       "name": "Optional Name", "contactId": "optional-known-id" }

   Response:
     200 { ok:true, provider, channel, to, contactId, messageId? }
     4xx/5xx { ok:false, code, message, detail? }

   Env (Vercel → Project Settings → Environment Variables):
     RESPONDIO_API_KEY            required — respond.io API key (Bearer token)
     RESPONDIO_WHATSAPP_CHANNEL_ID optional — WhatsApp channel id (else inferred)
     TX_SEND_SECRET               optional — if set, requests must send it as
                                  the X-TX-Secret header (cheap abuse guard)

   NOTE: respond.io API v2 shapes verified against public integration guides
   (2026-10-19). Verify against https://docs.respond.io during the first live
   test — endpoint paths are isolated in api/_rio.js so fixes are one-liners.
   ========================================================================== */

const R = require('./_rio');

const providers = {
  respondio: sendViaRespondio,
  // future: twilio, meta_cloud, ...
};

async function sendViaRespondio({ to, message, name, contactId: knownId }) {
  const key = R.getKey();
  const channelId = process.env.RESPONDIO_WHATSAPP_CHANNEL_ID || undefined;
  const phoneNumber = '+' + to;

  // 1. Resolve the contact (reuse known id, create, or resolve existing by phone)
  let contactId = knownId || null;
  if (!contactId) {
    const created = await R.rio('/contacts', key, {
      method: 'POST',
      body: { ...(channelId ? { channelId } : {}), ...(name ? { name } : {}), phoneNumber },
    });
    if (created.status >= 200 && created.status < 300) {
      contactId = created.data && (created.data.id || created.data.contactId) || null;
    } else {
      const dup = JSON.stringify(created.data || '').toLowerCase();
      if (/already exists|duplicate|conflict/.test(dup) || created.status === 409) {
        // Contact already exists — resolve its id by listing + matching phone.
        contactId = await R.resolveContactByPhone(key, to);
        if (!contactId) {
          throw R.providerError(502, 'contact_not_resolved',
            'This number is already a respond.io contact but its id could not be resolved. ' +
            'Find the contact id in respond.io → Contacts and retry with { "contactId": "<id>" } in the request.',
            created.data);
        }
      } else {
        throw R.rioError('create-contact', created);
      }
    }
  }
  if (!contactId) {
    throw R.providerError(502, 'provider_error',
      'respond.io did not return a contact id.', null);
  }

  // 2. Send the message
  const sent = await R.rio('/messages', key, {
    method: 'POST',
    body: { ...(channelId ? { channelId } : {}), contactId, message: { text: message } },
  });
  if (sent.status < 200 || sent.status >= 300) throw R.rioError('send-message', sent);

  return { messageId: (sent.data && (sent.data.id || sent.data.messageId)) || null, contactId };
}

module.exports = async (req, res) => {
  R.cors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return R.fail(res, 405, 'method_not_allowed', 'Use POST with a JSON body.');
  }

  if (process.env.TX_SEND_SECRET) {
    if (req.headers['x-tx-secret'] !== process.env.TX_SEND_SECRET) {
      return R.fail(res, 401, 'unauthorized', 'Missing or invalid X-TX-Secret header.');
    }
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};
  const { channel, to, message, provider, name, contactId } = body;

  if (channel !== 'whatsapp') {
    return R.fail(res, 400, 'unsupported_channel', 'Only "whatsapp" is supported right now.');
  }
  const phone = R.normalizePhone(to);
  if (!phone) {
    return R.fail(res, 400, 'invalid_recipient', '"to" must be a phone number (7–15 digits).');
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return R.fail(res, 400, 'empty_message', '"message" must be a non-empty string.');
  }
  if (message.length > 4000) {
    return R.fail(res, 400, 'message_too_long', '"message" exceeds 4000 characters.');
  }

  const fnName = provider || 'respondio';
  const fn = providers[fnName];
  if (!fn) return R.fail(res, 400, 'unknown_provider', `Unknown provider "${fnName}".`);

  try {
    const result = await fn({ to: phone, message: message.trim(), name, contactId });
    return res.status(200).json({ ok: true, provider: fnName, channel, to: phone, ...result });
  } catch (err) {
    return R.fail(res, err.status || 500, err.code || 'internal_error',
      err.publicMessage || 'Send failed.', err.detail);
  }
};
