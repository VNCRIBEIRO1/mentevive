"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";

const AREAS = [
  "Ansiedade", "Depressao", "Traumas", "Autoestima", "Burnout Digital",
  "Relacionamentos", "Luto", "Autoconhecimento", "ACT", "Terapia de Casal", "Criadores de Conteudo",
];

type PricingItem = { label: string; key: string; duration: string; value: string };

const defaultPricing: PricingItem[] = [
  { label: "Videochamada", key: "videochamada", duration: "60 min", value: "" },
];

const inputCls =
  "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function ConfiguracoesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [crp, setCrp] = useState("");
  const [profileVisible, setProfileVisible] = useState(false);
  const [pricing, setPricing] = useState<PricingItem[]>(defaultPricing);
  const [areas, setAreas] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Single fetch: profile contains all user fields including email
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile) {
            setName(profile.name || "");
            setEmail(profile.email || "");
            setPhone(profile.phone || "");
            setSpecialty(profile.specialty || "");
            setBio(profile.bio || "");
            setCrp(profile.crp || "");
            setProfileVisible(profile.profileVisible || false);
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/settings?key=pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.value && Array.isArray(data.value)) {
            const incoming = data.value as PricingItem[];
            const videoItem = incoming.find((p) => p.key === "videochamada") || incoming.find((p) => p.key === "individual_online");
            if (videoItem) setPricing([{ ...defaultPricing[0], value: videoItem.value || "" }]);
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/settings?key=areas");
        if (res.ok) {
          const data = await res.json();
          if (data.value && Array.isArray(data.value)) setAreas(data.value);
        }
      } catch {}

      setLoading(false);
    };
    init();
  }, []);

  const flash = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4000);
  };

  const toggleArea = (area: string) => {
    setAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  };

  const updatePricing = (idx: number, value: string) => {
    setPricing((prev) => prev.map((p, i) => (i === idx ? { ...p, value } : p)));
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, specialty, bio, crp, profileVisible }),
      });
      if (!res.ok) hasError = true;
    } catch {
      hasError = true;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing", value: pricing }),
      });
      if (!res.ok) hasError = true;
    } catch {
      hasError = true;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "areas", value: areas }),
      });
      if (!res.ok) hasError = true;
    } catch {
      hasError = true;
    }

    flash(
      hasError ? "Erro ao salvar algumas configurações." : "Configurações salvas com sucesso.",
      hasError ? "error" : "success"
    );
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-txt-muted">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 border text-sm px-5 py-3 rounded-brand-sm shadow-lg ${
          toastType === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-card border-primary/20 text-txt"
        }`}>
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-txt">Configurações</h1>
        <p className="text-sm text-txt-light mt-1">Perfil profissional, valores e áreas de atuação</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Perfil */}
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-4">Perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">E-mail</label>
              <input type="email" value={email} readOnly className={inputCls + " bg-bg cursor-not-allowed opacity-60"} />
              <p className="text-[0.7rem] text-txt-muted mt-1">O e-mail não pode ser alterado aqui.</p>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                placeholder="(11) 98884-0525"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">CRP</label>
              <input
                type="text"
                value={crp}
                onChange={(e) => setCrp(e.target.value)}
                className={inputCls}
                placeholder="06/123456"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Especialidade</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className={inputCls}
                placeholder="Ex: Terapia de Aceitação e Compromisso (ACT)"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className={inputCls + " resize-none"}
                placeholder="Uma breve descrição sobre você e sua abordagem..."
                maxLength={500}
              />
              <span className="text-xs text-txt-muted mt-1 block">{bio.length}/500</span>
            </div>
          </div>
        </div>

        {/* Diretório Público */}
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">Diretório Público</h3>
          <p className="text-sm text-txt-muted mb-4">
            Controle se seu perfil aparece no diretório de profissionais da landing page.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={profileVisible}
                onChange={(e) => setProfileVisible(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-primary/15 rounded-full peer-checked:bg-teal transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm font-medium text-txt">Aparecer no diretório de profissionais</span>
          </label>
          {profileVisible && (
            <p className="text-xs text-teal mt-2">Seu nome, especialidade, CRP e bio serão exibidos publicamente.</p>
          )}
        </div>

        {/* Link para Horários */}
        <Link
          href="/admin/horarios"
          className="flex items-center gap-4 bg-card rounded-brand p-6 shadow-sm border border-primary/5 hover:border-primary/20 hover:shadow-warm-md transition-all group"
        >
          <div className="w-10 h-10 rounded-brand-sm bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
            <CalendarClock className="w-5 h-5 text-primary-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-semibold text-txt">Horários de Atendimento</h3>
            <p className="text-sm text-txt-muted mt-0.5">
              Configure grade semanal, bloqueie datas e gerencie disponibilidades no calendário completo.
            </p>
          </div>
          <span className="text-txt-muted text-lg group-hover:text-primary-dark transition-colors">›</span>
        </Link>

        {/* Valor da Videochamada */}
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">Valor da Sessão</h3>
          <p className="text-sm text-txt-muted mb-4">Valor exibido aos pacientes ao agendar uma sessão online.</p>
          {pricing.map((p, idx) => (
            <div key={p.key} className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-sm text-txt-light">{p.label}</span>
                <span className="text-xs text-txt-muted ml-1">({p.duration})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-txt-muted">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={p.value}
                  onChange={(e) => updatePricing(idx, e.target.value)}
                  className="w-28 py-2 px-3 border border-primary/15 rounded-brand-sm text-sm text-right"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Áreas de Atuação */}
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">Áreas de Atuação</h3>
          <p className="text-sm text-txt-muted mb-4">Selecione suas especialidades para o diretório público e o portal do paciente.</p>
          <div className="flex flex-wrap gap-3">
            {AREAS.map((area) => (
              <label
                key={area}
                className={`flex items-center gap-2 px-3 py-2 rounded-brand-sm border cursor-pointer transition-colors text-sm ${
                  areas.includes(area)
                    ? "border-primary bg-primary/10 text-primary-dark font-medium"
                    : "border-primary/10 bg-card text-txt-light hover:border-primary/30"
                }`}
              >
                <input type="checkbox" checked={areas.includes(area)} onChange={() => toggleArea(area)} className="sr-only" />
                {area}
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-brand-primary disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
