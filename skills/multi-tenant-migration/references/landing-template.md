# Landing Site Template — Strategy C

## Purpose

Each client (psychologist) gets their own independent landing site. This is a separate Vercel project, deployed on the client's domain. It contains ONLY presentation content — no system logic.

## What the Landing Site Contains

| Feature | Details |
|---------|---------|
| Hero section | Therapist name, headline, photo, CTA |
| About | Bio, credentials, approach |
| Services | Session types, pricing, modalities |
| Testimonials | Patient reviews (anonymized) |
| Blog | Static posts or fetched from platform API |
| Contact | WhatsApp link, email, address |
| FAQ | Common questions |
| Login button | → `app.MenteVive.com.br/login?tenant=SLUG` |
| Register button | → `app.MenteVive.com.br/registro?tenant=SLUG` |
| SEO | robots.txt, sitemap.xml, OG tags, structured data |

## What the Landing Site Does NOT Contain

- ❌ No auth system (login/register are redirects to central platform)
- ❌ No database access
- ❌ No admin dashboard
- ❌ No patient portal
- ❌ No API routes (except optional contact form → email API)
- ❌ No Stripe integration
- ❌ No Jitsi integration

## Template Structure

```
templates/landing-site/
├── .env.local.example        # Template env vars
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── logo.png              # Client's logo (replaced per client)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with branding
│   │   ├── page.tsx          # Landing page (all sections)
│   │   ├── globals.css       # Tailwind + custom colors
│   │   ├── robots.ts         # SEO
│   │   ├── sitemap.ts        # SEO
│   │   └── blog/
│   │       ├── page.tsx      # Blog listing
│   │       └── [slug]/
│   │           └── page.tsx  # Blog post detail
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Services.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Contact.tsx
│   │   ├── FAQ.tsx
│   │   ├── Footer.tsx
│   │   └── LoginButton.tsx   # Redirects to platform
│   └── lib/
│       └── config.ts         # Reads env vars for branding
└── README.md
```

## Environment Variables per Client

```env
# .env.local (each client site has their own)
TENANT_SLUG=psicolobia
TENANT_NAME=Psicóloga Bia
TENANT_DOMAIN=MenteVive-psicolobia.vercel.app

# Platform connection (Phase 1: Hobby)
NEXT_PUBLIC_PLATFORM_URL=https://MenteVive.vercel.app
# Phase 2 (custom domains): https://app.MenteVive.com.br
PLATFORM_URL=https://MenteVive.vercel.app
PLATFORM_LOGIN_URL=https://MenteVive.vercel.app/login
PLATFORM_REGISTER_URL=https://MenteVive.vercel.app/registro

# Branding
PRIMARY_COLOR=#6B21A8
SECONDARY_COLOR=#A855F7
WHATSAPP_LINK=https://wa.me/5511999999999

# Blog (optional: fetch from platform API)
BLOG_API_URL=https://MenteVive.vercel.app/api/blog?tenant=psicolobia
```

## Key Components

### LoginButton.tsx

```typescript
"use client";

export function LoginButton() {
  const platformLogin = process.env.NEXT_PUBLIC_PLATFORM_LOGIN_URL;
  const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;

  return (
    <a
      href={`${platformLogin}?tenant=${tenantSlug}`}
      className="btn btn-primary"
    >
      Área do Paciente
    </a>
  );
}

export function AdminButton() {
  const platformLogin = process.env.NEXT_PUBLIC_PLATFORM_LOGIN_URL;
  const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;

  return (
    <a
      href={`${platformLogin}?tenant=${tenantSlug}`}
      className="btn btn-secondary"
    >
      Painel Administrativo
    </a>
  );
}
```

### Blog — Static vs Dynamic

**Option 1: Static blog (simpler)**
- Blog posts are markdown files in the landing repo
- Built at deploy time
- Therapist manages via GitHub or CMS

**Option 2: Dynamic blog from platform API**
- Landing site fetches from `app.MenteVive.com.br/api/blog?tenant=SLUG`
- Platform serves blog data scoped by tenant
- Therapist manages blog from admin dashboard
- Landing uses ISR (Incremental Static Regeneration) for performance

