import {
  IsEmail,
  MinLength,

} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;
  
  @MinLength(6, { message: 'Password must be equal or more then 6 symbols' } )
  password: string;
}
