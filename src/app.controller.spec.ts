import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const appController = app.get<AppController>(AppController);
      const hello = appController.getHello();
      expect(hello.name).toBe(process.env.npm_package_name);
      expect(hello.uptime).toBeDefined();
      expect(hello.version).toBe(process.env.npm_package_version);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
