import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { jwtSecret } from '../config/env';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: jwtSecret,
          signOptions: { expiresIn: '1d' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
