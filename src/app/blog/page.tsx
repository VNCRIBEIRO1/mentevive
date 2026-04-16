import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog — MenteVive | Reflexões & Bem-estar",
  description:
    "Artigos sobre saúde mental, autoconhecimento, ansiedade, autoestima e bem-estar.",
  alternates: { canonical: `${process.env.NEXTAUTH_URL || ""}/blog` },
  openGraph: {
    type: "website",
    title: "Blog — MenteVive | Reflexões & Bem-estar",
    description:
      "Artigos sobre saúde mental, autoconhecimento, ansiedade e bem-estar.",
    url: `${process.env.NEXTAUTH_URL || ""}/blog`,
    siteName: "MenteVive",
    locale: "pt_BR",
    images: [{ url: "/bia.png", width: 1200, height: 630, alt: "Blog MenteVive" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog MenteVive",
    description: "Artigos sobre saúde mental.",
    images: ["/bia.png"],
  },
};

export default async function BlogPage() {
  let posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    category: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
  }> = [];

  try {
    posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        category: blogPosts.category,
        coverImage: blogPosts.coverImage,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt));
  } catch {
    // DB not connected — show empty state
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-white border-b border-primary/10 py-4 px-4">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold text-primary-dark">
            Ψ MenteVive
          </Link>
          <nav className="flex gap-4 items-center">
            <Link href="/" className="text-sm text-txt-light hover:text-primary-dark transition-colors">Início</Link>
            <Link href="/login" className="text-sm font-bold text-primary-dark">Entrar</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="section-label">Blog</div>
          <h1 className="section-title">Reflexões & Bem-estar</h1>
          <p className="text-sm text-txt-light max-w-[500px] mx-auto">
            Artigos sobre saúde mental, autoconhecimento e bem-estar para sua jornada de transformação.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-txt-muted mb-4">Nenhum artigo publicado ainda.</p>
            <Link href="/" className="btn-brand-outline">← Voltar ao site</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="bg-white rounded-brand overflow-hidden shadow-sm border border-primary/5 hover:shadow-md hover:-translate-y-1 transition-all group">
                {post.coverImage && (
                  <div className="h-48 overflow-hidden">
                    <Image src={post.coverImage} alt={post.title} width={400} height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5">
                  {post.category && (
                    <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary-dark rounded-full text-[0.65rem] font-bold uppercase tracking-wide mb-2">
                      {post.category}
                    </span>
                  )}
                  <h2 className="font-heading text-base font-semibold text-txt mb-2 group-hover:text-primary-dark transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-txt-light line-clamp-3">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-txt-muted mt-3">
                      {new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
