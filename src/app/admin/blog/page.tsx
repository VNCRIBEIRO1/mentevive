"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<{ id: string; title: string; status: string; category: string; publishedAt: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-txt">Blog</h1>
          <p className="text-sm text-txt-light mt-1">Gerencie publicações do blog</p>
        </div>
        <Link href="/admin/blog/novo" className="btn-brand-primary text-sm">
          + Novo Post
        </Link>
      </div>

      <div className="bg-white rounded-brand shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-bg">
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Título</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Categoria</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Data</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-txt-muted">
                    Nenhum post publicado. Clique em &quot;+ Novo Post&quot; para começar.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id} className="border-b border-primary/5 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-txt">{p.title}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{p.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold
                        ${p.status === "published" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                        {p.status === "published" ? "Publicado" : "Rascunho"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-txt-light">{p.publishedAt || "—"}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/blog/${p.id}`} className="text-xs text-primary-dark font-bold hover:underline">
                        Editar →
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
