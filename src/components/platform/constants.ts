/** SaaS platform WhatsApp — used across all landing page CTAs */
export const SAAS_WHATSAPP = "https://wa.me/5518988235801";

export function buildSaasWhatsAppUrl(message: string) {
  return `${SAAS_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
