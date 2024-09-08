import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MultiplayerService } from './multiplayer.service';
import { UserService } from '../user/user.service';
import { User, UserSchema } from '../user/schemas/user.schema';
import { createMockUser } from '../user/user.service.spec';
import { Model } from 'mongoose';
import { mongoUrl, mongoDb } from '../config/env';
import { AnalyticsModule } from '../analytics/analytics.module';
import { mixpanelToken } from '../config/env';

describe('MultiplayerService', () => {
  let service: MultiplayerService;
  let userService: UserService;
  let userModel: Model<User>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AnalyticsModule.register({
          mixpanelToken: mixpanelToken,
          isGlobal: true,
        }),
      ],
      providers: [MultiplayerService, UserService],
    }).compile();

    service = module.get<MultiplayerService>(MultiplayerService);
    userService = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchPlayer', () => {
    it('should return a list of 2 PvP-enabled players sorted by total value', async () => {
      const currentUserId = 123;
      
      // Create and insert users
      const users = [
        createMockUser({ id: currentUserId, username: 'current', cashAmount: 500, pvp: { pvpEnabled: true } }),
        createMockUser({ id: 456, username: 'player1', cashAmount: 1000, pvp: { pvpEnabled: true } }),
        createMockUser({ id: 789, username: 'player2', cashAmount: 2000, pvp: { pvpEnabled: true } }),
        createMockUser({ id: 101, username: 'player3', cashAmount: 3000, pvp: { pvpEnabled: false } }),
        createMockUser({ id: 102, username: 'player4', cashAmount: 1500, pvp: { pvpEnabled: true, todayDefendNbr: 1 } }),
      ];

      for (const user of users) {
        await userModel.create(user);
      }

      const result = await service.searchPlayer(currentUserId.toString());

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(789);
      expect(result[0].cashAmount).toBe(2000);
      expect(result[1].id).toBe(456);
      expect(result[1].cashAmount).toBe(1000);
      expect(result.every(player => player.pvp.pvpEnabled)).toBe(true);
      expect(result.every(player => player.pvp.todayDefendNbr === 0)).toBe(true);
      expect(result.every(player => player.id !== currentUserId)).toBe(true);
    });
  });

  describe('startFight', () => {
    it('should return a message that fight is not implemented yet', async () => {
      const result = await service.startFight('123', '456');
      expect(result).toEqual({ message: 'Fight not implemented yet' });
    });
  });

  describe('enablePvp', () => {
    it('should enable PvP for a user without existing PvP data', async () => {
      const user = await userModel.create(createMockUser({ id: 123, pvp: undefined }));
      const result = await service.enablePvp('123');
      expect(result.message).toBe('PvP enabled successfully');
      expect(result.pvp.pvpEnabled).toBe(true);
      const updatedUser = await userModel.findOne({ id: 123 });
      expect(updatedUser.pvp.pvpEnabled).toBe(true);
    });

    it('should enable PvP for a user with existing PvP data', async () => {
      const user = await userModel.create(createMockUser({ id: 123, pvp: { pvpEnabled: false } }));
      const result = await service.enablePvp('123');
      expect(result.message).toBe('PvP enabled successfully');
      expect(result.pvp.pvpEnabled).toBe(true);
      const updatedUser = await userModel.findOne({ id: 123 });
      expect(updatedUser.pvp.pvpEnabled).toBe(true);
    });
  });
});