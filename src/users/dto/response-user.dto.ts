import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { UserEntity } from 'src/users/entities/user.entity';

export class ResponseUserDto {
  id: number;
  email: string;
  username: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(ent: UserEntity) {
    this.id = ent.id;
    this.email = ent.email;
    this.createdAt = ent.createdAt;
    this.updatedAt = ent.updatedAt;
  }
}
