"use client";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/utils";

export function WhatsAppFloat() {
  if (!WHATSAPP_LINK) return null;
  return (
    <motion.a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 left-8 flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-full text-sm font-bold z-[90] shadow-lg no-print"
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(37,211,102,0.4)" }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <MessageCircle className="w-5 h-5" />
      WhatsApp
    </motion.a>
  );
}
