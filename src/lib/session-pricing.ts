import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";

export async function getSessionPrice(tenantId: string, modality: "online" | "presencial" = "online"): Promise<number> {
  const [pricingRow] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(and(eq(settings.tenantId, tenantId), eq(settings.key, "pricing")))
    .limit(1);

  const defaultPrice = modality === "presencial" ? 220 : 180;
  if (!pricingRow) return defaultPrice;

  try {
    const pricing = JSON.parse(pricingRow.value) as Array<{ key?: string; value?: string }>;
    const pricingKey = modality === "presencial" ? "individual_presencial" : "individual_online";
    const item = pricing.find((entry) => entry.key === pricingKey);
    const amount = Number(item?.value || 0);
    return Number.isFinite(amount) && amount > 0 ? amount : defaultPrice;
  } catch {
    return defaultPrice;
  }
}
