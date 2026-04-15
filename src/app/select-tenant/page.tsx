"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

interface Membership {
  tenantId: string;
  role: string;
  tenantName: string;
  tenantSlug: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador(a)",
  therapist: "Terapeuta",
  patient: "Paciente",
};

export default function SelectTenantPage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const session = await getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/select-tenant");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao carregar consultórios.");
          return;
        }
        setMemberships(data.memberships || []);
      } catch {
        setError("Erro de conexão.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleSelect = async (slug: string) => {
    setSelecting(slug);
    setError("");

    try {
      const res = await fetch("/api/auth/select-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao selecionar consultório.");
        setSelecting(null);
        return;
      }

      const data = await res.json();
      const dest = data.role === "patient" ? "/portal" : "/admin";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Erro de conexão.");
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Selecione o consultório
          </h1>
          <p className="text-gray-500 mt-2">
            Você tem acesso a mais de um consultório. Escolha qual deseja acessar.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {memberships.map((m) => (
            <button
              key={m.tenantId}
              onClick={() => handleSelect(m.tenantSlug)}
              disabled={selecting !== null}
              className="w-full p-4 bg-white rounded-xl shadow-sm border border-gray-200 
                         hover:border-purple-300 hover:shadow-md transition-all text-left
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{m.tenantName}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {ROLE_LABELS[m.role] || m.role}
                  </p>
                </div>
                {selecting === m.tenantSlug ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {memberships.length === 0 && !error && (
          <div className="text-center text-gray-500 py-8">
            Nenhum consultório encontrado. Entre em contato com o administrador.
          </div>
        )}
      </div>
    </div>
  );
}
