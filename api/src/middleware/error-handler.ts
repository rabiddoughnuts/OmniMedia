import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const DEFAULT_MESSAGE = "Internal Server Error";

type ErrorWithMeta = Error & {
  code?: string;
  details?: unknown;
};

function buildErrorResponse(statusCode: number, error: ErrorWithMeta) {
  if (statusCode >= 500) {
    return { error: { code: "INTERNAL_ERROR", message: DEFAULT_MESSAGE } };
  }

  return {
    error: {
      code: error.code ?? "REQUEST_ERROR",
      message: error.message,
      details: error.details,
    },
  };
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: ErrorWithMeta & { statusCode?: number }, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode ?? 500;

    request.log.error({ err: error, statusCode }, "request.error");

    reply.status(statusCode).send(buildErrorResponse(statusCode, error));
  });
}
