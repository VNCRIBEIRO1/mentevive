export type Appointment = {
  id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: string;
  status: string;
  notes: string | null;
  patientNotes: string | null;
  meetingUrl: string | null;
  therapistFeedback: string | null;
};

export type PatientOption = { id: string; name: string };

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const statusLabel: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmada", cancelled: "Cancelada",
  completed: "Realizada", no_show: "Não compareceu",
};
export const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-600", confirmed: "bg-green-100 text-green-600",
  cancelled: "bg-red-100 text-red-500", completed: "bg-blue-100 text-blue-600",
  no_show: "bg-gray-100 text-gray-500",
};
export const dotColor: Record<string, string> = {
  pending: "bg-yellow-400", confirmed: "bg-green-400",
  cancelled: "bg-red-400", completed: "bg-blue-400",
  no_show: "bg-gray-400",
};

export const inputCls =
  "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export const pad = (n: number) => String(n).padStart(2, "0");
