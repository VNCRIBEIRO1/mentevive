"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Palette, Save } from "lucide-react";
import { useBranding, brandingInitial } from "@/components/branding/BrandingContext";
import type { ResolvedBranding } from "@/lib/branding";

const inputCls =
  "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function MarcaPage() {
  const branding = useBranding();
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.branding) return;
        setDisplayName(data.branding.displayName || "");
        setLogoUrl(data.branding.logoUrl || "");
        setPrimaryColor(data.branding.primaryColor || "");
        setAccentColor(data.branding.accentColor || "");
        setTagline(data.branding.tagline || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, logoUrl, primaryColor, accentColor, tagline }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || "Erro ao salvar.", type: "error" });
        return;
      }
      setToast({ msg: "Marca atualizada! Recarregue para ver as mudanças em todas as telas.", type: "success" });
    } catch {
      setToast({ msg: "Erro de conexão.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Live preview branding (uses local state, falls back to context)
  const preview: ResolvedBranding = {
    displayName: displayName || branding.displayName,
    logoUrl: logoUrl || null,
    primaryColor: primaryColor || branding.primaryColor,
    accentColor: accentColor || branding.accentColor,
    tagline: tagline || null,
    consentMarkdown: null,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/configuracoes"
        className="inline-flex items-center gap-1.5 text-sm text-txt-muted hover:text-txt mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para configurações
      </Link>

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-txt flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary-dark" />
          Marca / Branding
        </h1>
        <p className="text-sm text-txt-light mt-1">
          Personalize logo, cores e nome do seu consultório. Aparecem na barra lateral e no portal do paciente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-brand p-6 shadow-warm-sm border border-primary/5 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Nome de exibição</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Consultório da Bia"
              maxLength={80}
              className={inputCls}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">URL do logo (opcional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://exemplo.com/meu-logo.png"
              className={inputCls}
              disabled={loading}
            />
            <p className="text-[0.7rem] text-txt-muted mt-1">Formato quadrado recomendado (200x200px+).</p>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Cor principal</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor || "#5B9BD5"}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded-brand-sm border-[1.5px] border-primary/15 cursor-pointer"
                disabled={loading}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#5B9BD5"
                pattern="^#[0-9a-fA-F]{6}$"
                className={inputCls}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Cor secundária (acento)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor || "#6ECFF6"}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-10 rounded-brand-sm border-[1.5px] border-primary/15 cursor-pointer"
                disabled={loading}
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#6ECFF6"
                pattern="^#[0-9a-fA-F]{6}$"
                className={inputCls}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Tagline (opcional)</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ex: Psicologia clínica online com escuta sensível"
              maxLength={160}
              className={inputCls}
              disabled={loading}
            />
            <p className="text-[0.7rem] text-txt-muted mt-1">Aparece no portal do paciente.</p>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="btn-brand-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar marca"}
          </button>

          {toast && (
            <div
              className={`text-sm p-3 rounded-brand-sm ${
                toast.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              {toast.msg}
            </div>
          )}
        </form>

        {/* Preview */}
        <div className="bg-card rounded-brand p-6 shadow-warm-sm border border-primary/5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-txt-muted mb-4">
            Pré-visualização
          </p>

          <div className="rounded-xl border border-primary/10 p-4 bg-bg flex items-center gap-3">
            {preview.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.logoUrl} alt={preview.displayName} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-bold"
                style={{
                  background: `linear-gradient(135deg, ${preview.primaryColor}, ${preview.accentColor})`,
                }}
              >
                {brandingInitial(preview)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-heading text-base font-bold text-txt truncate">{preview.displayName}</p>
              {preview.tagline && (
                <p className="text-[0.7rem] text-txt-muted truncate">{preview.tagline}</p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div
              className="rounded-brand-sm p-3 text-white text-xs font-bold text-center"
              style={{ background: preview.primaryColor }}
            >
              Cor principal
              <br />
              <span className="font-mono opacity-80 text-[0.65rem]">{preview.primaryColor}</span>
            </div>
            <div
              className="rounded-brand-sm p-3 text-white text-xs font-bold text-center"
              style={{ background: preview.accentColor }}
            >
              Cor acento
              <br />
              <span className="font-mono opacity-80 text-[0.65rem]">{preview.accentColor}</span>
            </div>
          </div>

          <p className="mt-4 text-[0.7rem] text-txt-muted">
            Após salvar, recarregue para ver a marca atualizada em todas as telas.
          </p>
        </div>
      </div>
    </div>
  );
}
