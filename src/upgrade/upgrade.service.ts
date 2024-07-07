import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Upgrade } from "./upgrade.schema";
import { HttpException, Injectable } from "@nestjs/common";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { UserService } from "../user/user.service";

@Injectable()
export class UpgradeService {
  constructor(
    @InjectModel(Upgrade.name)
    private upgradeModel: Model<Upgrade>,
    private userService: UserService
  ) {}

  async buyUpgrade(userId: number, params: BuyUpgradeDto) {
    const { id } = params;
    const user = await this.userService.findOne(userId);
    const upgrade = await this.findOne(id);
    if (!user || !upgrade) {
      throw new HttpException("User or Upgrade not found", 404);
    }

    if (upgrade && upgrade.locked) {
      throw new HttpException("Upgrade not unlocked", 400);
    }

    let userUpgrade = user.upgrades.find((u) => u.id === id);
    let upgradePrice: number;

    if (!userUpgrade) {
      // If the user doesn't have this upgrade yet, initialize it
      upgradePrice = upgrade.levelPrices[0];
      if (user.cashAmount < upgradePrice) {
        throw new HttpException("Not enough cash", 400);
      }
      user.upgrades.push(upgrade);
    } else {
      // If the user already has this upgrade, get the price for the next level
      if (userUpgrade.level + 1 >= userUpgrade.maxLevel) {
        throw new HttpException("Upgrade already at max level", 400);
      }
      upgradePrice = upgrade.levelPrices[userUpgrade.level + 1];
      if (user.cashAmount < upgradePrice) {
        throw new HttpException("Not enough cash", 400);
      }

      userUpgrade.level += 1;
    }

    user.cashAmount -= upgradePrice;

    await user.save();
    return user;
  }

  async create(createUpgradeDto: any): Promise<Upgrade> {
    const createdUpgrade = new this.upgradeModel(createUpgradeDto);
    return createdUpgrade.save();
  }

  async findAll(): Promise<Upgrade[]> {
    return this.upgradeModel.find().exec();
  }

  async findOne(id: number): Promise<Upgrade> {
    return this.upgradeModel.findOne({ id }).exec();
  }

  async update(id: number, updateUpgradeDto: any): Promise<Upgrade> {
    return this.upgradeModel
      .findOneAndUpdate({ id }, updateUpgradeDto, { new: true })
      .exec();
  }

  async delete(id: number): Promise<any> {
    return this.upgradeModel.deleteOne({ id }).exec();
  }
}
