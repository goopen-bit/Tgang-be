import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbCollections } from '../config/types';
import { EProduct } from '../product/product.const';

@Schema({ _id: false })
class Product {
  @Prop()
  name: EProduct;

  @Prop()
  price: number;
}

@Schema({
  collection: DbCollections.MARKETS,
})
export class Market extends Document {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop({ type: [Product] })
  products: [Product];
}

export const MarketSchema = SchemaFactory.createForClass(Market);
