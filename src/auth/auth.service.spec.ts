import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully and return access token', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        username: 'testuser',
      };

      const accessToken = 'jwt_access_token';

      mockUsersService.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.signIn('test@example.com', 'password123');

      expect(mockUsersService.findOne).toHaveBeenCalledWith('test@example.com');
      expect(argon2.verify).toHaveBeenCalledWith(
        'hashed_password',
        'password123',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
      });
      expect(result).toEqual({ access_token: accessToken });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        service.signIn('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockUsersService.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn('test@example.com', 'wrong_password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error when argon2.verify throws error', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockUsersService.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockRejectedValue(
        new Error('Verification failed'),
      );

      await expect(
        service.signIn('test@example.com', 'password123'),
      ).rejects.toThrow('Verification failed');
    });

    it('should handle case where user has no username', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
      };

      const accessToken = 'jwt_access_token';

      mockUsersService.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.signIn('test@example.com', 'password123');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: undefined,
      });
      expect(result).toEqual({ access_token: accessToken });
    });
  });
});
