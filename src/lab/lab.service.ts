import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { BuyLabDto } from "./dto/buy-lab.dto";
import { labs } from "./data/labs";
import { EProduct } from "../market/market.const";
import { User } from "../user/schemas/user.schema";
import { Mixpanel } from "mixpanel";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { InjectRedis } from "@goopen/nestjs-ioredis-provider";
import Redis from "ioredis";
import { CraftItemDto } from "./dto/craft-item.dto";
import { ECRAFTABLE_ITEM, CraftableItem, CRAFTABLE_ITEMS } from './craftable_item.const';

@Injectable()
export class LabService {
  constructor(
    private userService: UserService,

    @InjectRedis() private readonly redis: Redis,

    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}

  async buyLabPlot(userId: number) {
    const lockKey = `buyLabPlot:${userId}`;

    const lock = await this.redis.set(lockKey, 'locked', 'EX', 5, 'NX');
    if (!lock) {
      throw new HttpException('Please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    try {
      const user = await this.userService.findOne(userId);
      if (user.cashAmount < user.labPlotPrice) {
        throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
      }

      const newPlotId = user.labPlots.length + 1;
      if (user.labPlots.some(plot => plot.plotId === newPlotId)) {
        throw new HttpException("Plot ID already exists", HttpStatus.CONFLICT);
      }

      user.cashAmount -= user.labPlotPrice;
      user.labPlots.push({ plotId: newPlotId });

      await user.save();
      this.mixpanel.people.increment(user.id.toString(), "lab_plots", 1);
      return user;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  getLabs() {
    return labs;
  }

  getLab(labProduct: EProduct) {
    return labs[labProduct];
  }

  checkLabRequirements(user: User, labProduct: EProduct) {
    const lab = this.getLab(labProduct);
    const userProduct = user.products.find(
      (product) => product.name === labProduct,
    );
    if (!userProduct || userProduct.level < lab.levelRequirement) {
      throw new HttpException(
        "Product level is too low",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async buyLab(userId: number, params: BuyLabDto) {
    const user = await this.userService.findOne(userId);
    this.checkLabRequirements(user, params.labProduct);

    const labPlot = user.labPlots.find((plot) => plot.plotId === params.plotId);
    if (labPlot.lab) {
      throw new HttpException("Plot is not empty", HttpStatus.BAD_REQUEST);
    }

    const lab = this.getLab(params.labProduct);
    if (user.cashAmount < lab.labPrice) {
      throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= lab.labPrice;
    labPlot.lab = {
      product: params.labProduct,
      title: lab.title,
      image: lab.image,
      capacityLevel: 1,
      productionLevel: 1,
      collectTime: new Date(),
    };
    await user.save();

    this.mixpanel.track("Upgrade Bought", {
      distinct_id: user.id,
      type: "Lab",
      value: params.labProduct,
    });
    return user;
  }

  private getLabPlotForUpgrade(user: User, plotId: number) {
    const labPlot = user.labPlots.find((plot) => plot.plotId === plotId);
    if (!labPlot.lab) {
      throw new HttpException("Plot is empty", HttpStatus.BAD_REQUEST);
    }
    return labPlot;
  }

  async upgradeLabCapacity(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    if (user.cashAmount < labPlot.lab.upgradeCapacityPrice) {
      throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= labPlot.lab.upgradeCapacityPrice;
    labPlot.lab.capacityLevel++;
    await user.save();
    this.mixpanel.track("Boost Upgrade", {
      distinct_id: user.id,
      type: "Lab Capacity",
      value: labPlot.lab.product,
      level: labPlot.lab.capacityLevel,
    });
    return user;
  }

  async upgradeLabProduction(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    if (user.cashAmount < labPlot.lab.upgradeProductionPrice) {
      throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= labPlot.lab.upgradeProductionPrice;
    labPlot.lab.productionLevel++;
    this.mixpanel.track("Boost Upgrade", {
      distinct_id: user.id,
      type: "Lab Production",
      value: labPlot.lab.product,
      level: labPlot.lab.productionLevel,
    });
    await user.save();
    return user;
  }

  async collectLabProduction(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    const userProduct = user.products.find(
      (product) => product.name === labPlot.lab.product,
    );
    const production = labPlot.lab.produced;
    userProduct.quantity += production;

    labPlot.lab.collectTime = new Date();
    await user.save();

    this.mixpanel.track("Lab Production Collected", {
      distinct_id: user.id,
      product: labPlot.lab.product,
      plot: plotId,
      production,
    });
    return user;
  }

  async craftItem(userId: number, itemId: ECRAFTABLE_ITEM, quantity: number = 1) {
    const user = await this.userService.findOne(userId);
    const craftableItem = this.getCraftableItem(itemId);

    for (const [product, requiredAmount] of Object.entries(craftableItem.requirements)) {
      const userProduct = user.products.find(p => p.name === product);
      if (!userProduct || userProduct.quantity < requiredAmount * quantity) {
        throw new HttpException(`Not enough ${product}`, HttpStatus.BAD_REQUEST);
      }
    }

    for (const [product, requiredAmount] of Object.entries(craftableItem.requirements)) {
      const userProduct = user.products.find(p => p.name === product);
      userProduct.quantity -= requiredAmount * quantity;
    }

    const existingCraftedItem = user.craftedItems.find(item => item.itemId === itemId);
    if (existingCraftedItem) {
      existingCraftedItem.quantity += quantity;
    } else {
      user.craftedItems.push({ itemId, quantity });
    }
    await user.save();

    this.mixpanel.track("Item Crafted", {
      distinct_id: user.id,
      item: itemId,
      quantity: quantity,
    });

    return user;
  }

  private getCraftableItem(itemId: ECRAFTABLE_ITEM): CraftableItem {
    const craftableItem = CRAFTABLE_ITEMS[itemId];
    if (!craftableItem) {
      throw new HttpException("Invalid craftable item", HttpStatus.BAD_REQUEST);
    }
    return craftableItem;
  }
}
