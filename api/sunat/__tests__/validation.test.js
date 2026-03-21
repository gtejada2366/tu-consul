import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Crypto module tests ─────────────────────────────────────────────
describe('crypto – encrypt / decrypt', () => {
  // Set a valid 32-byte (64 hex char) encryption key for tests
  const TEST_KEY = 'a]b'.repeat(10) + 'ab'; // won't work; use hex below
  const HEX_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = HEX_KEY;
  });

  // Dynamic import so env var is available when module initialises
  async function loadCrypto() {
    // Re-import each time to pick up env changes
    const mod = await import('../_lib/crypto.js');
    return mod;
  }

  it('encrypt then decrypt round-trips correctly', async () => {
    const { encrypt, decrypt } = await loadCrypto();
    const plaintext = 'mi-clave-secreta-SOL';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(':'); // format is iv:data:tag
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypt returns empty string for falsy input', async () => {
    const { encrypt } = await loadCrypto();
    expect(encrypt('')).toBe('');
    expect(encrypt(null)).toBe('');
    expect(encrypt(undefined)).toBe('');
  });

  it('decrypt returns empty string for falsy input', async () => {
    const { decrypt } = await loadCrypto();
    expect(decrypt('')).toBe('');
    expect(decrypt(null)).toBe('');
    expect(decrypt(undefined)).toBe('');
  });

  it('decrypt falls back to plaintext for legacy un-encrypted values', async () => {
    const { decrypt } = await loadCrypto();
    const legacy = 'plain-text-password-no-colons';
    expect(decrypt(legacy)).toBe(legacy);
  });

  it('decrypt falls back for malformed cipher text (wrong number of parts)', async () => {
    const { decrypt } = await loadCrypto();
    const bad = 'aa:bb'; // only 2 parts
    expect(decrypt(bad)).toBe(bad);
  });
});

// ── Rate-limit module tests ─────────────────────────────────────────
describe('rate-limit – checkRateLimit', () => {
  function makeReq(ip = '127.0.0.1', url = '/api/sunat/emit') {
    return {
      headers: { 'x-forwarded-for': ip },
      url,
      socket: { remoteAddress: ip },
    };
  }

  function makeRes() {
    const headers = {};
    let statusCode = null;
    let body = null;
    const res = {
      setHeader(k, v) { headers[k] = v; },
      status(code) {
        statusCode = code;
        return res;
      },
      json(data) { body = data; },
      _headers: headers,
      _statusCode: () => statusCode,
      _body: () => body,
    };
    return res;
  }

  // Each test uses unique IPs so the shared in-memory store doesn't conflict
  let checkRateLimit;

  beforeEach(async () => {
    // Use vi.resetModules + dynamic import to get a fresh store each test
    vi.resetModules();
    const mod = await import('../_lib/rate-limit.js');
    checkRateLimit = mod.checkRateLimit;
  });

  it('allows requests under the limit', () => {
    const req = makeReq('10.0.0.1');
    const res = makeRes();
    const limited = checkRateLimit(req, res, { limit: 5 });
    expect(limited).toBe(false);
    expect(res._headers['X-RateLimit-Limit']).toBe('5');
    expect(res._headers['X-RateLimit-Remaining']).toBe('4');
  });

  it('blocks requests over the limit', () => {
    const limit = 3;

    // Exhaust the limit (3 allowed, 4th blocked because count > limit)
    for (let i = 0; i < limit; i++) {
      const req = makeReq('10.0.0.2');
      const res = makeRes();
      const limited = checkRateLimit(req, res, { limit });
      expect(limited).toBe(false);
    }

    // Next request should be blocked
    const req = makeReq('10.0.0.2');
    const res = makeRes();
    const limited = checkRateLimit(req, res, { limit });
    expect(limited).toBe(true);
    expect(res._statusCode()).toBe(429);
    expect(res._body().error).toContain('Demasiadas solicitudes');
  });

  it('different IPs have independent limits', () => {
    const limit = 1;

    // First IP uses its one request
    const req1 = makeReq('10.0.0.10');
    const res1 = makeRes();
    expect(checkRateLimit(req1, res1, { limit })).toBe(false);

    // First IP is now blocked
    const req1b = makeReq('10.0.0.10');
    const res1b = makeRes();
    expect(checkRateLimit(req1b, res1b, { limit })).toBe(true);

    // Second IP still has its quota
    const req2 = makeReq('10.0.0.11');
    const res2 = makeRes();
    expect(checkRateLimit(req2, res2, { limit })).toBe(false);
  });
});
