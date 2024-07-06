import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Product } from "src/product/product.schema";

@Schema({ _id: false })
class CarryingGear {
  @Prop()
  name: string;

  @Prop()
  capacity: number;
}

@Schema({ _id: false })
export class UserProduct extends Product {
  @Prop({ required: true, default: false })
  unlocked: boolean;

  @Prop({ required: true, default: false })
  selected: boolean;

  @Prop({ required: true, default: 100 })
  maxCarry: number;

  @Prop({ default: null })
  slot: number | null;
}

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  cashAmount: number;

  @Prop({ type: [UserProduct], default: [] })
  products: UserProduct[];

  @Prop({ type: [CarryingGear] })
  carryingGear: CarryingGear[];
}

export const UserProductSchema = SchemaFactory.createForClass(UserProduct);
export const UserSchema = SchemaFactory.createForClass(User);
