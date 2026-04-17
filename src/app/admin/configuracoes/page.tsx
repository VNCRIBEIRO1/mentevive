"use client";
import { useState, useEffect } from "react";

const DAY_NAMES = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

const AREAS = [
  "Ansiedade", "Depressao", "Traumas", "Autoestima", "Burnout Digital",
  "Relacionamentos", "Luto", "Autoconhecimento", "ACT", "Terapia de Casal", "Criadores de Conteudo",
];

type AvailSlot = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

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
  const [slots, setSlots] = useState<AvailSlot[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>(defaultPricing);
  const [areas, setAreas] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session?.user) {
            setName(session.user.name || "");
            setEmail(session.user.email || "");
            setPhone(session.user.phone || "");
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile) {
            setSpecialty(profile.specialty || "");
            setBio(profile.bio || "");
            setCrp(profile.crp || "");
            setProfileVisible(profile.profileVisible || false);
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/availability");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSlots(data);
          } else {
            setSlots([1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: "08:00", endTime: "20:00", active: true })));
          }
        }
      } catch {
        setSlots([1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: "08:00", endTime: "20:00", active: true })));
      }

      try {
        const res = await fetch("/api/settings?key=pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.value && Array.isArray(data.value)) {
            const incoming = data.value as PricingItem[];
            const videoItem = incoming.find((p) => p.key === "videochamada") || incoming.find((p) => p.key === "individual_online");
            setPricing([{ ...defaultPricing[0], value: videoItem?.value || "" }]);
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/settings?key=areas");
        if (res.ok) {
          const data = await res.json();
          if (data.value && Array.isArray(data.value)) {
            setAreas(data.value);
          }
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

  const updateSlot = (idx: number, field: keyof AvailSlot, value: string | boolean | number) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
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
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
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

    flash(hasError ? "Erro ao salvar algumas configuracoes." : "Configuracoes salvas com sucesso.", hasError ? "error" : "success");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-txt-muted">Carregando configuracoes...</p>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 border text-sm px-5 py-3 rounded-brand-sm shadow-lg ${toastType === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-card border-primary/20 text-txt"}`}>
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-txt">Configuracoes</h1>
        <p className="text-sm text-txt-light mt-1">Configuracoes da plataforma</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-4">Perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">E-mail</label>
              <input type="email" value={email} readOnly className={inputCls + " bg-bg cursor-not-allowed"} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Telefone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="(11) 98884-0525" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">CRP</label>
              <input type="text" value={crp} onChange={(e) => setCrp(e.target.value)} className={inputCls} placeholder="06/123456" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Especialidade</label>
              <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inputCls} placeholder="Ex: Terapia Cognitivo-Comportamental" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputCls + " resize-none"} placeholder="Uma breve descricao sobre voce e sua abordagem..." maxLength={500} />
              <span className="text-xs text-txt-muted mt-1 block">{bio.length}/500</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">Diretorio Publico</h3>
          <p className="text-sm text-txt-muted mb-4">Controle se seu perfil aparece no diretorio de profissionais da landing page.</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={profileVisible} onChange={(e) => setProfileVisible(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-primary/15 rounded-full peer-checked:bg-teal transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
            </div>
            <span className="text-sm font-medium text-txt">Aparecer no diretorio de profissionais</span>
          </label>
          {profileVisible && (
            <p className="text-xs text-teal mt-2">Seu nome, especialidade, CRP e bio serao exibidos publicamente.</p>
          )}
        </div>

        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">Horarios de Atendimento</h3>
          <p className="text-sm text-txt-muted mb-4">Configure seus horarios disponiveis. As sessoes duram 1 hora.</p>
          <div className="space-y-2">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-primary/5 last:border-0 flex-wrap">
                <label className="flex items-center gap-2 w-28 shrink-0">
                  <input type="checkbox" checked={slot.active} onChange={(e) => updateSlot(idx, "active", e.target.checked)} className="rounded border-primary/30 text-primary-dark focus:ring-primary/20" />
                  <span className="text-sm font-medium text-txt">{DAY_NAMES[slot.dayOfWeek]}</span>
                </label>
                <input type="time" value={slot.startTime} onChange={(e) => updateSlot(idx, "startTime", e.target.value)} disabled={!slot.active} step="3600" className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm disabled:opacity-50" />
                <span className="text-xs text-txt-muted">ate</span>
                <input type="time" value={slot.endTime} onChange={(e) => updateSlot(idx, "endTime", e.target.value)} disabled={!slot.active} step="3600" className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm disabled:opacity-50" />
                <button onClick={() => removeSlot(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold ml-1" title="Remover horario">x</button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <select id="newSlotDay" className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm" defaultValue="6">
              {DAY_NAMES.map((n, i) => (
                <option key={i} value={i}>{n}</option>
              ))}
            </select>
            <button onClick={() => {
              const sel = document.getElementById("newSlotDay") as HTMLSelectElement;
              const dow = Number(sel.value);
              setSlots((prev) => [...prev, { dayOfWeek: dow, startTime: "09:00", endTime: "13:00", active: true }]);
            }} className="text-xs text-primary-dark font-bold hover:underline">+ Adicionar horario</button>
          </div>
        </div>

        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">Valor da Videochamada</h3>
          <p className="text-sm text-txt-muted mb-4">Valor fixo exibido no agendamento de sessoes online.</p>
          {pricing.map((p, idx) => (
            <div key={p.key} className="flex items-center gap-4">
              <div className="flex-1">
                <span className="text-sm text-txt-light">{p.label}</span>
                <span className="text-xs text-txt-muted ml-1">({p.duration})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-txt-muted">R$</span>
                <input type="number" placeholder="0,00" value={p.value} onChange={(e) => updatePricing(idx, e.target.value)} className="w-24 py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm text-right" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">Areas de Atuacao</h3>
          <p className="text-sm text-txt-muted mb-4">Selecione suas especialidades para integracao futura no SaaS.</p>
          <div className="flex flex-wrap gap-3">
            {AREAS.map((area) => (
              <label key={area} className={`flex items-center gap-2 px-3 py-2 rounded-brand-sm border cursor-pointer transition-colors text-sm ${areas.includes(area) ? "border-primary bg-primary/10 text-primary-dark font-medium" : "border-primary/10 bg-card text-txt-light hover:border-primary/30"}`}>
                <input type="checkbox" checked={areas.includes(area)} onChange={() => toggleArea(area)} className="sr-only" />
                {area}
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-brand-primary disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar Configuracoes"}
        </button>
      </div>
    </div>
  );
}
