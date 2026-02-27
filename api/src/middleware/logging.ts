import type { FastifyInstance, FastifyRequest } from "fastify";

export function registerRequestLogging(app: FastifyInstance) {
  app.addHook("onRequest", async (request: FastifyRequest) => {
    request.log.info({ method: request.method, url: request.url }, "request.start");
  });

  app.addHook("onResponse", async (request: FastifyRequest) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: request.raw.statusCode,
    }, "request.end");
  });
}
