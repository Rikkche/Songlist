import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { songs } from "../../db/schema.js";

export default async (req: Request, context: Context) => {
  if (req.method === "GET") {
    const allSongs = await db.select().from(songs).orderBy(songs.id);
    return Response.json(allSongs);
  }

  const user = await getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      if (!item.title || !item.author) {
        return new Response("title and author are required", { status: 400 });
      }
    }

    const inserted = await db
      .insert(songs)
      .values(
        items.map((item: any) => ({
          title: item.title,
          author: item.author,
          langs: item.langs?.length ? item.langs : ["中文"],
          notes: item.notes ?? [],
          tags: item.tags ?? [],
        })),
      )
      .returning();

    return Response.json(Array.isArray(body) ? inserted : inserted[0], { status: 201 });
  }

  const id = Number(context.params.id);

  if (req.method === "PUT") {
    if (!id) return new Response("Missing song id", { status: 400 });
    const item = await req.json();
    if (!item.title || !item.author) {
      return new Response("title and author are required", { status: 400 });
    }

    const [updated] = await db
      .update(songs)
      .set({
        title: item.title,
        author: item.author,
        langs: item.langs?.length ? item.langs : ["中文"],
        notes: item.notes ?? [],
        tags: item.tags ?? [],
      })
      .where(eq(songs.id, id))
      .returning();

    if (!updated) return new Response("Song not found", { status: 404 });
    return Response.json(updated);
  }

  if (req.method === "DELETE") {
    if (!id) return new Response("Missing song id", { status: 400 });
    const [deleted] = await db.delete(songs).where(eq(songs.id, id)).returning();
    if (!deleted) return new Response("Song not found", { status: 404 });
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: ["/api/songs", "/api/songs/:id"],
};
