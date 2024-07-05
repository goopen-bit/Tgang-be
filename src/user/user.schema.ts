import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbCollections } from '../config/types';
import { EProduct } from '../product/product.const';

@Schema({ _id: false })
class CarryingGear {
  @Prop()
  name: string;

  @Prop()
  capacity: number;
}

@Schema({ _id: false })
class Product {
  @Prop()
  name: EProduct;

  @Prop()
  quantity: number;
}

@Schema({
  collection: DbCollections.USERS,
})
export class User extends Document {
  @Prop()
  id: number;

  @Prop()
  username: string;

  @Prop()
  cashAmount: number;

  @Prop({ type: [Product] })
  products: [Product];

  @Prop({ type: [CarryingGear] })
  carryingGear: [CarryingGear];
}

export const UserSchema = SchemaFactory.createForClass(User);
