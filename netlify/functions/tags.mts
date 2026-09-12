import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { tags } from "../../db/schema.js";

export default async (req: Request, context: Context) => {
  if (req.method === "GET") {
    const allTags = await db.select().from(tags).orderBy(tags.id);
    return Response.json(allTags);
  }

  const user = await getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (req.method === "POST") {
    const { name, color } = await req.json();
    if (!name || !color) {
      return new Response("name and color are required", { status: 400 });
    }

    const existing = await db.select().from(tags).where(eq(tags.name, name));
    if (existing.length > 0) {
      return new Response("Tag already exists", { status: 409 });
    }

    const [inserted] = await db.insert(tags).values({ name, color }).returning();
    return Response.json(inserted, { status: 201 });
  }

  if (req.method === "DELETE") {
    const id = Number(context.params.id);
    if (!id) return new Response("Missing tag id", { status: 400 });
    const [deleted] = await db.delete(tags).where(eq(tags.id, id)).returning();
    if (!deleted) return new Response("Tag not found", { status: 404 });
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: ["/api/tags", "/api/tags/:id"],
};
