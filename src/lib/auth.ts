import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users, tenantMemberships, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getAuthSecret } from "@/lib/auth-secret";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
        website: { label: "Website", type: "text" },
        tenantSlug: { label: "Tenant Slug", type: "text" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, turnstileToken } = parsed.data;
        const ip = req?.headers ? getClientIp({ headers: req.headers }) : "unknown";

        // Rate limit: 8 login attempts per 10 minutes per IP + email
        const rl = rateLimit(`login:${ip}:${email}`, 8, 10 * 60_000);
        if (!rl.success) return null;

        const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
        if (!captchaOk) return null;

        try {
          // Step 1: Authenticate globally (no tenant filter)
          const [user] = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              role: users.role,
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

          // Step 2: Look up active memberships
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

          // Step 3: Determine tenant context
          const tenantSlug = credentials?.tenantSlug || undefined;
          let activeTenantId: string | undefined;
          let activeSlug: string | undefined;
          let activeTenantName: string | undefined;
          let membershipRole: string | undefined;
          let needsTenantSelection = false;

          if (user.isSuperAdmin) {
            // Superadmin: auto-select if they have exactly 1 membership
            if (memberships.length === 1) {
              activeTenantId = memberships[0].tenantId;
              activeSlug = memberships[0].slug;
              activeTenantName = memberships[0].tenantName;
              membershipRole = memberships[0].role;
            }
            // Otherwise they can pick later or go to super admin dashboard
          } else if (tenantSlug) {
            // Specific tenant requested
            const match = memberships.find(m => m.slug === tenantSlug);
            if (match) {
              activeTenantId = match.tenantId;
              activeSlug = match.slug;
              activeTenantName = match.tenantName;
              membershipRole = match.role;
            } else {
              return null; // No membership for requested tenant
            }
          } else if (memberships.length === 1) {
            // Single membership → auto-select
            activeTenantId = memberships[0].tenantId;
            activeSlug = memberships[0].slug;
            activeTenantName = memberships[0].tenantName;
            membershipRole = memberships[0].role;
          } else if (memberships.length > 1) {
            needsTenantSelection = true;
          } else if (!user.isSuperAdmin) {
            // No memberships and not superadmin → reject
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            isSuperAdmin: user.isSuperAdmin ?? false,
            activeTenantId,
            tenantSlug: activeSlug,
            tenantName: activeTenantName,
            membershipRole,
            needsTenantSelection,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.isSuperAdmin = user.isSuperAdmin;
        token.activeTenantId = user.activeTenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantName = user.tenantName;
        token.membershipRole = user.membershipRole;
        token.needsTenantSelection = user.needsTenantSelection;
      }
      // Handle session update (e.g. after selecting a tenant)
      if (trigger === "update" && updateData) {
        if (updateData.activeTenantId !== undefined) token.activeTenantId = updateData.activeTenantId;
        if (updateData.tenantSlug !== undefined) token.tenantSlug = updateData.tenantSlug;
        if (updateData.tenantName !== undefined) token.tenantName = updateData.tenantName;
        if (updateData.membershipRole !== undefined) token.membershipRole = updateData.membershipRole;
        if (updateData.needsTenantSelection !== undefined) token.needsTenantSelection = updateData.needsTenantSelection;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
        session.user.isSuperAdmin = token.isSuperAdmin;
        session.user.activeTenantId = token.activeTenantId;
        session.user.tenantSlug = token.tenantSlug;
        session.user.tenantName = token.tenantName;
        session.user.membershipRole = token.membershipRole;
        session.user.needsTenantSelection = token.needsTenantSelection;
      }
      return session;
    },
  },
  secret: getAuthSecret(),
};
