# Auth Changes — Strategy C (Global Users + Tenant Picker)

## Current State

- NextAuth 4 with CredentialsProvider
- JWT strategy with `{ id, email, name, role, phone }` 
- Session augments: `session.user.id`, `session.user.role`, `session.user.phone`
- Type augmentation in `src/types/next-auth.d.ts`
- API auth helpers in `src/lib/api-auth.ts`

## Key Principle: Global Auth + Membership-Based Role

Users authenticate **globally** (one account per email). After authentication, their `tenant_memberships` determine which tenants they can access and with what role. The JWT carries the `activeTenantId` — the currently selected tenant.

## Required Changes

### 1. Type Augmentation (`src/types/next-auth.d.ts`)

```typescript
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    phone?: string | null;
    isSuperAdmin: boolean;
    // Tenant context (set after login)
    activeTenantId?: string;
    tenantSlug?: string;
    membershipRole?: string;       // "admin" | "therapist" | "patient"
    needsTenantSelection?: boolean; // true if user has multiple memberships
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string | null;
      isSuperAdmin: boolean;
      activeTenantId?: string;
      tenantSlug?: string;
      membershipRole?: string;
      needsTenantSelection?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone?: string | null;
    isSuperAdmin: boolean;
    activeTenantId?: string;
    tenantSlug?: string;
    membershipRole?: string;
    needsTenantSelection?: boolean;
  }
}
```

### 2. Auth Options — Authorize (`src/lib/auth.ts`)

```typescript
async authorize(credentials, req) {
  // ... existing validation, rate limit, captcha ...

  // Step 1: Authenticate globally (NO tenant filter)
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      password: users.password,
      active: users.active,
      isSuperAdmin: users.isSuperAdmin,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.active) return null;
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  // Step 2: Look up memberships
  const memberships = await db
    .select({
      tenantId: tenantMemberships.tenantId,
      role: tenantMemberships.role,
      slug: tenants.slug,
      tenantName: tenants.name,
    })
    .from(tenantMemberships)
    .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
    .where(
      and(
        eq(tenantMemberships.userId, user.id),
        eq(tenantMemberships.active, true),
        eq(tenants.active, true),
      )
    );

  // Step 3: Check if ?tenant=SLUG was passed (from client's login button)
  const requestedSlug = new URL(req?.headers?.referer || "", "http://localhost")
    .searchParams.get("tenant");
  // OR: read from a hidden field passed via credentials
  const tenantSlug = credentials?.tenantSlug || requestedSlug;

  // Step 4: Determine tenant context
  let activeTenantId: string | undefined;
  let activeSlug: string | undefined;
  let membershipRole: string | undefined;
  let needsTenantSelection = false;

  if (user.isSuperAdmin) {
    // Superadmin: no tenant context needed initially
    // They go to /super/* dashboard
  } else if (tenantSlug) {
    // Specific tenant requested → find matching membership
    const match = memberships.find(m => m.slug === tenantSlug);
    if (match) {
      activeTenantId = match.tenantId;
      activeSlug = match.slug;
      membershipRole = match.role;
    } else {
      // No membership for this tenant → reject or auto-create
      return null; // OR: redirect to "request access" flow
    }
  } else if (memberships.length === 1) {
    // Single membership → auto-select
    activeTenantId = memberships[0].tenantId;
    activeSlug = memberships[0].slug;
    membershipRole = memberships[0].role;
  } else if (memberships.length > 1) {
    // Multiple memberships → need tenant picker
    needsTenantSelection = true;
  } else {
    // No memberships at all → reject
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    isSuperAdmin: user.isSuperAdmin || false,
    activeTenantId,
    tenantSlug: activeSlug,
    membershipRole,
    needsTenantSelection,
  };
}
```

