import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserProduct, UserProductSchema } from "./user.schema";
import { AuthTokenData } from "../config/types";
import { EProduct } from "../product/product.const";
import { CARRYING_CAPACITY, STARTING_CASH } from "./user.constants";

@Injectable()
export class UserService {
  private userProductModel;
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>
  ) {
    this.userProductModel = this.userModel.discriminator(
      "UserProduct",
      UserProductSchema
    );
  }

  async findOneOrCreate(user: AuthTokenData) {
    const existingUser = await this.userModel.findOne({ id: user.id });
    if (existingUser) {
      return existingUser;
    }
    return this.userModel.create({
      ...user,
      cashAmount: STARTING_CASH,
      products: [
        this.initUserProduct({
          name: EProduct.WEED,
          quantity: 0,
          unlocked: true,
          selected: true,
          slot: 0,
        }),
      ],
    });
  }

  async findOne(id: number) {
    return this.userModel.findOne({ id });
  }

  initUserProduct(productData: Partial<UserProduct>) {
    const product = new this.userProductModel(productData);
    return product;
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
