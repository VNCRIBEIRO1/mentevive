"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoPacientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createAccount, setCreateAccount] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      cpf: form.get("cpf") as string,
      birthDate: form.get("birthDate") as string,
      gender: form.get("gender") as string,
      address: form.get("address") as string,
      emergencyContact: form.get("emergencyContact") as string,
      emergencyPhone: form.get("emergencyPhone") as string,
      notes: form.get("notes") as string,
      createAccount,
      password: createAccount ? (form.get("password") as string) : undefined,
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Erro ao cadastrar paciente.");
        setLoading(false);
        return;
      }

      router.push("/admin/pacientes");
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/pacientes" className="text-xs text-primary-dark font-bold hover:underline mb-2 inline-block">
          ← Voltar para pacientes
        </Link>
        <h1 className="font-heading text-2xl font-bold text-txt">Novo Paciente</h1>
        <p className="text-sm text-txt-light mt-1">Cadastre um novo paciente</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-brand p-8 shadow-sm border border-primary/5 max-w-2xl space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Nome completo *</label>
            <input name="name" type="text" required placeholder="Nome do paciente"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">E-mail</label>
            <input name="email" type="email" placeholder="email@exemplo.com"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Telefone *</label>
            <input name="phone" type="tel" required placeholder="(00) 99999-9999"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">CPF</label>
            <input name="cpf" type="text" placeholder="000.000.000-00"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Data de Nascimento</label>
            <input name="birthDate" type="date"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Gênero</label>
            <select name="gender"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="">Selecione</option>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="nao-binario">Não-binário</option>
              <option value="outro">Outro</option>
              <option value="prefere-nao-dizer">Prefere não dizer</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Endereço</label>
          <input name="address" type="text" placeholder="Endereço completo"
            className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Contato de Emergência</label>
            <input name="emergencyContact" type="text" placeholder="Nome do contato"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Tel. Emergência</label>
            <input name="emergencyPhone" type="tel" placeholder="(00) 99999-9999"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Observações</label>
          <textarea name="notes" rows={3} placeholder="Observações iniciais sobre o paciente…"
            className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y" />
        </div>

        {/* Create Portal Access */}
        <div className="border-t border-primary/10 pt-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary/20"
            />
            <div>
              <span className="text-xs font-bold text-txt">🔑 Criar acesso ao portal do paciente</span>
              <p className="text-[0.65rem] text-txt-muted">O paciente poderá fazer login e agendar sessões, ver pagamentos, etc.</p>
            </div>
          </label>

          {createAccount && (
            <div className="mt-3 ml-7 p-4 bg-blue-50 border border-blue-200 rounded-brand-sm space-y-3">
              <p className="text-xs text-blue-800 font-semibold">⚠️ O e-mail informado acima será usado como login.</p>
              <div>
                <label className="block text-xs font-bold mb-1.5">Senha do Portal *</label>
                <input name="password" type="password" required={createAccount} placeholder="Mínimo 8 caracteres"
                  className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <p className="text-[0.65rem] text-blue-700">💡 Informe ao paciente para trocar a senha após o primeiro acesso.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="btn-brand-primary disabled:opacity-50">
            {loading ? "Salvando…" : "Cadastrar Paciente 🌿"}
          </button>
          <Link href="/admin/pacientes" className="btn-brand-outline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
