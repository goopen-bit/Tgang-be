import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Pool } from './schemas/pool.schema';
import { EProduct } from '../market/market.const';

@Injectable()
export class PoolService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(Pool.name)
    private poolModel: Model<Pool>,
    @InjectConnection() private readonly connection: Connection,

    private userService: UserService,
  ) {}

  getPools() {
    return this.poolModel.find();
  }

  getOne(id: string) {
    return this.poolModel.findOne({ id });
  }

  async findOne(id: string) {
    const pool = await this.getOne(id);
    if (!pool) {
      throw new HttpException('Pool not found', HttpStatus.NOT_FOUND);
    }
    return pool;
  }

  async swap(
    userId: number,
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    minAmountOut: number,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction({
      readPreference: 'primary',
    });

    try {
      const user = await this.userService.findOne(userId, session);
      
      // Determine pool and swap direction
      let poolId: string;
      let isBuyingProduct: boolean;
      let product: EProduct;
      
      if (tokenIn === 'USD' && Object.values(EProduct).includes(tokenOut as EProduct)) {
        // Buying product with USD
        product = tokenOut as EProduct;
        poolId = `USD-${product.toUpperCase()}`;
        isBuyingProduct = true;
      } else if (tokenOut === 'USD' && Object.values(EProduct).includes(tokenIn as EProduct)) {
        // Selling product for USD
        product = tokenIn as EProduct;
        poolId = `USD-${product.toUpperCase()}`;
        isBuyingProduct = false;
      } else {
        throw new HttpException('Invalid token pair', 400);
      }

      const userProduct = user.products.find((p) => p.name === product);
      if (!userProduct) {
        throw new HttpException('Product not unlocked', 400);
      }

      // Check user has sufficient balance
      if (isBuyingProduct) {
        if (user.cashAmount < amountIn) {
          throw new HttpException('Insufficient cash', 400);
        }
      } else {
        if (userProduct.quantity < amountIn) {
          throw new HttpException('Insufficient product', 400);
        }
      }

      const pool = await this.findOne(poolId);
      const feePercent = pool.feePercent ?? 0;
      const amountInWithFee = amountIn * (1 - feePercent / 100);
      
      let reserveIn: number;
      let reserveOut: number;
      let amountOut: number;
      
      if (isBuyingProduct) {
        // USD -> Product
        reserveIn = pool.cash.reserve;
        reserveOut = pool.product.reserve;
        amountOut = ((amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)); // TODO: math.floor
      } else {
        // Product -> USD
        reserveIn = pool.product.reserve;
        reserveOut = pool.cash.reserve;
        amountOut = ((amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)); // TODO: math.floor
      }

      if (amountOut < minAmountOut) {
        throw new HttpException('Slippage exceeded', 400);
      }

      if (amountOut > reserveOut) {
        throw new HttpException('Insufficient liquidity', 400);
      }

      // Update pool reserves
      if (isBuyingProduct) {
        await this.poolModel.findOneAndUpdate({
          id: poolId,
        }, {
          $inc: {
            'cash.reserve': amountIn,
            'product.reserve': -amountOut,
          },
        }, {
          new: true,
          session,
        });
        
        user.cashAmount -= amountIn;
        userProduct.quantity += amountOut;
      } else {
        await this.poolModel.findOneAndUpdate({
          id: poolId,
        }, {
          $inc: {
            'product.reserve': amountIn,
            'cash.reserve': -amountOut,
          },
        }, {
          new: true,
          session,
        });
        
        userProduct.quantity -= amountIn;
        user.cashAmount += amountOut;
      }

      await user.save({ session });
      await session.commitTransaction();
      
      return { 
        success: true, 
        message: 'Swap successful',
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        newPrice: isBuyingProduct 
          ? (reserveIn + amountIn) / (reserveOut - amountOut)
          : (reserveOut - amountOut) / (reserveIn + amountIn)
      };
    } catch (error) {
      await session.abortTransaction();
      throw new HttpException('Swap failed: ' + error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      session.endSession();
    }
  }
}