### 3. JWT and Session Callbacks

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.phone = user.phone;
      token.isSuperAdmin = user.isSuperAdmin;
      token.activeTenantId = user.activeTenantId;
      token.tenantSlug = user.tenantSlug;
      token.membershipRole = user.membershipRole;
      token.needsTenantSelection = user.needsTenantSelection;
    }
    return token;
  },
  async session({ session, token }) {
    session.user.id = token.id;
    session.user.phone = token.phone;
    session.user.isSuperAdmin = token.isSuperAdmin;
    session.user.activeTenantId = token.activeTenantId;
    session.user.tenantSlug = token.tenantSlug;
    session.user.membershipRole = token.membershipRole;
    session.user.needsTenantSelection = token.needsTenantSelection;
    return session;
  },
}
```

### 4. New API: Select Tenant (`/api/auth/select-tenant`)

For users with multiple memberships who need to pick a tenant:

```typescript
// POST /api/auth/select-tenant
// Body: { tenantSlug: "psicolobia" }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { tenantSlug } = await req.json();

  // Find membership
  const [membership] = await db
    .select({
      tenantId: tenantMemberships.tenantId,
      role: tenantMemberships.role,
      slug: tenants.slug,
    })
    .from(tenantMemberships)
    .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
    .where(
      and(
        eq(tenantMemberships.userId, session.user.id),
        eq(tenants.slug, tenantSlug),
        eq(tenantMemberships.active, true),
      )
    )
    .limit(1);

  if (!membership) return forbidden();

  // Update JWT: We need to force a token refresh
  // Strategy: Use a server-side "selected tenant" store
  // OR: Use NextAuth's unstable_update (NextAuth v5)
  // OR: Re-issue session cookie with updated claims

  // Practical approach: store selection in an httpOnly cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set("active-tenant-id", membership.tenantId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  response.cookies.set("active-tenant-slug", membership.slug, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set("membership-role", membership.role, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
```

### 5. Updated API Auth Helpers (`src/lib/api-auth.ts`)

```typescript
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthError("Not authenticated");

  // Read active tenant from JWT or cookie
  const tenantId = session.user.activeTenantId || getCookie("active-tenant-id");
  const role = session.user.membershipRole || getCookie("membership-role");

  if (!tenantId) throw new AuthError("No tenant selected");
  if (role !== "admin" && role !== "therapist") throw new AuthError("Not authorized");

  return {
    userId: session.user.id,
    tenantId,
    role,
    email: session.user.email,
  };
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthError("Not authenticated");

  const tenantId = session.user.activeTenantId || getCookie("active-tenant-id");
  const role = session.user.membershipRole || getCookie("membership-role");

  if (!tenantId) throw new AuthError("No tenant selected");

  return {
    userId: session.user.id,
    tenantId,
    role,
    email: session.user.email,
  };
}

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthError("Not authenticated");
  if (!session.user.isSuperAdmin) throw new AuthError("Not a super admin");

  return {
    userId: session.user.id,
    email: session.user.email,
  };
}

