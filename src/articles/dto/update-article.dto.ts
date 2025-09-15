import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ArticleEntity } from '../entities/article.entity';

export class UpdateArticleDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Title cannot be empty if provided' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title must be less than 255 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
