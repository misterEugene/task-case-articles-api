import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  MinLength,

} from 'class-validator';
import { UserEntity } from 'src/users/entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @MinLength(6, { message: 'Password must be equal or more then 6 symbols' } )
  password: string;
}
