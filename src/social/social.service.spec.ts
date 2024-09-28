import { Test, TestingModule } from "@nestjs/testing";
import { SocialService } from "./social.service";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { mockTokenData } from "../../test/utils/user";
import { faker } from "@faker-js/faker";
import { SocialChannel } from "./social.const";
import { User } from "../user/schemas/user.schema";
import { appConfigImports } from "../config/app";
import { UpdateQuery } from "mongoose";

// Remove TelegramService import if it's not used

describe("SocialService", () => {
  let module: TestingModule;
  let service: SocialService;
  let userService: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [...appConfigImports, UserModule],
      providers: [SocialService],
    }).compile();

    service = module.get<SocialService>(SocialService);
    userService = module.get<UserService>(UserService);
    service["telegram"].getChatMember = jest.fn();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  let subscribedUserId = 475680949;
  let unsubscribedUserId = faker.number.int();
  beforeEach(async () => {
    const subscribedUser = mockTokenData({ id: subscribedUserId });
    await userService.findOneOrCreate(subscribedUser, faker.internet.ip());

    const unsubscribedUser = mockTokenData({ id: unsubscribedUserId });
    await userService.findOneOrCreate(unsubscribedUser, faker.internet.ip());

    const updateQuery: UpdateQuery<User> = {
      $push: {
        socials: {
          channel: SocialChannel.TELEGRAM_CHANNEL,
          member: true,
          joined: expect.any(Date),
        },
      },
    };
    await userService.update(subscribedUserId, updateQuery);
  });

  describe("verifyChannelMember", () => {
    it("should successfully verify channel member", async () => {
      (service["telegram"].getChatMember as jest.Mock).mockResolvedValue({
        status: "member",
      });

      const member = await service.verifyChannelMember(subscribedUserId);
      expect(member).toBeDefined();
      expect(member.socials).toBeDefined();
      const social = member.socials.find(
        (s) => s.channel === SocialChannel.TELEGRAM_CHANNEL,
      );
      expect(social).toBeDefined();
      expect(social.member).toBe(true);
    });

    it("should throw error if not a member of the channel", async () => {
      (service["telegram"].getChatMember as jest.Mock).mockResolvedValue({
        status: "none",
      });

      await expect(
        service.verifyChannelMember(unsubscribedUserId),
      ).rejects.toThrow("You are not a member of the Telegram channel");
    });
  });

  // describe('verifyGroupMember', () => { // TODO: Enable when Telegram group is available
  //   it('should successfully verify group member', async () => {
  //     const member = await service.verifyGroupMember(subscribedUserId);
  //     expect(member).toBeDefined();
  //     expect(member.socials).toBeDefined();
  //     const social = member.socials.find((s) => s.channel === SocialChannel.TELEGRAM_GROUP);
  //     expect(social).toBeDefined();
  //     expect(social.member).toBe(true);
  //   });

  //   it('should throw error if not a member of the group', async () => {
  //     await expect(service.verifyGroupMember(unsubscribedUserId)).rejects.toThrow(
  //       "You are not a member of the Telegram group"
  //     );
  //   });
  // });
});
