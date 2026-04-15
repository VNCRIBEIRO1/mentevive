# 🧠 Psicolobia — SaaS para Psicólogos

**Plataforma completa de gestão clínica** para Beatriz (@psicolobiaa), psicóloga clínica especializada no emocional de quem vive da internet.

🔗 **Live:** [psicolobia.vercel.app](https://psicolobia.vercel.app)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Estilo | Tailwind CSS 3 |
| Banco | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js 4 (credentials + JWT) |
| Video | Jitsi Meet (meet.jit.si External API) |
| Deploy | Vercel |

## Setup Local

```bash
git clone https://github.com/VNCRIBEIRO1/psicolobia.git
cd psicolobia
npm install
cp .env.local.example .env.local
# Edite com suas credenciais e defina ADMIN_EMAIL/ADMIN_PASSWORD se for usar o seed
npm run db:push
npm run db:seed
npm run dev
```

## Variáveis de Ambiente (.env.local)

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXTAUTH_SECRET=sua-chave-secreta
# ou AUTH_SECRET=sua-chave-secreta
NEXTAUTH_URL=http://localhost:3000
SETUP_SECRET=secret-exclusivo-para-bootstrap-inicial
TURNSTILE_SECRET_KEY=secret-do-cloudflare-turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=site-key-do-cloudflare-turnstile
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema |
| `npm run db:seed` | Seed admin com `ADMIN_EMAIL` e `ADMIN_PASSWORD` explícitos |
| `npm run db:studio` | Drizzle Studio |

## Features

- ✅ Landing page (14 seções) com JSON-LD
- ✅ Chatbot inteligente (12 intenções + texto livre)
- ✅ Agendamento + Sala de Espera com Jitsi Meet
- ✅ Admin: Dashboard, Pacientes, Agenda, Financeiro, Prontuários, Blog, Grupos, Config
- ✅ Portal do Paciente: Sessões, Pagamentos, Documentos
- ✅ Blog público SSR (/blog + /blog/[slug])
- ✅ Auth com roles + API protegida
- ✅ Responsivo + Acessível

## Bootstrap Inicial

Não há credenciais padrão de administrador. O primeiro acesso deve ser criado com variáveis de ambiente explícitas no `db:seed` ou via `/api/setup` usando `SETUP_SECRET` dedicado e apenas antes de existir um admin.

## Proteção Anti-Spam

Contato, registro e login aceitam Cloudflare Turnstile quando `TURNSTILE_SECRET_KEY` e `NEXT_PUBLIC_TURNSTILE_SITE_KEY` estão configurados. Em produção, preencha ambas para ativar captcha real.
