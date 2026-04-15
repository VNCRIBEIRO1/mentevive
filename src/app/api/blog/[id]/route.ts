import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { requireAdmin } from "@/lib/api-auth";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) {
      return NextResponse.json({ error: "Post n\u00e3o encontrado." }, { status: 404 });
    }

    // If post is not published, require admin access
    if (post.status !== "published") {
      const session = await getServerSession(authOptions);
      const isAdmin = session?.user?.role === "admin" || session?.user?.role === "therapist";
      if (!isAdmin) {
        return NextResponse.json({ error: "Post n\u00e3o encontrado." }, { status: 404 });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("GET /api/blog/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar post." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { title, content, excerpt, category, coverImage, status } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) {
      const newSlug = slugify(title);
      // Check slug uniqueness excluding the current post
      const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts)
        .where(and(eq(blogPosts.slug, newSlug), ne(blogPosts.id, id)));
      if (existing) {
        return NextResponse.json({ error: "Já existe um post com esse título/slug." }, { status: 409 });
      }
      updateData.title = title;
      updateData.slug = newSlug;
    }
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (category !== undefined) updateData.category = category;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "published") updateData.publishedAt = new Date();
    }

    const [updated] = await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id)).returning();
    if (!updated) {
      return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/blog/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar post." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const [deleted] = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ message: "Post removido." });
  } catch (error) {
    console.error("DELETE /api/blog/[id] error:", error);
    return NextResponse.json({ error: "Erro ao remover post." }, { status: 500 });
  }
}
