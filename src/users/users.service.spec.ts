import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { ResponseUserDto } from './dto/response-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Repository<UserEntity>;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getList', () => {
    it('should return list of users as ResponseUserDto', async () => {
      const users = [
        { id: 1, email: 'user1@example.com', password: 'hash1' },
        { id: 2, email: 'user2@example.com', password: 'hash2' },
      ] as UserEntity[];

      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.getList();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ResponseUserDto);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[0]).not.toHaveProperty('password');
    });

    it('should return empty array when no users found', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.getList();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should find user by email', async () => {
      const user = { id: 1, email: 'test@example.com', password: 'hash' } as UserEntity;
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return user by id as ResponseUserDto', async () => {
      const user = { id: 1, email: 'test@example.com', password: 'hash' } as UserEntity;
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.getById(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBeInstanceOf(ResponseUserDto);
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(1)).rejects.toThrow(BadRequestException);
      await expect(service.getById(1)).rejects.toThrow('User not found');
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashed_password_123';
      const savedUser = {
        id: 1,
        email: 'newuser@example.com',
        password: hashedPassword,
      } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: hashedPassword,
      });
      expect(result).toEqual(savedUser);
    });

    it('should throw BadRequestException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const existingUser = { id: 1, email: 'existing@example.com' } as UserEntity;
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createUserDto)).rejects.toThrow('This email already exits.');
    });

  });
});
