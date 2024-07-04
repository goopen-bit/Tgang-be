import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { AuthTokenData } from '../config/types';
import { EProduct } from 'src/product/product.const';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async findOneOrCreate(user: AuthTokenData) {
    const existingUser = await this.userModel.findOne({ id: user.id });
    if (existingUser) {
      return existingUser;
    }
    return this.userModel.create({
      ...user,
      cashAmount: 100,
      products: Object.values(EProduct).map((product) => ({
        name: product,
        quantity: 0,
      })),
    });
  }

  async findOne(id: number) {
    return this.userModel.findOne({ id });
  }
}
