import { db } from "@/lib/db";
import { eq, and, SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * Tenant-scoped query helpers.
 * Automatically injects tenantId into SELECT/INSERT/UPDATE/DELETE operations.
 *
 * Usage:
 *   const auth = await requireAdmin();
 *   const tdb = tenantScope(auth.tenantId!);
 *   const rows = await tdb.select(patients).where(eq(patients.active, true));
 */
export function tenantScope(tenantId: string) {
  if (!tenantId) throw new Error("tenantId is required for scoped queries");

  return {
    select<T extends PgTable & { tenantId: any }>(table: T) {
      return {
        where(condition?: SQL) {
          const tenantFilter = eq(table.tenantId, tenantId);
          const finalWhere = condition ? and(tenantFilter, condition) : tenantFilter;
          return db.select().from(table as any).where(finalWhere!);
        },
        all() {
          return db.select().from(table as any).where(eq(table.tenantId, tenantId));
        },
      };
    },

    async insert<T extends PgTable & { tenantId: any }>(
      table: T,
      values: Record<string, unknown>,
    ) {
      return db.insert(table).values({ ...values, tenantId } as any).returning();
    },

    update<T extends PgTable & { tenantId: any }>(table: T) {
      return {
        set(values: Record<string, unknown>) {
          return {
            where(condition: SQL) {
              return db
                .update(table)
                .set(values as any)
                .where(and(eq(table.tenantId, tenantId), condition)!);
            },
          };
        },
      };
    },

    delete<T extends PgTable & { tenantId: any }>(table: T) {
      return {
        where(condition: SQL) {
          return db
            .delete(table)
            .where(and(eq(table.tenantId, tenantId), condition)!);
        },
      };
    },

    /** Raw DB access for complex queries — MUST add tenantId manually */
    get raw() {
      return db;
    },

    /** The tenant ID for this scope */
    get id() {
      return tenantId;
    },
  };
}
