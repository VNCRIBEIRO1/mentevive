"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
};

export default function PacientesPage() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback((q?: string) => {
    const url = q ? `/api/patients?q=${encodeURIComponent(q)}` : "/api/patients";
    fetch(url)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPatients(Array.isArray(d) ? d : []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    const t = setTimeout(() => { if (search) fetchPatients(search); else fetchPatients(); }, 300);
    return () => clearTimeout(t);
  }, [search, fetchPatients]);

  const filtered = patients;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-txt">Pacientes</h1>
          <p className="text-sm text-txt-light mt-1">Gerencie seus pacientes</p>
        </div>
        <Link href="/admin/pacientes/novo" className="btn-brand-primary text-sm">
          + Novo Paciente
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input type="text" placeholder="Buscar por nome, e-mail ou telefone…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md py-2.5 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-brand shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-bg">
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">E-mail</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Telefone</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Portal</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-txt-muted">
                    {patients.length === 0
                      ? "Nenhum paciente cadastrado. Clique em \"+ Novo Paciente\" para começar."
                      : "Nenhum resultado encontrado."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-primary/5 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-txt">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{p.email}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{p.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold
                        ${p.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {p.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.userId ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-blue-100 text-blue-600">
                          ✅ Ativo
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-gray-100 text-gray-500">
                          Sem acesso
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/pacientes/${p.id}`}
                        className="text-xs text-primary-dark font-bold hover:underline">
                        Ver detalhes →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
