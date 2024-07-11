import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Product } from "../product/product.schema";
import { CARRYING_CAPACITY } from "./user.const";

@Schema({ _id: false })
class UserUpgrade {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  maxLevel: number;

  @Prop({ required: true })
  levelPrices: number[];

  @Prop({ required: true })
  value: number[];

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  locked: boolean;

  @Prop({ required: true })
  group: string;
}

@Schema({ _id: false })
class CarryingGear {
  @Prop()
  id: number;

  @Prop()
  title: string;

  @Prop()
  capacity: number;
}

@Schema({ _id: false })
export class UserProduct extends Product {
  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, default: false })
  unlocked: boolean;
}

@Schema({
  toObject: {
    getters: true,
  },
  toJSON: {
    getters: true,
  },
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  reputation: number;

  @Prop({ required: true })
  cashAmount: number;

  @Prop({ type: [UserProduct], default: [] })
  products: UserProduct[];

  @Prop({ type: [UserUpgrade], default: [] })
  upgrades: UserUpgrade[];

  @Prop({ type: [CarryingGear] })
  carryingGear: CarryingGear[];

  @Prop({
    virtual: true,
    get: function () {
      let capacity = CARRYING_CAPACITY;
      this.carryingGear.forEach((gear) => {
        capacity += gear.capacity;
      });
      return capacity;
    },
  })
  carryCapacity: number;

  @Prop({
    virtual: true,
    get: function () {
      let amount = 0;
      this.products.forEach((product) => {
        amount += product.quantity;
      });
      return amount;
    },
  })
  carryAmount: number;

  @Prop({
    virtual: true,
    get: function () {
      return Buffer.from(this.id.toString()).toString('base64')
    }
  })
  referralToken: string;

  @Prop()
  referredBy?: string;

  @Prop({ type: [String], default: [] })
  referredUsers: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
