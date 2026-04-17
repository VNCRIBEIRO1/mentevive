"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, PROFESSIONAL_NAME } from "@/lib/utils";
import { getAvailabilityForDate, getTimeOptionsForDate, type AvailabilitySlot } from "@/lib/availability-slots";
import { CalendarPlus, ArrowLeft, Sparkles } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

const MONTHS = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const STEP_ORDER = ["date", "time", "confirm", "payment"] as const;

type PricingItem = { label: string; key: string; duration: string; value: string };
type BookedSlot = { date: string; startTime: string };
type BlockedDate = { date: string; reason?: string };
type Step = "date" | "time" | "confirm" | "payment" | "done";
type PaymentState = "idle" | "pending" | "paid" | "cancelled";

type ScheduleResponse = {
  appointment?: { id: string };
  payment?: { id: string; amount: string; status: string; description: string | null };
  checkout?: { checkoutUrl: string; sessionId: string } | null;
  stripeEnabled?: boolean;
  error?: string;
};

type StripeStatusResponse = {
  status: string;
  stripeStatus: string | null;
  paymentMethod: string | null;
  amount: number;
  paymentId: string;
  appointmentId: string | null;
  checkoutUrl: string | null;
  description: string | null;
  message?: string;
  error?: string;
};

type CreateCheckoutResponse = {
  checkoutUrl: string;
  sessionId: string;
  error?: string;
};

