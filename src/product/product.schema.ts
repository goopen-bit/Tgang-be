import { Prop, Schema } from "@nestjs/mongoose";
import { EProduct } from "../product/product.const";

@Schema({ _id: false })
export class Product {
  @Prop({ required: true })
  name: EProduct;
}
