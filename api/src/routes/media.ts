import type { FastifyInstance, FastifyPluginOptions } from "fastify";

const mediaItems = [
  { id: "bk-001", title: "The Memory Library", type: "book" },
  { id: "an-001", title: "Skyward Signals", type: "anime" },
  { id: "gm-001", title: "Echoes of Orion", type: "game" },
];

export async function mediaRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => {
    return { items: mediaItems };
  });

  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const item = mediaItems.find((entry) => entry.id === request.params.id);
    if (!item) {
      reply.code(404);
      return { message: "Not found" };
    }
    return item;
  });
}
