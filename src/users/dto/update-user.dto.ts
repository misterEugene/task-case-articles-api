import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';
import { UserEntity } from 'src/users/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @IsOptional()
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  username?: string;

  constructor(ent: UserEntity) {
    this.email = ent.email;
    this.password = ent.password;
  }
}
