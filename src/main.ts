import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MongoErrorFilter } from "./common/filters/mongo.filter";
import { apiPort, logLevel } from "./config/env";

export function useGlobal(app: INestApplication) {
  app.useGlobalFilters(new MongoErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  return app;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: logLevel,
  });
  app.enableShutdownHooks();
  useGlobal(app);
  app.enableCors();

  await app.listen(apiPort);
}
bootstrap();