```typescript
// Blog listing with ISR
export const revalidate = 3600; // re-fetch every hour

async function getBlogPosts() {
  const res = await fetch(
    `${process.env.BLOG_API_URL}`,
    { next: { revalidate: 3600 } }
  );
  return res.json();
}
```

## Scaffolding Script

```typescript
// scripts/scaffold-client-site.ts
// Usage: npx tsx scripts/scaffold-client-site.ts

import { input, confirm } from "@inquirer/prompts";
import { cpSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function scaffold() {
  const name = await input({ message: "Client name:" });
  const slug = await input({ message: "Tenant slug:" });
  const domain = await input({ message: "Custom domain (or leave blank):", default: "" });
  const primaryColor = await input({ message: "Primary color:", default: "#6B21A8" });
  const whatsapp = await input({ message: "WhatsApp number:" });

  const projectName = `MenteVive-${slug}`;
  const outDir = join(__dirname, "..", "..", projectName);
  const platformUrl = process.env.PLATFORM_URL || "https://MenteVive.vercel.app";

  // Copy template
  cpSync(join(__dirname, "..", "templates", "landing-site"), outDir, { recursive: true });

  // Write .env.local
  writeFileSync(join(outDir, ".env.local"), `
NEXT_PUBLIC_TENANT_SLUG=${slug}
NEXT_PUBLIC_TENANT_NAME=${name}
NEXT_PUBLIC_TENANT_DOMAIN=${domain || `${projectName}.vercel.app`}
NEXT_PUBLIC_PLATFORM_URL=${platformUrl}
NEXT_PUBLIC_PLATFORM_LOGIN_URL=${platformUrl}/login
NEXT_PUBLIC_PLATFORM_REGISTER_URL=${platformUrl}/registro
NEXT_PUBLIC_PRIMARY_COLOR=${primaryColor}
NEXT_PUBLIC_WHATSAPP_LINK=https://wa.me/${whatsapp.replace(/\D/g, "")}
BLOG_API_URL=${platformUrl}/api/blog?tenant=${slug}
  `.trim());

  console.log(`✅ Landing site scaffolded at: ${outDir}`);
  console.log(`   Vercel project name: ${projectName}`);
  console.log(`Next steps:`);
  console.log(`  1. cd ${outDir}`);
  console.log(`  2. npm install`);
  console.log(`  3. Customize components, logo, photos`);
  console.log(`  4. gh repo create VNCRIBEIRO1/${projectName} --public --source=. --push`);
  console.log(`  5. npx vercel --prod`);
  if (domain) {
    console.log(`  6. npx vercel domains add ${domain}`);
  }
}

scaffold();
```

## Onboarding Checklist (New Client)

1. [ ] Run scaffold script → generates landing site project
2. [ ] Customize content (hero text, about, services, photos, logo)
3. [ ] Create tenant in platform DB (via super admin or script)
4. [ ] Create tenant owner's user account + admin membership
5. [ ] Configure Stripe Connect for tenant
6. [ ] Deploy landing site to Vercel
7. [ ] Add custom domain to Vercel project
8. [ ] Configure DNS (CNAME → cname.vercel-dns.com)
9. [ ] Test login flow: domain → login → admin dashboard
10. [ ] Test patient registration flow
11. [ ] Hand off credentials to client

## Vercel Deploy Flow

```bash
# In the scaffolded landing site directory
cd psicolobia-landing

# Initialize Vercel project
vercel link  # or vercel --yes for new project

# Deploy
vercel deploy --prod

# Add custom domain
vercel domains add psicolobia.com.br

# DNS: Client adds CNAME record:
# psicolobia.com.br → cname.vercel-dns.com
```

## Migrating Existing Psicolobia Landing

The current `src/app/page.tsx` (with 14 landing sections) becomes the **template base** for all client landing sites. Steps:

1. Extract landing components to `templates/landing-site/src/components/`
2. Remove hardcoded Bia-specific content → use env vars
3. Keep the design system (Tailwind, Framer Motion, glassmorphism)
4. The central platform's `/` page becomes a simple "Platform Home" or redirect
