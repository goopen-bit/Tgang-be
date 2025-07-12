import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { PoolService } from './pool.service';
import { UserModule } from '../user/user.module';
import { Pool, PoolSchema } from './schemas/pool.schema';
import { UserService } from '../user/user.service';
import { appConfigImports } from '../config/app';
import { EProduct } from '../config/types';
import { AuthTokenData } from '../config/types';
import { mockTokenData } from '../../test/utils/user';
import { faker } from "@faker-js/faker";

describe('PoolService', () => {
  let module: TestingModule;
  let service: PoolService;
  let userService: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ...appConfigImports,
        MongooseModule.forFeature([{ name: Pool.name, schema: PoolSchema }]),
        UserModule,
      ],
      providers: [
        PoolService,
      ],
    }).compile();

    service = module.get<PoolService>(PoolService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('swap', () => {
    let user: AuthTokenData;
    let createdUser: any;
    
    beforeEach(async () => {
      user = mockTokenData();
      createdUser = await userService.findOneOrCreate(user, faker.internet.ip());
      
      // Get the actual user document from database
      const userDoc = await userService.findOne(user.id);
      
      // Give user some cash and add POWDER product for testing
      userDoc.cashAmount = 1000;
      
      // Update existing HERB quantity or add it
      const herbProduct = userDoc.products.find(p => p.name === EProduct.HERB);
      if (herbProduct) {
        herbProduct.quantity = 100;
      } else {
        userDoc.products.push({
          name: EProduct.HERB,
          quantity: 100,
          level: 1,
          title: 'Herb',
          image: '/assets/product/herb.webp'
        });
      }
      
      // Add POWDER product for testing
      const powderProduct = userDoc.products.find(p => p.name === EProduct.POWDER);
      if (!powderProduct) {
        userDoc.products.push({
          name: EProduct.POWDER,
          quantity: 10,
          level: 1,
          title: 'Powder',
          image: '/assets/product/powder.webp'
        });
      }
      
      await userDoc.save();
      createdUser = userDoc;
    });

    describe('buying product with USD', () => {
      it('should swap USD to HERB successfully', async () => {
        const result = await service.swap(user.id, 'USD', EProduct.HERB, 20, 0.01);
        
        expect(result.swap.success).toBe(true);
        expect(result.swap.tokenIn).toBe('USD');
        expect(result.swap.tokenOut).toBe(EProduct.HERB);
        expect(result.swap.amountIn).toBe(20);
        expect(result.swap.amountOut).toBeGreaterThan(0);
        expect(result.swap.newPrice).toBeGreaterThan(0);
      });

      it('should swap USD to POWDER successfully', async () => {
        const result = await service.swap(user.id, 'USD', EProduct.POWDER, 100, 0.01);
        
        expect(result.swap.success).toBe(true);
        expect(result.swap.tokenIn).toBe('USD');
        expect(result.swap.tokenOut).toBe(EProduct.POWDER);
        expect(result.swap.amountIn).toBe(100);
        expect(result.swap.amountOut).toBeGreaterThan(0);
        expect(result.swap.newPrice).toBeGreaterThan(0);
      });

      it('should fail when user has insufficient cash', async () => {
        await expect(
          service.swap(user.id, 'USD', EProduct.HERB, 2000, 1)
        ).rejects.toThrow('Insufficient cash');
      });

      it('should fail when slippage exceeds limit', async () => {
        await expect(
          service.swap(user.id, 'USD', EProduct.HERB, 20, 1000)
        ).rejects.toThrow('Slippage exceeded');
      });
    });

    describe('selling product for USD', () => {
      it('should swap HERB to USD successfully', async () => {
        const result = await service.swap(user.id, EProduct.HERB, 'USD', 10, 1);
        
        expect(result.swap.success).toBe(true);
        expect(result.swap.tokenIn).toBe(EProduct.HERB);
        expect(result.swap.tokenOut).toBe('USD');
        expect(result.swap.amountIn).toBe(10);
        expect(result.swap.amountOut).toBeGreaterThan(0);
        expect(result.swap.newPrice).toBeGreaterThan(0);
      });

      it('should swap POWDER to USD successfully', async () => {
        const result = await service.swap(user.id, EProduct.POWDER, 'USD', 1, 1);
        
        expect(result.swap.success).toBe(true);
        expect(result.swap.tokenIn).toBe(EProduct.POWDER);
        expect(result.swap.tokenOut).toBe('USD');
        expect(result.swap.amountIn).toBe(1);
        expect(result.swap.amountOut).toBeGreaterThan(0);
        expect(result.swap.newPrice).toBeGreaterThan(0);
      });

      it('should fail when user has insufficient product', async () => {
        await expect(
          service.swap(user.id, EProduct.HERB, 'USD', 200, 1)
        ).rejects.toThrow('Insufficient product');
      });

      it('should fail when slippage exceeds limit', async () => {
        await expect(
          service.swap(user.id, EProduct.HERB, 'USD', 10, 1000)
        ).rejects.toThrow('Slippage exceeded');
      });
    });

    describe('error handling', () => {
      it('should fail with invalid token pair', async () => {
        await expect(
          service.swap(user.id, 'INVALID', EProduct.HERB, 20, 1)
        ).rejects.toThrow('Invalid token pair');
      });

      it('should fail when product is not unlocked', async () => {
        // Remove HERB from user's products
        createdUser.products = createdUser.products.filter(p => p.name !== EProduct.HERB);
        await createdUser.save();
        
        await expect(
          service.swap(user.id, 'USD', EProduct.HERB, 20, 1)
        ).rejects.toThrow('Product not unlocked');
      });
    });

    describe('price impact', () => {
      it('should increase price when buying product', async () => {
        const poolBefore = await service.getOne('USD-HERB');
        const priceBefore = poolBefore.cash.reserve / poolBefore.product.reserve;
        
        const result = await service.swap(user.id, 'USD', EProduct.HERB, 100, 1);
        
        expect(result.swap.newPrice).toBeGreaterThan(priceBefore);
      });

      it('should decrease price when selling product', async () => {
        const poolBefore = await service.getOne('USD-HERB');
        const priceBefore = poolBefore.cash.reserve / poolBefore.product.reserve;
        
        const result = await service.swap(user.id, EProduct.HERB, 'USD', 10, 1);
        
        expect(result.swap.newPrice).toBeLessThan(priceBefore);
      });
    });

    describe('atomic transactions', () => {
      it('should rollback on user save failure', async () => {
        const poolBefore = await service.getOne('USD-HERB');
        
        // Get the actual user document that swap will use and mock its save method
        const userDoc = await userService.findOne(user.id);
        jest.spyOn(userDoc, 'save').mockRejectedValueOnce(new Error('Save failed'));
        
        // Mock userService.findOne to always return our mocked userDoc
        jest.spyOn(userService, 'findOne').mockResolvedValue(userDoc);

        await expect(
          service.swap(user.id, 'USD', EProduct.HERB, 20, 0)
        ).rejects.toThrow('Save failed');
        
        // Verify pool state unchanged
        const poolAfter = await service.getOne('USD-HERB');
        expect(poolAfter.cash.reserve).toBe(poolBefore.cash.reserve);
        expect(poolAfter.product.reserve).toBe(poolBefore.product.reserve);
      });

      it('should rollback on pool update failure', async () => {
        const userBefore = await userService.findOne(user.id);
        
        // Mock pool update to fail
        jest.spyOn(service['poolModel'], 'findOneAndUpdate').mockRejectedValueOnce(new Error('Pool update failed'));
        
        await expect(
          service.swap(user.id, 'USD', EProduct.HERB, 20, 1)
        ).rejects.toThrow('Pool update failed');
        
        // Verify user state unchanged
        const userAfter = await userService.findOne(user.id);
        expect(userAfter.cashAmount).toBe(userBefore.cashAmount);
        expect(userAfter.products.find(p => p.name === EProduct.HERB).quantity)
          .toBe(userBefore.products.find(p => p.name === EProduct.HERB).quantity);
      });
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
