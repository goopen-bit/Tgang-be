import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, now } from 'mongoose';
import { DbCollections } from '../config/types';

@Schema({
  collection: DbCollections.USERS,
  timestamps: true,
})
export class User extends Document {
  @Prop()
  id: number;

  @Prop()
  username: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
