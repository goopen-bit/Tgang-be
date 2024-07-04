import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbCollections } from '../config/types';
import { IProduct } from '../product/product.interface';

@Schema({ _id: false })
class Product implements IProduct {
  @Prop()
  name: string;

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
}

export const UserSchema = SchemaFactory.createForClass(User);