export async function requireTenantSelected() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthError("Not authenticated");
  
  const tenantId = session.user.activeTenantId || getCookie("active-tenant-id");
  if (!tenantId) {
    // Redirect to tenant picker
    throw new TenantSelectionRequired();
  }
  return tenantId;
}
```

### 6. Login Page Updates

The login page at `/login` should:

1. Read `?tenant=SLUG` from URL params
2. If present: show "Entrar no Consultório {TenantName}" + pass slug to credentials
3. If absent: show generic "Entrar na Plataforma"

```typescript
// /app/login/page.tsx
export default function LoginPage({ searchParams }: { searchParams: { tenant?: string } }) {
  const tenantSlug = searchParams.tenant;
  // If tenantSlug, fetch tenant name for display
  // Pass tenantSlug as hidden field in login form
}
```

### 7. Tenant Picker Page (`/select-tenant`)

New page shown when user has multiple memberships:

```typescript
// /app/select-tenant/page.tsx
export default async function SelectTenantPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Fetch user's memberships
  const memberships = await db
    .select({
      tenantId: tenantMemberships.tenantId,
      role: tenantMemberships.role,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      logo: tenants.logo,
    })
    .from(tenantMemberships)
    .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
    .where(
      and(
        eq(tenantMemberships.userId, session.user.id),
        eq(tenantMemberships.active, true),
      )
    );

  // Render cards for each consultório
  // On click → POST /api/auth/select-tenant → redirect to /admin or /portal
}
```

### 8. Registration with Tenant Context

```typescript
// POST /api/auth/register
export async function POST(req: Request) {
  const { name, email, password, phone, tenantSlug } = await req.json();

  // 1. Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;

  if (existingUser) {
    // User exists → check if already has membership in this tenant
    const [existingMembership] = await db
      .select()
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
      .where(
        and(
          eq(tenantMemberships.userId, existingUser.id),
          eq(tenants.slug, tenantSlug),
        )
      )
      .limit(1);

    if (existingMembership) {
      return error("Você já tem conta neste consultório. Faça login.");
    }

    userId = existingUser.id;
  } else {
    // Create new global user
    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      phone,
      role: "user",
    }).returning({ id: users.id });

    userId = newUser.id;
  }

  // 2. Resolve tenant
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) return error("Consultório não encontrado");

  // 3. Create membership
  await db.insert(tenantMemberships).values({
    userId,
    tenantId: tenant.id,
    role: "patient",
  });

  // 4. Create patient record
  await db.insert(patients).values({
    userId,
    tenantId: tenant.id,
    name,
    email,
    phone,
  });

  return json({ success: true });
}
```
    phone: user.phone,
    tenantId: user.tenantId,              // NEW
    tenantSlug: tenant?.slug || "",       // NEW
  };
},
```

### 3. JWT Callback

```typescript
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;
    token.id = user.id;
    token.phone = user.phone;
    token.tenantId = user.tenantId;       // NEW
    token.tenantSlug = user.tenantSlug;   // NEW
  }
  return token;
},
```

### 4. Session Callback

```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id;
    session.user.role = token.role;
    session.user.phone = token.phone;
    session.user.tenantId = token.tenantId;     // NEW
    session.user.tenantSlug = token.tenantSlug; // NEW
  }
  return session;
},
```

### 5. API Auth Helpers (`src/lib/api-auth.ts`)

```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

type AuthResult = {
  error: false;
  session: Session;
  tenantId: string;
} | {
  error: true;
  response: NextResponse;
};

export async function requireAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: true, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  if (session.user?.role !== "admin" && session.user?.role !== "therapist") {
    return { error: true, response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) };
  }
  return { error: false, session, tenantId: session.user.tenantId };
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: true, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  return { error: false, session, tenantId: session.user.tenantId };
}

export async function requireSuperAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: true, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  if (session.user?.role !== "superadmin") {
    return { error: true, response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) };
  }
  // Super admin doesn't need tenantId scoping  
  return { error: false, session, tenantId: "" };
}
```

### 6. Registration Flow

When a new patient registers at `bia.psicolobia.com.br/registro`:

```typescript
// POST /api/auth/register
export async function POST(req: Request) {
  // Resolve tenant from middleware header
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant inválido" }, { status: 400 });
  }

  // ... validate input ...

  // Create user with tenantId
  const [user] = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    role: "patient",
    tenantId,             // NEW: assign to current tenant
  }).returning();

  // Create patient record with tenantId
  await db.insert(patients).values({
    userId: user.id,
    name,
    email,
    phone,
    tenantId,             // NEW: assign to current tenant
  });
}
```

## Security Considerations

1. **JWT tenant cannot be changed by client** — it's set server-side in authorize()
2. **Middleware validates** JWT tenantId matches subdomain tenantId
3. **Cross-tenant login** — user logged into `bia.psicolobia.com.br` cannot access `ana.psicolobia.com.br` (middleware redirects to login)
4. **Super admin** bypasses tenant scoping entirely (platform-level operations)
5. **Rate limit** should include tenantId: `login:${ip}:${tenantId}:${email}`
