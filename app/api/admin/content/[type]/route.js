import { getContentTypeConfig } from "@/lib/admin-content";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const ctx = await getContext(req);
    requireAdmin(ctx);
    const { type } = await params;
    const config = getContentTypeConfig(type);
    const sectionId = new URL(req.url).searchParams.get("sectionId");

    if (!sectionId) return jsonError("sectionId query param is required", 400);

    const items = await prisma[config.prismaModel].findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    });

    return Response.json(items);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

export async function POST(req, { params }) {
  try {
    const ctx = await getContext(req);
    requireAdmin(ctx);
    const { type } = await params;
    const config = getContentTypeConfig(type);
    const body = await parseJson(req, config.createSchema);

    const created = await prisma[config.prismaModel].create({ data: body });

    return Response.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}
