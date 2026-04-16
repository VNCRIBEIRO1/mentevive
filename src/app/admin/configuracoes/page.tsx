"use client";
import { useState, useEffect } from "react";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const AREAS = [
  "Ansiedade", "Depressão", "Traumas", "Autoestima", "Burnout Digital",
  "Relacionamentos", "Luto", "Autoconhecimento", "ACT",
  "Terapia de Casal", "Criadores de Conteúdo", "Terapia de Grupo",
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
  { label: "Terapia Individual Online", key: "individual_online", duration: "60 min", value: "" },
  { label: "Terapia Individual Presencial", key: "individual_presencial", duration: "60 min", value: "" },
  { label: "Ansiedade & Depressão", key: "ansiedade", duration: "60 min", value: "" },
  { label: "Tratamento de Traumas", key: "traumas", duration: "60 min", value: "" },
  { label: "Criadores de Conteúdo", key: "criadores", duration: "60 min", value: "" },
  { label: "Terapia de Casal", key: "casal", duration: "60 min", value: "" },
  { label: "Grupo Terapêutico", key: "grupo", duration: "90 min", value: "" },
];

const inputCls =
  "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function ConfiguracoesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState<AvailSlot[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>(defaultPricing);
  const [areas, setAreas] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Load data */
  useEffect(() => {
    const init = async () => {
      // Profile from session
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
      } catch { /* ignore */ }

      // Availability
      try {
        const res = await fetch("/api/availability");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSlots(data);
          } else {
            // Default: Mon-Fri 08:00-20:00
            setSlots(
              [1, 2, 3, 4, 5].map((d) => ({
                dayOfWeek: d,
                startTime: "08:00",
                endTime: "20:00",
                active: true,
              }))
            );
          }
        }
      } catch {
        setSlots(
          [1, 2, 3, 4, 5].map((d) => ({
            dayOfWeek: d,
            startTime: "08:00",
            endTime: "20:00",
            active: true,
          }))
        );
      }

      // Pricing from DB (fallback to localStorage for migration)
      try {
        const res = await fetch("/api/settings?key=pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.value && Array.isArray(data.value)) {
            setPricing(data.value);
          } else {
            // Try localStorage fallback
            const stored = localStorage.getItem("mv_pricing");
            if (stored) {
              const parsed = JSON.parse(stored) as PricingItem[];
              // Migrate old format to new format
              const migrated = defaultPricing.map((dp) => {
                const old = parsed.find((p: PricingItem) => p.key === dp.key);
                return old ? { ...dp, value: old.value } : dp;
              });
              setPricing(migrated);
            }
          }
        }
      } catch { /* ignore */ }

      // Areas from DB (fallback to localStorage)
      try {
        const res = await fetch("/api/settings?key=areas");
        if (res.ok) {
          const data = await res.json();
          if (data.value && Array.isArray(data.value)) {
            setAreas(data.value);
          } else {
            const stored = localStorage.getItem("mv_areas");
            if (stored) setAreas(JSON.parse(stored));
          }
        }
      } catch { /* ignore */ }

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

  /* Save all */
  const handleSave = async () => {
    setSaving(true);
    let hasError = false;

    // Save profile (name + phone)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) {
        hasError = true;
        console.error("Profile save failed:", await res.text());
      }
    } catch {
      hasError = true;
    }

    // Save availability (batch)
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) {
        hasError = true;
        console.error("Availability save failed:", await res.text());
      }
    } catch {
      hasError = true;
    }

    // Save pricing to DB
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pricing", value: pricing }),
      });
      if (!res.ok) hasError = true;
      // Keep localStorage in sync for fallback
      localStorage.setItem("mv_pricing", JSON.stringify(pricing));
    } catch { hasError = true; }

    // Save areas to DB
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "areas", value: areas }),
      });
      if (!res.ok) hasError = true;
      localStorage.setItem("mv_areas", JSON.stringify(areas));
    } catch { hasError = true; }

    if (hasError) {
      flash("Erro ao salvar algumas configurações. Verifique o console.", "error");
    } else {
      flash("Configurações salvas com sucesso! ✅");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-txt-muted">Carregando configurações…</p>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 border text-sm px-5 py-3 rounded-brand-sm shadow-lg ${
          toastType === "error"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-white border-primary/20 text-txt"
        }`}>
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-txt">Configurações</h1>
        <p className="text-sm text-txt-light mt-1">Configurações da plataforma</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-4">👤 Perfil</h3>
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
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">📅 Horários de Atendimento</h3>
          <p className="text-sm text-txt-muted mb-4">
            Configure seus horários disponíveis. As sessões duram <strong>1 hora</strong>, agendamentos apenas de hora em hora.
          </p>
          <div className="space-y-2">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-primary/5 last:border-0 flex-wrap">
                <label className="flex items-center gap-2 w-28 shrink-0">
                  <input
                    type="checkbox"
                    checked={slot.active}
                    onChange={(e) => updateSlot(idx, "active", e.target.checked)}
                    className="rounded border-primary/30 text-primary-dark focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium text-txt">{DAY_NAMES[slot.dayOfWeek]}</span>
                </label>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(idx, "startTime", e.target.value)}
                  disabled={!slot.active}
                  step="3600"
                  className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm disabled:opacity-50"
                />
                <span className="text-xs text-txt-muted">até</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(idx, "endTime", e.target.value)}
                  disabled={!slot.active}
                  step="3600"
                  className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm disabled:opacity-50"
                />
                <button
                  onClick={() => removeSlot(idx)}
                  className="text-red-400 hover:text-red-600 text-xs font-bold ml-1"
                  title="Remover horário"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <select
              id="newSlotDay"
              className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm"
              defaultValue="6"
            >
              {DAY_NAMES.map((n, i) => (
                <option key={i} value={i}>{n}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const sel = document.getElementById("newSlotDay") as HTMLSelectElement;
                const dow = Number(sel.value);
                setSlots((prev) => [
                  ...prev,
                  { dayOfWeek: dow, startTime: "09:00", endTime: "13:00", active: true },
                ]);
              }}
              className="text-xs text-primary-dark font-bold hover:underline"
            >
              + Adicionar horário
            </button>
          </div>
        </div>

        {/* Session Pricing */}
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">💰 Valores das Sessões</h3>
          <p className="text-sm text-txt-muted mb-4">
            Estes valores serão exibidos na hora do agendamento do paciente.
          </p>
          <div className="space-y-4">
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
                    className="w-24 py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Areas of Practice */}
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">🧠 Áreas de Atuação</h3>
          <p className="text-sm text-txt-muted mb-4">Selecione suas especialidades. Serão exibidas no site.</p>
          <div className="flex flex-wrap gap-3">
            {AREAS.map((area) => (
              <label
                key={area}
                className={`flex items-center gap-2 px-3 py-2 rounded-brand-sm border cursor-pointer transition-colors text-sm
                  ${areas.includes(area)
                    ? "border-primary bg-primary/10 text-primary-dark font-medium"
                    : "border-primary/10 bg-white text-txt-light hover:border-primary/30"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={areas.includes(area)}
                  onChange={() => toggleArea(area)}
                  className="sr-only"
                />
                {area}
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-brand-primary disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar Configurações 🌿"}
        </button>
      </div>
    </div>
  );
}
