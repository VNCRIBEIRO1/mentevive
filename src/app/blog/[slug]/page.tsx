import { db } from "@/lib/db";
import { blogPosts, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tenant?: string }>;
}

async function getPublicTenantSlug(searchParams?: Promise<{ tenant?: string }>) {
  const headerList = await headers();
  const headerTenantSlug = headerList.get("x-tenant-slug");
  if (headerTenantSlug) return headerTenantSlug;

  const resolvedSearchParams = await searchParams;
  return resolvedSearchParams?.tenant || null;
}

async function getPublishedPostForTenant(slug: string, tenantSlug: string) {
  const [found] = await db
    .select({ post: blogPosts })
    .from(blogPosts)
    .innerJoin(tenants, eq(blogPosts.tenantId, tenants.id))
    .where(and(eq(blogPosts.slug, slug), eq(tenants.slug, tenantSlug)));

  if (!found?.post || found.post.status !== "published") {
    return null;
  }

  return found.post;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXTAUTH_URL || "";
  const tenantSlug = await getPublicTenantSlug(searchParams);

  if (!tenantSlug) {
    return { title: "Post não encontrado" };
  }

  try {
    const post = await getPublishedPostForTenant(slug, tenantSlug);
    if (!post) return { title: "Post não encontrado" };

    const title = `${post.title} - Blog`;
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
        siteName: "MenteVive",
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
    return { title: "Blog" };
  }
}

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const tenantSlug = await getPublicTenantSlug(searchParams);

  if (!tenantSlug) notFound();

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
    post = await getPublishedPostForTenant(slug, tenantSlug);
  } catch {
    // DB not connected
  }

  if (!post) notFound();

  const baseUrl = process.env.NEXTAUTH_URL || "";
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
      name: "MenteVive",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "MenteVive",
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
          <Link href="/" className="font-heading text-xl font-bold text-primary-dark">MenteVive</Link>
          <Link href="/blog" className="text-sm text-primary-dark font-bold hover:underline">Voltar ao blog</Link>
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
            <Link href="/blog" className="btn-brand-outline text-sm">Mais artigos</Link>
            <Link href="/#agendamento" className="btn-brand-primary text-sm">Agendar sessão</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
