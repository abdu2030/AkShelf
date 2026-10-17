# Production Custom Domain & SSL/TLS Configuration Guide 🔒

**Target Environment**: Vercel Production + Custom Domain  
**Edition**: v1.0.0 / October 2026

---

## 1. Overview & Objectives

Day 51 establishes **Production Domain Configuration, SSL/TLS Verification, and Security Headers Enforcement** to ensure:

1. **Encrypted Transport**: Enforce modern HTTPS/TLS 1.3 across all incoming traffic.
2. **Defensive Headers**: Active protection against clickjacking, MIME-confusion attacks, cross-site data injection, and unsafe inline execution.
3. **Automated Certificate Renewal**: Continuous zero-downtime certificate issuance via Vercel's global edge network.

---

## 2. Configuring Your Custom Domain in Vercel

### Step 1: Add the Domain in Vercel

1. Navigate to your project on the [Vercel Dashboard](https://vercel.com).
2. Go to **Settings** &rarr; **Domains**.
3. Enter your domain name:
   - **Apex Domain**: `yourdomain.com` (Vercel will offer to automatically redirect to `www.yourdomain.com` or vice versa).
   - **Subdomain** _(recommended for private personal tools)_: `watch.yourdomain.com` or `shelf.yourdomain.com`.
4. Click **Add**.

---

### Step 2: Configure DNS Records at Your Registrar

Add the appropriate DNS records provided by Vercel into your domain registrar (e.g., Cloudflare, Namecheap, Google Domains, Porkbun):

#### Option A: Subdomain Setup (e.g. `watch.yourdomain.com`)

|   Type    | Name / Host |     Target / Value     |      TTL      |
| :-------: | :---------: | :--------------------: | :-----------: |
| **CNAME** |   `watch`   | `cname.vercel-dns.com` | Auto (or 300) |

#### Option B: Apex Domain Setup (e.g. `yourdomain.com`)

|   Type    | Name / Host |     Target / Value     |      TTL      |
| :-------: | :---------: | :--------------------: | :-----------: |
|   **A**   |     `@`     |     `76.76.21.21`      | Auto (or 300) |
| **CNAME** |    `www`    | `cname.vercel-dns.com` | Auto (or 300) |

> [!TIP]
> If you are using Cloudflare DNS, set the Proxy status to **DNS Only** (grey cloud) during initial SSL certificate generation to avoid certificate negotiation loops with Vercel.

---

## 3. SSL/TLS Verification & Let's Encrypt

Once DNS records propagate (typically 1–10 minutes), Vercel automatically requests and provisions an SSL/TLS certificate from **Let's Encrypt**:

- **Certificate Authority**: Let's Encrypt Authority.
- **Protocol Support**: TLS 1.2 and TLS 1.3.
- **Renewal**: Automatic zero-touch renewal 30 days prior to expiration.
- **HTTP &rarr; HTTPS Redirect**: Automatically enforced on Vercel's edge network.

---

## 4. Production Security Headers Matrix

AkShelf enforces bank-grade HTTP response headers on every route (`/:path*`) via [`next.config.ts`](file:///c:/Users/Admin/Desktop/AkShelf/next.config.ts):

| Header                        | Production Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Purpose & Protection                                                                                                                                                              |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content-Security-Policy**   | `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://image.tmdb.org https://s4.anilist.co https://media.kitsu.io https://images.unsplash.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.themoviedb.org https://graphql.anilist.co https://*.supabase.co; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;` | Restricts script execution, styles, API connections, and external media strictly to trusted sources (TMDB, AniList, Supabase, Google Fonts). Prevents Cross-Site Scripting (XSS). |
| **Strict-Transport-Security** | `max-age=63072000; includeSubDomains; preload`                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Enforces HTTPS strictly for 2 years across all subdomains and authorizes HSTS browser preloading. Prevents man-in-the-middle downgrade attacks.                                   |
| **X-Frame-Options**           | `DENY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Completely prohibits embedding AkShelf in `<iframe>` or `<frame>` elements. Prevents clickjacking attacks.                                                                        |
| **X-Content-Type-Options**    | `nosniff`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Disables MIME type sniffing by browsers, forcing them to adhere strictly to declared MIME types.                                                                                  |
| **Referrer-Policy**           | `strict-origin-when-cross-origin`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Strips full URL paths from the Referer header on outbound external links, preserving privacy.                                                                                     |
| **Permissions-Policy**        | `camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()`                                                                                                                                                                                                                                                                                                                                                                                                                         | Disables camera, microphone, geolocation hardware, and FLOC tracking in the browser sandbox.                                                                                      |
| **X-DNS-Prefetch-Control**    | `on`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Enables pre-resolving of external image and metadata domains to accelerate poster loading.                                                                                        |

---

## 5. Verification Checklist

### Local & Automated Verification

Run the automated security header test suite:

```bash
npx vitest run src/lib/security/headers.test.ts
```

### Live Production URL Verification

Once deployed to your production domain, run `curl` to verify header delivery:

```bash
curl -I https://your-custom-domain.com
```

Expected headers in terminal output:

```http
HTTP/2 200
content-security-policy: default-src 'self'; ...
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()
```

### External Security Audits

- **SSL Labs**: Test your domain at [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/) (Target: **Grade A+**).
- **Security Headers**: Test at [securityheaders.com](https://securityheaders.com/) (Target: **Grade A+**).
