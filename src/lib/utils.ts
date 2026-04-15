import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  try {
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else {
      // Date-only string like "2026-03-15" → append T00:00:00 to avoid UTC shift
      const s = String(date);
      d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + "T00:00:00") : new Date(s);
    }
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  try {
    const d = date instanceof Date ? date : new Date(String(date));
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  return phone;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Clean a phone number for WhatsApp wa.me links.
 * Strips all non-digits, prepends 55 (Brazil) if missing country code.
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // If starts with 55 and has 12-13 digits, it's already full
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // If 10-11 digits (DDD + number), prepend 55
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  // Fallback: return as-is
  return digits;
}

/**
 * Build a WhatsApp wa.me URL with an optional pre-filled message.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const clean = cleanPhoneForWhatsApp(phone);
  const base = `https://wa.me/${clean}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const WHATSAPP_LINK = "https://wa.me/5511988840525";
export const INSTAGRAM_URL = "https://www.instagram.com/psicolobiaa";
export const TIKTOK_URL = "https://www.tiktok.com/@psicolobiaa";
