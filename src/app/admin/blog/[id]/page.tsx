"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
};

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPost(d))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
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
      const res = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Erro ao salvar post.");
        setSaving(false);
        return;
      }

      const updated = await res.json();
      setPost(updated);
      flash("Post atualizado com sucesso! ✅");
    } catch {
      setError("Erro de conexão.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/blog");
      } else {
        flash("Erro ao excluir post.");
      }
    } catch {
      flash("Erro de conexão.");
    }
    setSaving(false);
  };

  const inputCls =
    "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-txt-muted">Carregando post…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-txt-muted mb-4">Post não encontrado.</p>
        <Link href="/admin/blog" className="text-primary-dark text-sm font-bold hover:underline">
          ← Voltar
        </Link>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-primary/20 text-txt text-sm px-5 py-3 rounded-brand-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <Link href="/admin/blog" className="text-xs text-primary-dark font-bold hover:underline mb-2 inline-block">
          ← Voltar para o blog
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-heading text-2xl font-bold text-txt">Editar Post</h1>
          {post.slug && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="text-xs text-primary-dark font-bold hover:underline"
            >
              Visualizar no site ↗
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-brand p-8 shadow-sm border border-primary/5 max-w-3xl space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold mb-1.5">Título *</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={post.title}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Resumo</label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={post.excerpt ?? ""}
            placeholder="Breve descrição do artigo…"
            className={inputCls + " resize-y"}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Conteúdo *</label>
          <textarea
            name="content"
            rows={12}
            required
            defaultValue={post.content}
            placeholder="Escreva o conteúdo do artigo aqui…"
            className={inputCls + " resize-y"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Categoria</label>
            <select name="category" defaultValue={post.category ?? "mindfulness"} className={inputCls}>
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
            <select name="status" defaultValue={post.status} className={inputCls}>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">URL da Imagem de Capa</label>
          <input
            name="coverImage"
            type="url"
            defaultValue={post.coverImage ?? ""}
            placeholder="https://exemplo.com/imagem.jpg"
            className={inputCls}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-brand-primary disabled:opacity-50">
            {saving ? "Salvando…" : "Salvar Alterações 🌿"}
          </button>
          <Link href="/admin/blog" className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
            Cancelar
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-auto text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-brand-sm hover:bg-red-50 transition-colors"
          >
            Excluir Post
          </button>
        </div>
      </form>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-brand p-8 shadow-lg w-full max-w-sm text-center">
            <h3 className="font-heading text-lg font-semibold text-txt mb-3">Excluir Post?</h3>
            <p className="text-sm text-txt-light mb-6">
              Essa ação não pode ser desfeita. O post &quot;{post.title}&quot; será removido permanentemente.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2.5 bg-red-500 text-white text-sm rounded-brand-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Excluindo…" : "Sim, Excluir"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
