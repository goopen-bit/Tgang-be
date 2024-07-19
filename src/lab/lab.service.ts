import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { BuyLabDto } from './dto/buy-lab.dto';
import { labs } from './data/labs';
import { EProduct } from '../product/product.const';
import { User } from '../user/schemas/user.schema';
import { getUnixTime } from 'date-fns';

@Injectable()
export class LabService {
  constructor(private userService: UserService) {}

  async buyLabPlot(userId: number) {
    const user = await this.userService.findOne(userId);
    if (user.cashAmount < user.labPlotPrice) {
      throw new HttpException('Not enough money', HttpStatus.BAD_REQUEST);
    }
    user.cashAmount -= user.labPlotPrice;
    user.labPlots.push({ plotId: user.labPlots.length + 1 });
    await user.save();
    return user;
  }

  getLabs() {
    return labs;
  }

  getLab(labProduct: EProduct) {
    return labs[labProduct];
  }

  async buyLab(userId: number, params: BuyLabDto) {
    const user = await this.userService.findOne(userId);
    const labPlot = user.labPlots.find((plot) => plot.plotId === params.plotId);
    if (labPlot.lab) {
      throw new HttpException('Plot is not empty', HttpStatus.BAD_REQUEST);
    }

    const lab = this.getLab(params.labProduct);
    if (user.cashAmount < lab.labPrice) {
      throw new HttpException('Not enough money', HttpStatus.BAD_REQUEST);
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
    return user;
  }

  private getLabPlotForUpgrade(user: User, plotId: number) {
    const labPlot = user.labPlots.find((plot) => plot.plotId === plotId);
    if (!labPlot.lab) {
      throw new HttpException('Plot is empty', HttpStatus.BAD_REQUEST);
    }
    return labPlot;
  }

  async upgradeLabCapacity(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    if (user.cashAmount < labPlot.lab.upgradeCapacityPrice) {
      throw new HttpException('Not enough money', HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= labPlot.lab.upgradeCapacityPrice;
    labPlot.lab.capacityLevel++;
    await user.save();
    return user;
  }

  async upgradeLabProduction(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    if (user.cashAmount < labPlot.lab.upgradeProductionPrice) {
      throw new HttpException('Not enough money', HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= labPlot.lab.upgradeProductionPrice;
    labPlot.lab.productionLevel++;
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
    return user;
  }
}
