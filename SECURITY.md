**NightPage Security Changes & Guidance**

Overview
--------
This document lists the security hardening changes applied to NightPage and next steps/recommendations.

Changes applied
---------------
1. Client-side sanitization
   - Added `dompurify` and integrated it into `components/Journal.tsx`.
   - User-supplied HTML is sanitized before being assigned to `innerHTML` to mitigate XSS.
   - Allowed tags: `a, b, i, em, strong, u, p, br, ul, ol, li, img` and a small set of safe attributes (href, src, alt, title, style).

2. Server-side sanitization
   - Added a `sanitizeHtml` function in `supabase:functions::server/index.tsx`.
   - All journal content is sanitized server-side before being persisted to the `kv_store_3e97d870` table.
   - Returned entries are sanitized before being sent to the client.

3. CORS tightening
   - Previously: `origin: "*"` with credentials allowed (dangerous).
   - Now: `origin` is restricted to `ORIGIN` environment variable or `https://nightpage.space` by default.
   - Ensure your client uses that exact origin.

4. Admin access restriction
   - Admin endpoints now check `MASTER_ADMIN_EMAIL` (if set) and deny access unless the authenticated user's email matches.

5. Source map removal
   - Production source maps disabled (`vite.config.ts`) to avoid leaking source code.

6. CSP meta
   - A conservative Content-Security-Policy meta tag was added to `index.html`. Note: CSP via HTTP header is stronger; see recommendations.

Why these changes
------------------
- XSS (Cross-site scripting): User content may contain HTML; sanitizing on both client and server reduces the risk of stored XSS.
- CSRF (Cross-site request forgery): API uses bearer Authorization headers (not cookies by default), reducing CSRF risk. If you switch to cookie-based sessions, you must implement CSRF tokens.
- SQL injection: Supabase client methods (`upsert`, `select`, etc.) are used instead of raw SQL; server sanitization helps further.
- DNS / Kaminsky: Enforce DNSSEC at registrar and consider Cloudflare for edge security and response headers.

Next steps / recommendations
---------------------------
1. Migrate from `localStorage` tokens to HttpOnly, SameSite cookies
   - Storing access tokens in `localStorage` is vulnerable to XSS token theft.
   - Use HttpOnly cookies set from server (requires changing the auth flow and hosting to allow cookie domain).

2. Use an edge/CDN to set security headers
   - GitHub Pages can't set arbitrary response headers like `Strict-Transport-Security` or header-based CSP.
   - Use Cloudflare (DNS-only while testing; enable proxy when ready) to set HSTS, CSP, and remove server headers as needed.

3. Enable DNSSEC
   - At Namecheap enable DNSSEC for `nightpage.space` to mitigate DNS cache-poisoning attacks.

4. Server-side sanitization library
   - The rudimentary sanitizer added is defensive but not a full-featured HTML sanitizer on the server.
   - Consider using a robust sanitizer in server environment (e.g., DOMPurify with JSDOM in functions or server-side sanitizer library) if your server environment supports it.

5. Audit allowed HTML
   - Periodically review the allowed tags and attributes. Consider storing plain text + structured attachments instead of raw HTML.

6. Audit secrets and environment variables
   - Ensure service role keys and other secrets are stored as environment variables / GitHub Secrets and not checked into the repo.

How to deploy these changes
--------------------------
1. Push the branch to `main` (already done) — the GitHub Actions Pages workflow runs automatically.
2. For server functions, set environment variables in your Supabase project (ORIGIN, MASTER_ADMIN_EMAIL, SUPABASE_SERVICE_ROLE_KEY, etc.).

Commands & checks
-----------------
- Check CORS origin used by the server:
  - `echo $ORIGIN` (on the function deployment environment)
- Confirm entries are sanitized by saving a test entry containing `<script>` and verifying it doesn't appear in stored content.

If you want, I can:
- Replace the basic server sanitizer with DOMPurify + JSDOM for stronger server-side sanitization (requires adding that dependency to the functions environment).
- Help migrate to HttpOnly cookie-based sessions (requires domain/cookie setup and server changes).
- Walk through enabling DNSSEC on Namecheap and setting response headers on Cloudflare.
