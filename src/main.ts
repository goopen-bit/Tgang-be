import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MongoErrorFilter } from "./common/filters/mongo.filter";
import { apiPort, logLevel } from "./config/env";
import { Logger } from "@nestjs/common";

export function useGlobal(app: INestApplication) {
  app.useGlobalFilters(new MongoErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  return app;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "debug", "error", "verbose", "warn"],
  });
  app.enableShutdownHooks();
  useGlobal(app);
  app.enableCors();

  const server = app.getHttpServer();
  const router = server._events.request._router;
  const availableRoutes = router.stack
    .filter((layer) => layer.route)
    .map((layer) => {
      const route = layer.route;
      const method = route.stack[0].method.toUpperCase();
      const path = route.path;
      return { method, path };
    });
  availableRoutes.forEach((route) => {
    Logger.log(`${route.method} ${route.path}`);
  });

  await app.listen(apiPort);
  Logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
