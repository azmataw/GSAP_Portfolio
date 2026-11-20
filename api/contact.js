import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, email, phone, message, website } = req.body || {};
  if (website) return res.status(200).json({ ok: true });
  if (![name, email, phone, message].every((x) => typeof x === 'string'))
    return res.status(400).json({ error: 'All fields are required.' });
  const n = name.trim(), e = email.trim(), p = phone.trim(), m = message.trim();
  if (!n || !p || !m || n.length > 150 || e.length > 254 || p.length > 40 || m.length > 5000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    return res.status(400).json({ error: 'Please check your contact information.' });
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return res.status(503).json({ error: 'Contact form not configured.' });
  try {
    const client = createClient(url, serviceKey, { auth: { persistSession: false } });
    // The Vercel-provided client IP header is preferred over user-supplied X-Forwarded-For.
    // Use a keyed digest so raw IP addresses and email addresses are not stored.
    const forwarded = req.headers['x-vercel-forwarded-for'];
    const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      || req.socket?.remoteAddress;
    const identities = [
      ...(clientIp ? ['ip:' + clientIp] : []),
      'email:' + e.toLowerCase(),
    ];
    for (const identity of identities) {
      const keyHash = createHmac('sha256', serviceKey).update(identity).digest('hex');
      const { data: allowed, error: limitError } = await client.rpc('try_contact_rate_limit', {
        p_key_hash: keyHash,
      });
      if (limitError) {
        console.error('Contact rate-limit check failed:', JSON.stringify({
          message: limitError.message,
          code: limitError.code,
        }));
        return res.status(503).json({ error: 'Contact form temporarily unavailable. Please try again later.' });
      }
      if (allowed !== true) {
        res.setHeader('Retry-After', '3600');
        return res.status(429).json({ error: 'Too many messages. Please try again later.' });
      }
    }
    const { error } = await client.from('contact_enquiries').insert({ name: n, email: e, phone: p, message: m });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Supabase PostgrestError is often a plain object, not an Error instance.
    // Log only diagnostic fields; never print API keys, headers or request payloads.
    const diagnostic = err && typeof err === 'object'
      ? {
          message: typeof err.message === 'string' ? err.message : 'unknown',
          code: typeof err.code === 'string' ? err.code : undefined,
          details: typeof err.details === 'string' ? err.details : undefined,
          hint: typeof err.hint === 'string' ? err.hint : undefined,
          status: typeof err.status === 'number' ? err.status : undefined,
        }
      : { message: typeof err === 'string' ? err : 'unknown' };
    console.error('Contact submission failed:', JSON.stringify(diagnostic));
    return res.status(500).json({ error: 'Unable to send message. Please try again.' });
  }
}
