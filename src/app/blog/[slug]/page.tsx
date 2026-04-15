import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = "https://psicolobia.vercel.app";
  try {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!post) return { title: "Post não encontrado" };
    const title = `${post.title} — Psicolobia Blog`;
    const description = post.excerpt || post.title;
    const ogImage = post.coverImage || `${baseUrl}/bia.png`;
    return {
      title,
      description,
      alternates: { canonical: `${baseUrl}/blog/${slug}` },
      openGraph: {
        type: "article",
        title,
        description,
        url: `${baseUrl}/blog/${slug}`,
        siteName: "Psicolobia",
        locale: "pt_BR",
        images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
        ...(post.publishedAt && { publishedTime: post.publishedAt.toISOString() }),
        authors: ["Beatriz Ribeiro"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: "Blog — Psicolobia" };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    category: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
  } | null = null;

  try {
    const [found] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    if (found && found.status === "published") post = found;
  } catch {
    // DB not connected
  }

  if (!post) notFound();

  const baseUrl = "https://psicolobia.vercel.app";
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.coverImage || `${baseUrl}/bia.png`,
    url: `${baseUrl}/blog/${slug}`,
    datePublished: post.publishedAt?.toISOString(),
    author: {
      "@type": "Person",
      name: "Beatriz Ribeiro",
      jobTitle: "Psicóloga Clínica",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Psicolobia",
      logo: { "@type": "ImageObject", url: `${baseUrl}/icon.svg` },
    },
  };

  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <header className="bg-white border-b border-primary/10 py-4 px-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold text-primary-dark">Ψ Psicolobia</Link>
          <Link href="/blog" className="text-sm text-primary-dark font-bold hover:underline">← Blog</Link>
        </div>
      </header>

      <article className="max-w-[800px] mx-auto px-4 py-12">
        {post.category && (
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary-dark rounded-full text-xs font-bold uppercase tracking-wide mb-4">
            {post.category}
          </span>
        )}

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-txt leading-tight mb-4">
          {post.title}
        </h1>

        {post.publishedAt && (
          <p className="text-sm text-txt-muted mb-8">
            {new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            {" · "}Beatriz · Psicóloga Clínica
          </p>
        )}

        {post.coverImage && (
          <div className="mb-8 rounded-brand overflow-hidden">
            <Image src={post.coverImage} alt={post.title} width={800} height={400}
              className="w-full h-auto object-cover" />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-txt-light leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="mt-12 pt-8 border-t border-primary/10 text-center">
          <p className="text-sm text-txt-muted mb-4">Gostou desse conteúdo?</p>
          <div className="flex gap-3 justify-center">
            <Link href="/blog" className="btn-brand-outline text-sm">← Mais artigos</Link>
            <Link href="/#agendamento" className="btn-brand-primary text-sm">Agendar Sessão 🌿</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
