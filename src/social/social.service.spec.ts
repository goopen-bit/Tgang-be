import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoUrl, mongoDb, mixpanelToken } from '../config/env';
import { UserModule } from '../user/user.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { UserService } from '../user/user.service';
import { mockTokenData } from '../../test/utils/user';
import { faker } from '@faker-js/faker';
import { SocialChannel } from './social.const';

describe('SocialService', () => {
  let module: TestingModule;
  let service: SocialService;
  let userService: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
          readPreference: "secondaryPreferred",
        }),
        AnalyticsModule.register({
          mixpanelToken: mixpanelToken,
          isGlobal: true,
        }),
        UserModule,
      ],
      providers: [SocialService],
    }).compile();

    service = module.get<SocialService>(SocialService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  let subscribedUserId = 475680949;
  let unsubscribedUserId = 123;
  beforeEach(async () => {
    const subscribedUser = mockTokenData({ id: subscribedUserId });
    await userService.findOneOrCreate(subscribedUser, faker.internet.ip());

    const unsubscribedUser = mockTokenData({ id: unsubscribedUserId });
    await userService.findOneOrCreate(unsubscribedUser, faker.internet.ip());
  });


  describe('verifyChannelMember', () => {
    it('should successfully verify channel member', async () => {
      const member = await service.verifyChannelMember(subscribedUserId);
      expect(member).toBeDefined();
      expect(member.socials).toBeDefined();
      const social = member.socials.find((s) => s.channel === SocialChannel.TELEGRAM_CHANNEL);
      expect(social).toBeDefined();
      expect(social.member).toBe(true);
    });

    it('should throw error if not a member of the channel', async () => {
      await expect(service.verifyChannelMember(unsubscribedUserId)).rejects.toThrow(
        "You are not a member of the Telegram channel"
      );
    });
  });

  describe.skip('verifyGroupMember', () => { // TODO: Enable when Telegram group is available
    it('should successfully verify group member', async () => {
      const member = await service.verifyGroupMember(subscribedUserId);
      expect(member).toBeDefined();
      expect(member.socials).toBeDefined();
      const social = member.socials.find((s) => s.channel === SocialChannel.TELEGRAM_GROUP);
      expect(social).toBeDefined();
      expect(social.member).toBe(true);
    });

    it('should throw error if not a member of the group', async () => {
      await expect(service.verifyGroupMember(unsubscribedUserId)).rejects.toThrow(
        "You are not a member of the Telegram group"
      );
    });
  });
});
