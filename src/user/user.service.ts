import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./user.schema";
import { AuthTokenData } from "../config/types";
import { EProduct } from "../product/product.const";
import { CARRYING_CAPACITY, STARTING_CASH } from "./user.constants";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>
  ) {}

  async findOneOrCreate(user: AuthTokenData) {
    const existingUser = await this.userModel.findOne({ id: user.id });
    if (existingUser) {
      return existingUser;
    }
    return this.userModel.create({
      ...user,
      cashAmount: STARTING_CASH,
      products: [
        {
          name: EProduct.WEED,
          quantity: 0,
          unlocked: true,
          selected: true,
          maxCarry: 100,
          slot: null,
        },
      ],
    });
  }

  async findOne(id: number) {
    return this.userModel.findOne({ id });
  }

  getCarryAmountAndCapacity(user: User) {
    let carryAmount = 0;
    let carryCapacity = CARRYING_CAPACITY;
    user.products.forEach((product) => {
      carryAmount += product.quantity;
    });
    user.carryingGear.forEach((gear) => {
      carryCapacity += gear.capacity;
    });
    return {
      carryAmount,
      carryCapacity,
    };
  }
}
