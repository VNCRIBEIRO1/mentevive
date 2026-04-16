import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    phone?: string | null;
    isSuperAdmin: boolean;
    activeTenantId?: string;
    tenantSlug?: string;
    tenantName?: string;
    membershipRole?: string;
    needsTenantSelection?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      phone?: string | null;
      isSuperAdmin: boolean;
      activeTenantId?: string;
      tenantSlug?: string;
      tenantName?: string;
      membershipRole?: string;
      needsTenantSelection?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone?: string | null;
    isSuperAdmin: boolean;
    activeTenantId?: string;
    tenantSlug?: string;
    tenantName?: string;
    membershipRole?: string;
    needsTenantSelection?: boolean;
  }
}
