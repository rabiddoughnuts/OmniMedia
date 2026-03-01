import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { addToUserList, fetchUserList, removeFromUserList } from "../services/list-service.js";
import { parseListStatusBody } from "../validation/list.js";

interface AddToListBody {
  mediaId: string;
  status: "planned" | "in-progress" | "completed" | "dropped";
  rating?: number;
  notes?: string;
}

type ListQuery = {
  page?: string;
  pageSize?: string;
  order?: "updated" | "created";
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function parsePage(value?: string): number {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

function parsePageSize(value?: string): number {
  const parsed = Number(value ?? DEFAULT_PAGE_SIZE);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
}

function resolveOrder(order?: "updated" | "created"): "um.updated_at" | "um.created_at" {
  if (order === "created") {
    return "um.created_at";
  }
  return "um.updated_at";
}

export async function listRoutes(
  app: FastifyInstance
) {
  // All list routes require authentication
  app.addHook("onRequest", requireAuth);

  // Get user's list
  app.get<{ Querystring: ListQuery }>("/", async (request) => {
    const userId = request.session.userId!;
    const page = parsePage(request.query.page);
    const pageSize = parsePageSize(request.query.pageSize);
    const offset = (page - 1) * pageSize;
    const orderColumn = resolveOrder(request.query.order);

    const { items, total } = await fetchUserList(
      userId,
      pageSize,
      offset,
      orderColumn
    );

    return {
      items,
      page,
      pageSize,
      total,
    };
  });

  // Add to list
  app.post<{ Body: AddToListBody }>("/", async (request, reply) => {
    const userId = request.session.userId!;
    const { mediaId, status, rating, notes } = parseListStatusBody(request.body);

    const { entry, mediaMissing } = await addToUserList(userId, {
      mediaId,
      status,
      rating,
      notes,
    });

    if (mediaMissing) {
      reply.code(404);
      return { error: "Media not found" };
    }

    return { entry };
  });

  // Remove from list
  app.delete<{ Params: { mediaId: string } }>("/:mediaId", async (request, reply) => {
    const userId = request.session.userId!;
    const rowCount = await removeFromUserList(
      userId,
      request.params.mediaId
    );

    if (rowCount === 0) {
      reply.code(404);
      return { error: "Entry not found" };
    }

    return { success: true };
  });
}