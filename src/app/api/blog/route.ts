import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { requireAdmin } from "@/lib/api-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPublicTenantScope } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // Check if user is admin — if not, force published-only
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "therapist";

    // Resolve tenant: admin uses session, public uses ?tenant= param
    let tenantId: string | undefined;
    if (isAdmin && session?.user?.activeTenantId) {
      tenantId = session.user.activeTenantId;
    } else {
      const tenantResult = await getPublicTenantScope(req);
      if (tenantResult.error || !tenantResult.tdb) {
        return NextResponse.json({ error: tenantResult.error || "Tenant não encontrado." }, { status: 400 });
      }
      tenantId = tenantResult.tdb.id;
    }

    const conditions = [];
    conditions.push(eq(blogPosts.tenantId, tenantId));
    if (isAdmin && status) {
      conditions.push(eq(blogPosts.status, status as "draft" | "published" | "archived"));
    } else if (!isAdmin) {
      // Public access: only published posts
      conditions.push(eq(blogPosts.status, "published"));
    }
    if (category) conditions.push(ilike(blogPosts.category, category));

    const result = await db
      .select()
      .from(blogPosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(blogPosts.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/blog error:", error);
    return NextResponse.json({ error: "Erro ao buscar posts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const { title, content, excerpt, category, coverImage, status } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios." }, { status: 400 });
    }

    const slug = slugify(title);

    // Check slug uniqueness within tenant
    const existing = await db.select().from(blogPosts).where(and(eq(blogPosts.tenantId, auth.tenantId!), eq(blogPosts.slug, slug)));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Já existe um post com esse título." }, { status: 409 });
    }

    const [newPost] = await db.insert(blogPosts).values({
      title,
      slug,
      content,
      excerpt: excerpt || null,
      category: category || null,
      coverImage: coverImage || null,
      status: status || "draft",
      authorId: auth.session!.user.id,
      publishedAt: status === "published" ? new Date() : null,
      tenantId: auth.tenantId!,
    }).returning();

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("POST /api/blog error:", error);
    return NextResponse.json({ error: "Erro ao criar post." }, { status: 500 });
  }
}
