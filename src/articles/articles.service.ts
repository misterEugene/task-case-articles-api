import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { ArticleEntity } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ResponseArticleDto } from './dto/response-article.dto';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(user_id: number, data: CreateArticleDto) {
    try {
      const user = await this.userRepo.findOne({
        where: {
          id: user_id,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found!');
      }

      const article = new ArticleEntity();
      article.title = data.title;
      article.description = data.description;
      article.author = user;

      const res = await article.save();
      
      // Инвалидация кэша списков статей (полагаемся на короткий TTL для списков)
      // Для надежности можно очистить все кэши списков, но из-за короткого TTL это не критично
      return new ResponseArticleDto(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create article');
    }
  }

  async getList(query: GetArticlesQueryDto) {
    try {
      const cacheKey = `articles_list_${JSON.stringify(query)}`;
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const { page = 1, limit = 10, author, publicationDate, title } = query;
      const skip = (page - 1) * limit;

      const where: Record<string, any> = {};

      if (author) {
        where.author = { id: parseInt(author) };
      }

      if (publicationDate) {
        where.publicationDate = new Date(publicationDate);
      }

      if (title) {
        where.title = title;
      }

      const [articles, total] = await this.articleRepo.findAndCount({
        where,
        skip,
        take: limit,
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });

      const result = {
        data: articles.map((item) => new ResponseArticleDto(item)),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cacheManager.set(cacheKey, result, 5000); // 5 seconds TTL for lists
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch articles');
    }
  }

  async getById(id: number) {
    try {
      const cacheKey = `article_${id}`;
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const article = await this.articleRepo.findOne({
        where: {
          id,
        }
      });

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      const result = new ResponseArticleDto(article);
      await this.cacheManager.set(cacheKey, result, 60000); // 60 seconds TTL for single article
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch article');
    }
  }

  async updateById(user_id: number, id: number, dto: UpdateArticleDto) {
    try {
      const updateResult = await this.articleRepo.update(
        { id, author: { id: user_id } },
        {
          title: dto.title,
          description: dto.description,
        },
      );

      if (updateResult.affected === 0) {
        throw new NotFoundException('Article not found or you are not the author');
      }

      // Invalidate cache for specific article
      await this.cacheManager.del(`article_${id}`);
      
      return await this.getById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update article');
    }
  }

  async deleteById(user_id: number, id: number) {
    try {
      // First check if article exists and belongs to the user
      const article = await this.articleRepo.findOne({
        where: { id },
        relations: ['author'],
      });

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      if (article.author.id !== user_id) {
        throw new ForbiddenException('You can only delete your own articles');
      }

      const deleteResult = await this.articleRepo.delete({
        id,
      });

      if (deleteResult.affected === 0) {
        throw new NotFoundException('Article not found');
      }

      // Invalidate cache for specific article
      await this.cacheManager.del(`article_${id}`);

      return { message: 'Article deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete article');
    }
  }
}
