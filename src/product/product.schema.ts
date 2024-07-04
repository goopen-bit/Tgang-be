import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbCollections } from '../config/types';
import { IProduct } from './product.interface';

@Schema({
  collection: DbCollections.PRODUCTS,
})
export class Product extends Document implements IProduct {
  @Prop()
  name: string;

  @Prop()
  quantity: number;

  @Prop()
  weight: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
