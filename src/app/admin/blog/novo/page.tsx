"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      content: form.get("content") as string,
      excerpt: form.get("excerpt") as string,
      category: form.get("category") as string,
      coverImage: form.get("coverImage") as string,
      status: form.get("status") as string,
    };

    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Erro ao criar post.");
        setLoading(false);
        return;
      }

      router.push("/admin/blog");
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="text-xs text-primary-dark font-bold hover:underline mb-2 inline-block">
          ← Voltar para o blog
        </Link>
        <h1 className="font-heading text-2xl font-bold text-txt">Novo Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-brand p-8 shadow-sm border border-primary/5 max-w-3xl space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm">{error}</div>
        )}

        <div>
          <label className="block text-xs font-bold mb-1.5">Título *</label>
          <input name="title" type="text" required placeholder="Título do artigo"
            className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Resumo</label>
          <textarea name="excerpt" rows={2} placeholder="Breve descrição do artigo…"
            className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y" />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Conteúdo *</label>
          <textarea name="content" rows={12} required placeholder="Escreva o conteúdo do artigo aqui…"
            className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Categoria</label>
            <select name="category"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="mindfulness">Mindfulness</option>
              <option value="autoconhecimento">Autoconhecimento</option>
              <option value="autoestima">Autoestima</option>
              <option value="relacionamentos">Relacionamentos</option>
              <option value="infantil">Infantil</option>
              <option value="ansiedade">Ansiedade</option>
              <option value="saude-mental">Saúde Mental</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Status</label>
            <select name="status"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">URL da Imagem de Capa</label>
          <input name="coverImage" type="url" placeholder="https://exemplo.com/imagem.jpg"
            className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-brand-primary disabled:opacity-50">
            {loading ? "Salvando…" : "Publicar Post 🌿"}
          </button>
          <Link href="/admin/blog" className="btn-brand-outline">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
