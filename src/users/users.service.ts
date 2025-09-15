import {
  BadRequestException,
  Injectable,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ResponseUserDto } from './dto/response-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getList() {
    const users: UserEntity[] = await this.userRepo.find();

    return users.map((item) => new ResponseUserDto(item));
  }

  async findOne(email: string) {
    const user = await this.userRepo.findOne({
      where: {
        email,
      },
    });

    return user;
  }

  async getById(id: number) {
    const user: UserEntity | null = await this.userRepo.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return new ResponseUserDto(user);
  }

  @UsePipes(new ValidationPipe())
  async create(dto: CreateUserDto) {
    const existUser = await this.findOne(dto.email);

    if (existUser) {
      throw new BadRequestException('This email already exits.');
    }

    const savedUser = await this.userRepo.save({
      email: dto.email,
      username: dto.username,
      password: await argon2.hash(dto.password)
    })

    return savedUser;
  }
}