function AgendarPageContent() {
  const searchParams = useSearchParams();
  const bookingDate = searchParams.get("date");
  const bookingTime = searchParams.get("time");
  const bookingNotes = searchParams.get("notes");
  const stripeStatusParam = searchParams.get("stripe_status");
  const returnPaymentId = searchParams.get("paymentId");
  const returnAppointmentId = searchParams.get("appointmentId");
  const hasBookingParams = !!(bookingDate && bookingTime);

  const now = new Date();
  const initialMonth = bookingDate ? new Date(bookingDate + "T00:00:00").getMonth() : now.getMonth();
  const initialYear = bookingDate ? new Date(bookingDate + "T00:00:00").getFullYear() : now.getFullYear();

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [step, setStep] = useState<Step>(() => {
    if (stripeStatusParam === "success") return "done";
    if (stripeStatusParam === "cancelled" && hasBookingParams) return "payment";
    return hasBookingParams ? "confirm" : "date";
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(bookingDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(bookingTime);
  const [notes, setNotes] = useState(bookingNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(returnPaymentId);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(returnAppointmentId);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>(() => {
    if (stripeStatusParam === "success") return "paid";
    if (stripeStatusParam === "cancelled") return "cancelled";
    return "idle";
  });
  const [stripeMethod, setStripeMethod] = useState<string | null>(null);
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const isStripeTestMode = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").startsWith("pk_test_");

  const getPrice = useCallback((): number => {
    const item = pricing.find((p) => p.key === "individual_online");
    return item && item.value ? Number(item.value) : 0;
  }, [pricing]);

  const displayAmount = confirmedAmount ?? getPrice();
  const currentStepIndex = step === "done" ? STEP_ORDER.length : STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);

  const assistantMessages: Record<Step, string> = {
    date: loadingAvail
      ? "Carregando horarios disponiveis, um momento..."
      : availability.length === 0
        ? "Nenhum horario disponivel no momento. Se preferir, me chame no WhatsApp para combinar outra opcao."
        : "Vamos agendar sua sessao. Primeiro, escolha uma data disponivel no calendario abaixo.",
    time: "Perfeito. Agora escolha o horario de inicio da sua sessao de 1 hora.",
    confirm: "Revise os detalhes do agendamento. Quando estiver tudo certo, seguimos para a cobranca segura no Stripe.",
    payment: paymentState === "paid"
      ? `Pagamento identificado. Agora voce ja pode compartilhar a mensagem pronta com ${PROFESSIONAL_NAME || "seu/sua psicólogo(a)"}.`
      : "Seu agendamento foi criado. Falta apenas concluir o pagamento seguro via Stripe para finalizar o fluxo.",
    done: verifyingPayment
      ? "Estou validando o retorno do Stripe para confirmar o pagamento..."
      : "Tudo certo. Seu agendamento e seu pagamento ja foram registrados no sistema.",
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [availRes, settingsRes, apptsRes, blockedRes, bookedRes] = await Promise.all([
          fetch("/api/portal/availability"),
          fetch("/api/portal/settings"),
          fetch("/api/portal/appointments"),
          fetch("/api/portal/blocked-dates").catch(() => null),
          fetch("/api/portal/booked-slots").catch(() => null),
        ]);

        if (availRes.ok) {
          const data = await availRes.json();
          setAvailability(Array.isArray(data) ? data : []);
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.pricing && Array.isArray(data.pricing)) {
            setPricing(data.pricing);
          }
        }

        if (bookedRes && bookedRes.ok) {
          const data = await bookedRes.json();
          if (Array.isArray(data)) setBookedSlots(data);
        } else if (apptsRes.ok) {
          const data = await apptsRes.json();
          if (Array.isArray(data)) {
            const booked = data
              .map((row: Record<string, unknown>) => {
                const apt = (row.appointment ?? row) as Record<string, unknown>;
                return { date: apt.date as string, startTime: apt.startTime as string, status: apt.status as string };
              })
              .filter((apt: { status: string }) => apt.status !== "cancelled");
            setBookedSlots(booked);
          }
        }

        if (blockedRes && blockedRes.ok) {
          const data = await blockedRes.json();
          if (Array.isArray(data)) setBlockedDates(data);
        }
      } catch {
        setNotice("Nao foi possivel carregar todos os horarios agora. Tente novamente em instantes.");
      }
      setLoadingAvail(false);
    };

    void init();
  }, []);

  const createCheckoutForPayment = useCallback(async (paymentId: string, redirectToCheckout = false) => {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json() as CreateCheckoutResponse;

      if (!res.ok) {
        setError(data.error || "Nao foi possivel preparar o checkout agora.");
        return null;
      }

      setCheckoutUrl(data.checkoutUrl || null);
      setPaymentState("pending");
      setNotice(
        isStripeTestMode
          ? "Checkout de teste pronto. Abra o Stripe e conclua com o cartao 4242 4242 4242 4242 para liberar a proxima etapa."
          : "Checkout pronto. Finalize o pagamento no Stripe e depois volte aqui para confirmar."
      );

      if (redirectToCheckout && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }

      return data.checkoutUrl || null;
    } catch {
      setError("Erro ao gerar o checkout do Stripe.");
      return null;
    }
  }, [isStripeTestMode]);

  const verifyPayment = useCallback(async (paymentId: string) => {
    setVerifyingPayment(true);
    setError("");

    try {
      const res = await fetch(`/api/stripe/status?paymentId=${paymentId}`);
      const data = await res.json() as StripeStatusResponse;

      if (!res.ok) {
        setError(data.error || "Nao foi possivel validar o pagamento agora.");
        setStep("payment");
        return;
      }

      setCreatedPaymentId(data.paymentId || paymentId);
      if (data.appointmentId) setCreatedAppointmentId(data.appointmentId);
      if (typeof data.amount === "number" && Number.isFinite(data.amount)) {
        setConfirmedAmount(data.amount);
      }
      setStripeMethod(data.paymentMethod || null);
      setCheckoutUrl(data.checkoutUrl || null);

      if (data.status === "paid") {
        setPaymentState("paid");
        setNotice("Pagamento aprovado e conciliado automaticamente.");
        setStep("done");
      } else if (data.status === "cancelled") {
        setPaymentState("cancelled");
        setNotice("O checkout foi cancelado. Voce pode tentar novamente quando quiser.");
        setStep("payment");
      } else {
        setPaymentState("pending");
        const nextCheckoutUrl = data.checkoutUrl || await createCheckoutForPayment(paymentId);
        if (nextCheckoutUrl) {
          setCheckoutUrl(nextCheckoutUrl);
          setNotice(
            isStripeTestMode
              ? "Ainda nao encontrei um pagamento aprovado. Em modo teste, abra o checkout abaixo, use o cartao 4242 4242 4242 4242 e depois clique em verificar novamente."
              : "O pagamento ainda nao foi concluido. Abra o checkout abaixo, finalize a cobranca e depois clique em verificar novamente."
          );
        } else {
          setNotice(data.message || "O pagamento ainda esta em processamento. Se voce ja concluiu o checkout, clique em verificar novamente em alguns segundos.");
        }
        setStep("payment");
      }
    } catch {
      setError("Erro ao consultar o status do Stripe.");
      setStep("payment");
    } finally {
      setVerifyingPayment(false);
    }
  }, [createCheckoutForPayment, isStripeTestMode]);

  useEffect(() => {
    if (!returnPaymentId || !stripeStatusParam) return;

    setCreatedPaymentId(returnPaymentId);
    if (returnAppointmentId) setCreatedAppointmentId(returnAppointmentId);
    if (bookingDate) setSelectedDate(bookingDate);
    if (bookingTime) setSelectedTime(bookingTime);

    if (stripeStatusParam === "cancelled") {
      setPaymentState("cancelled");
      setNotice("O pagamento nao foi concluido. Seu agendamento continua reservado para voce retomar a cobranca.");
      setStep("payment");
      return;
    }

    if (stripeStatusParam === "success") {
      void verifyPayment(returnPaymentId);
    }
  }, [bookingDate, bookingTime, returnAppointmentId, returnPaymentId, stripeStatusParam, verifyPayment]);

  const changeMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const isAvailableDay = (d: number) => {
    const dt = new Date(year, month, d);
    const dateStr = fmtDate(d);
    if (dt < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;
    if (blockedDates.some((b) => b.date === dateStr)) return false;
    return getAvailabilityForDate(dateStr, availability).length > 0;
  };

  const getTimeSlotsForDate = (dateStr: string) => {
    return getTimeOptionsForDate(dateStr, availability)
      .filter((time) => !bookedSlots.some((slot) => slot.date === dateStr && slot.startTime === time));
  };

  const handleSelectDate = (d: number) => {
    if (!isAvailableDay(d)) return;
    setSelectedDate(fmtDate(d));
    setSelectedTime(null);
    setError("");
    setNotice("");
    setStep("time");
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setError("");
    setNotice("");
    setStep("confirm");
  };

  const getEndTime = useCallback((time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return `${String(hour + 1).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }, []);

  const fmtDateBR = useCallback((date: string) =>
    new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }), []);

  const methodLabel = useMemo(() => {
    if (stripeMethod === "pix") return "PIX no Stripe";
    if (stripeMethod === "card") return "cartao no Stripe";
    return "Stripe";
  }, [stripeMethod]);

  const buildPaidConfirmationMessage = useCallback(() => {
    if (!selectedDate || !selectedTime) return "";
    const amountLabel = formatCurrency(displayAmount || 0);

    return `*Agendamento confirmado e pagamento aprovado*\n\n` +
      `Ol\u00e1! Tudo bem?\n` +
      `Conclu\u00ed pelo site o agendamento e o pagamento da minha sess\u00e3o.\n\n` +
      `*Data:* ${fmtDateBR(selectedDate)}\n` +
      `*Horario:* ${selectedTime} as ${getEndTime(selectedTime)}\n` +
      `*Modalidade:* Online (videochamada)\n` +
      `*Valor:* ${amountLabel}\n` +
      `*Pagamento:* aprovado via ${methodLabel}\n\n` +
      `Se precisar de mais alguma informacao, fico a disposicao.\n` +
      `Obrigada!`;
  }, [displayAmount, fmtDateBR, getEndTime, methodLabel, selectedDate, selectedTime]);

  const sendWhatsApp = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(successMessage);
    } catch {
      setError("Nao foi possivel copiar agora.");
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          startTime: selectedTime,
          notes: notes || null,
        }),
      });

      const data = await res.json() as ScheduleResponse;

      if (!res.ok) {
        setError(data.error || "Erro ao criar o agendamento. Tente novamente.");
        return;
      }

      if (data.appointment?.id) setCreatedAppointmentId(data.appointment.id);
      if (data.payment?.id) setCreatedPaymentId(data.payment.id);
      if (data.payment?.amount) setConfirmedAmount(Number(data.payment.amount));
      setCheckoutUrl(data.checkout?.checkoutUrl || null);
      setPaymentState(data.payment?.status === "paid" ? "paid" : "pending");
      setBookedSlots((prev) => [...prev, { date: selectedDate, startTime: selectedTime }]);

      if (data.checkout?.checkoutUrl) {
        setNotice("Agendamento criado. Agora falta so concluir o pagamento no Checkout do Stripe.");
      } else if (data.stripeEnabled) {
        setNotice("Agendamento criado, mas nao consegui gerar o checkout agora. Voce pode tentar novamente em alguns instantes pela tela de pagamentos.");
      } else {
        setNotice("Agendamento criado, mas o pagamento online ainda nao esta disponivel neste ambiente.");
      }

      setStep("payment");
    } catch {
      setError("Erro de conexao. Verifique sua internet.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PortalPageHeader
        icon={<CalendarPlus className="w-6 h-6" />}
        title="Agendar Sessão"
        gradient="teal"
        action={
          <Link href="/portal" className="text-xs text-teal-dark font-bold hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao portal
          </Link>
        }
      />

      <div className="bg-gradient-to-r from-teal/8 to-accent/8 rounded-2xl p-5 mb-6 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal/12 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-teal" />
        </div>
        <div>
          <p className="text-sm font-semibold text-txt mb-1">Assistente de Agendamento</p>
          <p className="text-sm text-txt-light">{assistantMessages[step]}</p>
        </div>
      </div>

      {/* Progress Steps */}
      {step !== "done" && (
        <div className="flex items-center gap-1 mb-6 px-1" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={STEP_ORDER.length}>
          {STEP_ORDER.map((s, i) => {
            const labels = { date: "Data", time: "Horário", confirm: "Confirmar", payment: "Pagamento" };
            const done = i < currentStepIndex;
            const active = i === currentStepIndex;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? "bg-primary text-white" : active ? "bg-primary/20 text-primary-dark border-2 border-primary" : "bg-gray-100 text-txt-muted"}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-[0.6rem] mt-1 font-bold ${active ? "text-primary-dark" : done ? "text-primary" : "text-txt-muted"}`}>
                    {labels[s]}
                  </span>
                </div>
                {i < STEP_ORDER.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded ${done ? "bg-primary" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm mb-6">
          {error}
        </div>
      )}

      {notice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-brand-sm mb-6">
          {notice}
        </div>
      )}

      {hasBookingParams && step === "confirm" && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-brand-sm mb-6 flex items-center gap-2">
          <span>✨</span>
          <span>Seus dados de agendamento foram preservados. Revise e confirme abaixo.</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-8">
        {STEP_ORDER.map((stepKey, index) => (
          <div key={stepKey} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              currentStepIndex === index
                ? "bg-primary text-white"
                : currentStepIndex > index
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}>
              {currentStepIndex > index ? "\u2713" : index + 1}
            </div>
            {index < STEP_ORDER.length - 1 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === "date" && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg font-semibold text-txt">{MONTHS[month]} {year}</h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full border-[1.5px] border-primary bg-transparent text-primary-dark flex items-center justify-center hover:bg-primary hover:text-white transition-colors">&lsaquo;</button>
              <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full border-[1.5px] border-primary bg-transparent text-primary-dark flex items-center justify-center hover:bg-primary hover:text-white transition-colors">&rsaquo;</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-bold text-txt-muted py-2">{day}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = fmtDate(day);
              const isBlocked = blockedDates.some((blocked) => blocked.date === dateStr);
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const available = isAvailableDay(day);

              return (
                <button
                  key={day}
                  onClick={() => handleSelectDate(day)}
                  disabled={!available}
                  className={`h-10 rounded-brand-sm text-sm font-medium transition-colors relative ${
                    available ? "hover:bg-primary hover:text-white cursor-pointer text-txt" : "text-gray-300 cursor-not-allowed"
                  } ${isToday ? "border-2 border-primary text-primary-dark" : ""} ${isBlocked ? "bg-red-50 line-through" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {availability.length === 0 && (
            <p className="text-sm text-txt-muted text-center mt-4">
              {loadingAvail ? "Carregando horarios disponiveis..." : "Nenhum horario configurado. Entre em contato pelo WhatsApp."}
            </p>
          )}
        </div>
      )}

      {step === "time" && selectedDate && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-xl">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">{fmtDateBR(selectedDate)}</h3>
          <p className="text-sm text-txt-muted mb-4">Selecione o horario da sessao (1 hora):</p>

          {getTimeSlotsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-txt-muted">Todos os horarios deste dia ja estao ocupados.</p>
              <button onClick={() => { setStep("date"); setSelectedDate(null); }} className="mt-3 text-xs text-primary-dark font-bold hover:underline">
                &larr; Escolher outra data
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                {getTimeSlotsForDate(selectedDate).map((time) => (
                  <button
                    key={time}
                    onClick={() => handleSelectTime(time)}
                    className={`py-2.5 px-3 rounded-brand-sm text-sm font-medium border transition-colors ${
                      selectedTime === time
                        ? "border-primary bg-primary text-white"
                        : "border-primary/15 text-txt hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    <span>{time}</span>
                    <span className="block text-[0.65rem] opacity-70">ate {getEndTime(time)}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => { setStep("date"); setSelectedDate(null); }} className="text-xs text-primary-dark font-bold hover:underline">
                &larr; Escolher outra data
              </button>
            </>
          )}
        </div>
      )}

      {step === "confirm" && selectedDate && selectedTime && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-xl">
          <h3 className="font-heading text-base font-semibold text-txt mb-4">Confirme seu Agendamento</h3>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Data</span>
              <span className="text-txt font-medium">{fmtDateBR(selectedDate)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Horario</span>
              <span className="text-txt font-medium">{selectedTime} - {getEndTime(selectedTime)} (1 hora)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Modalidade</span>
              <span className="text-txt font-medium">Online (videochamada)</span>
            </div>
            {displayAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-primary/5">
                <span className="text-txt-muted">Valor</span>
                <span className="text-txt font-bold text-lg">{formatCurrency(displayAmount)}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold mb-1.5">Observacoes (opcional)</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Alguma observacao para a sessao..."
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y"
            />
          </div>

          <div className="rounded-brand-sm border border-primary/10 bg-primary/5 p-4 mb-6">
            <p className="text-sm font-semibold text-txt">Como funciona a etapa seguinte</p>
            <p className="text-xs text-txt-muted mt-1">
              Assim que voce confirmar, o sistema cria o agendamento e a cobranca. Em seguida, voce sera direcionado(a) para o Checkout seguro do Stripe para pagar com cartao ou PIX.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={saving} className="btn-brand-primary flex-1 disabled:opacity-50">
              {saving ? "Criando agendamento..." : "Continuar para o pagamento"}
            </button>
            <button onClick={() => setStep("time")} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
              Voltar
            </button>
          </div>
        </div>
      )}

      {step === "payment" && selectedDate && selectedTime && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-2xl">
          <div className="text-center mb-6">
            <span className="text-4xl">&#128179;</span>
            <h3 className="font-heading text-lg font-semibold text-txt mt-3">Pagamento do agendamento</h3>
            <p className="text-sm text-txt-muted mt-1">
              {fmtDateBR(selectedDate)} as {selectedTime}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-brand-sm border border-primary/10 bg-bg/50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-txt-muted">Resumo</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-txt-muted">Horario</span>
                  <span className="font-medium text-txt">{selectedTime} - {getEndTime(selectedTime)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-txt-muted">Modalidade</span>
                  <span className="font-medium text-txt">Online (videochamada)</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-txt-muted">Agendamento</span>
                  <span className="font-medium text-txt">{createdAppointmentId ? "Criado" : "Em criacao"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-txt-muted">Pagamento</span>
                  <span className={`font-medium ${paymentState === "paid" ? "text-green-700" : paymentState === "cancelled" ? "text-red-600" : "text-amber-700"}`}>
                    {paymentState === "paid" ? "Aprovado" : paymentState === "cancelled" ? "Cancelado" : "Pendente"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-primary/10 pt-2">
                  <span className="text-txt-muted">Valor</span>
                  <span className="font-bold text-txt">{formatCurrency(displayAmount || 0)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-brand-sm border border-[#635bff]/20 bg-[#635bff]/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4b45c6]">Stripe Checkout</p>
              <h4 className="mt-2 text-sm font-semibold text-txt">Finalize com pagamento seguro</h4>
              <p className="mt-2 text-xs text-txt-muted">
                Voce sera redirecionado(a) para o ambiente seguro do Stripe. O sistema aceita cartao e PIX, conforme disponibilidade da sua conta Stripe.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (checkoutUrl) {
                      window.location.href = checkoutUrl;
                      return;
                    }
                    if (createdPaymentId) {
                      void createCheckoutForPayment(createdPaymentId, true);
                    }
                  }}
                  disabled={!checkoutUrl && !createdPaymentId}
                  className="inline-flex items-center justify-center gap-2 rounded-brand-sm bg-[#635bff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4b45c6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  💳 Ir para o Checkout do Stripe
                </button>
                {createdPaymentId && (
                  <button
                    onClick={() => void verifyPayment(createdPaymentId)}
                    disabled={verifyingPayment}
                    className="rounded-brand-sm border border-primary/15 px-4 py-2.5 text-sm font-bold text-txt hover:bg-bg disabled:opacity-50"
                  >
                    {verifyingPayment ? "Verificando pagamento..." : "Ja paguei, verificar agora"}
                  </button>
                )}
                <Link href="/portal/pagamentos" className="text-center rounded-brand-sm border border-primary/15 px-4 py-2.5 text-sm font-bold text-txt hover:bg-bg">
                  Ver meus pagamentos
                </Link>
              </div>

              {paymentState !== "paid" && isStripeTestMode && (
                <div className="mt-4 rounded-brand-sm border border-[#635bff]/20 bg-white/70 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4b45c6]">Modo teste</p>
                  <p className="mt-2 text-xs text-txt-muted">
                    Para simular a aprovacao e ver os proximos passos, conclua o checkout com o cartao de teste{" "}
                    <span className="font-mono font-semibold text-txt">4242 4242 4242 4242</span>, data futura e qualquer CVC.
                  </p>
                </div>
              )}
            </div>
          </div>

          {paymentState === "paid" && (
            <div className="mt-5 rounded-brand-sm border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-900">Pagamento identificado</p>
              <p className="mt-1 text-xs text-green-700">
                O sistema ja conciliou o pagamento automaticamente. Agora voce pode enviar uma mensagem pronta para {PROFESSIONAL_NAME || "seu/sua psicólogo(a)"}, sem precisar mandar comprovante manual.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => sendWhatsApp(buildPaidConfirmationMessage())}
                  className="rounded-brand-sm bg-[#25D366] px-4 py-2 text-xs font-bold text-white hover:bg-[#1da855]"
                >
                  Enviar mensagem pronta
                </button>
                <button
                  onClick={() => void copyText(buildPaidConfirmationMessage(), "Mensagem de confirmacao copiada.")}
                  className="rounded-brand-sm border border-green-200 px-4 py-2 text-xs font-bold text-green-800 hover:bg-white"
                >
                  Copiar mensagem
                </button>
                <button
                  onClick={() => setStep("done")}
                  className="rounded-brand-sm border border-primary/15 px-4 py-2 text-xs font-bold text-txt hover:bg-white"
                >
                  Ir para conclusao
                </button>
                {createdAppointmentId && (
                  <Link
                    href={`/portal/sala-espera/${createdAppointmentId}`}
                    className="rounded-brand-sm border border-primary/15 px-4 py-2 text-xs font-bold text-txt hover:bg-white"
                  >
                    Ir para sala de espera
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-2xl">
          <div className="text-center">
            <span className="text-5xl">{verifyingPayment ? "⏳" : "🎉"}</span>
            <h3 className="font-heading text-lg font-semibold text-txt mt-4">
              {verifyingPayment ? "Validando o pagamento..." : "Agendamento e pagamento registrados"}
            </h3>
            <p className="text-sm text-txt-muted mt-2">
              {verifyingPayment
                ? "Um instante enquanto confirmo o retorno do Stripe."
                : `Seu fluxo foi concluido no site. Agora voce pode avisar ${PROFESSIONAL_NAME || "seu/sua psicólogo(a)"} com a mensagem pronta abaixo.`}
            </p>
          </div>

          {!verifyingPayment && selectedDate && selectedTime && (
            <>
              <div className="mt-6 rounded-brand-sm border border-primary/10 bg-primary/5 p-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-txt-muted">Sessao</p>
                    <p className="mt-1 font-medium text-txt">{fmtDateBR(selectedDate)}</p>
                    <p className="text-txt-light">{selectedTime} - {getEndTime(selectedTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-txt-muted">Pagamento</p>
                    <p className="mt-1 font-medium text-green-700">Aprovado via {methodLabel}</p>
                    <p className="text-txt-light">{formatCurrency(displayAmount || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-brand-sm border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-900">Mensagem pronta para compartilhar</p>
                <p className="mt-1 text-xs text-green-700">
                  Como o pagamento foi aprovado pelo Stripe, nao ha necessidade de enviar comprovante manual. Se quiser, voce pode apenas avisar que agendou e pagou.
                </p>
                <pre className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-brand-sm bg-white/70 p-3 text-xs leading-relaxed text-green-900">
                  {buildPaidConfirmationMessage()}
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => sendWhatsApp(buildPaidConfirmationMessage())}
                    className="rounded-brand-sm bg-[#25D366] px-4 py-2 text-xs font-bold text-white hover:bg-[#1da855]"
                  >
                    Enviar pelo WhatsApp
                  </button>
                  <button
                    onClick={() => void copyText(buildPaidConfirmationMessage(), "Mensagem copiada com sucesso.")}
                    className="rounded-brand-sm border border-green-200 px-4 py-2 text-xs font-bold text-green-800 hover:bg-white"
                  >
                    Copiar mensagem
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {createdAppointmentId && (
              <Link href={`/portal/sala-espera/${createdAppointmentId}`} className="btn-brand-primary">
                Ir para sala de espera
              </Link>
            )}
            <Link href="/portal/sessoes" className="btn-brand-primary">Ver minhas sessoes</Link>
            <Link href="/portal/pagamentos" className="btn-brand-outline">Ver pagamentos</Link>
            <Link href="/portal" className="btn-brand-outline">Voltar ao portal</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <AgendarPageContent />
    </Suspense>
  );
}
