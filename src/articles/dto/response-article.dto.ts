import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ArticleEntity } from '../entities/article.entity';
import { UserEntity } from 'src/users/entities/user.entity';

export class ResponseArticleDto {
  id: number;
  title: string;
  description: string;
  author: number | UserEntity;
  createdAt: Date;
  updatedAt: Date;

  constructor(ent: ArticleEntity) {
    this.id = ent.id;
    this.title = ent.title;
    this.description = ent.description;
    this.author = ent.author;
    this.createdAt = ent.createdAt;
    this.updatedAt = ent.updatedAt;
  }
}
