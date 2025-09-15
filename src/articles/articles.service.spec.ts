import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { ArticleEntity } from './entities/article.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { ResponseArticleDto } from './dto/response-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { NotFoundException, InternalServerErrorException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepo: Repository<ArticleEntity>;
  let userRepo: Repository<UserEntity>;

  const mockArticleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(ArticleEntity),
          useValue: mockArticleRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    articleRepo = module.get<Repository<ArticleEntity>>(getRepositoryToken(ArticleEntity));
    userRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article successfully', async () => {
      const user = { id: 1, email: 'test@example.com' } as UserEntity;
      const createArticleDto: CreateArticleDto = {
        title: 'Test Article',
        description: 'Test Description',
      };

      const savedArticle = {
        id: 1,
        title: 'Test Article',
        description: 'Test Description',
        author: user,
        save: jest.fn().mockResolvedValue({
          id: 1,
          title: 'Test Article',
          description: 'Test Description',
          author: user,
        }),
      } as unknown as ArticleEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(ArticleEntity.prototype, 'save').mockResolvedValue(savedArticle);

      const result = await service.create(1, createArticleDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBeInstanceOf(ResponseArticleDto);
      expect(result.title).toBe('Test Article');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(1, {} as CreateArticleDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const user = { id: 1 } as UserEntity;
      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(ArticleEntity.prototype, 'save').mockRejectedValue(new Error('DB error'));

      await expect(service.create(1, {} as CreateArticleDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getList', () => {
    it('should return list of articles from database and cache it', async () => {
      const articles = [
        { id: 1, title: 'Article 1', description: 'Desc 1' },
        { id: 2, title: 'Article 2', description: 'Desc 2' },
      ] as ArticleEntity[];
      const total = 2;

      mockCacheManager.get.mockResolvedValue(null);
      mockArticleRepository.findAndCount.mockResolvedValue([articles, total]);

      const result = await service.getList({});

      expect(mockCacheManager.get).toHaveBeenCalledWith('articles_list_{}');
      expect(mockArticleRepository.findAndCount).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'articles_list_{}',
        expect.any(Object),
        5000
      );
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBeInstanceOf(ResponseArticleDto);
      expect(result.meta.total).toBe(2);
    });

    it('should return cached list when available', async () => {
      const cachedResult = {
        data: [{ id: 1, title: 'Cached Article', description: 'Cached Desc' }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 }
      };

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getList({});

      expect(mockCacheManager.get).toHaveBeenCalledWith('articles_list_{}');
      expect(mockArticleRepository.findAndCount).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should generate correct cache key with query parameters', async () => {
      const articles = [] as ArticleEntity[];
      const total = 0;

      mockCacheManager.get.mockResolvedValue(null);
      mockArticleRepository.findAndCount.mockResolvedValue([articles, total]);

      await service.getList({ page: 2, limit: 5, author: '1', title: 'test' });

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'articles_list_{"page":2,"limit":5,"author":"1","title":"test"}'
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockArticleRepository.findAndCount.mockRejectedValue(new Error('DB error'));

      await expect(service.getList({})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getById', () => {
    it('should return article by id from database and cache it', async () => {
      const article = { id: 1, title: 'Test Article', description: 'Test Description' } as ArticleEntity;
      
      mockCacheManager.get.mockResolvedValue(null);
      mockArticleRepository.findOne.mockResolvedValue(article);

      const result = await service.getById(1);

      expect(mockCacheManager.get).toHaveBeenCalledWith('article_1');
      expect(mockArticleRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'article_1',
        expect.any(ResponseArticleDto),
        60000
      );
      expect(result).toBeInstanceOf(ResponseArticleDto);
    });

    it('should return cached article when available', async () => {
      const cachedArticle = { id: 1, title: 'Cached Article', description: 'Cached Description' };
      
      mockCacheManager.get.mockResolvedValue(cachedArticle);

      const result = await service.getById(1);

      expect(mockCacheManager.get).toHaveBeenCalledWith('article_1');
      expect(mockArticleRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(cachedArticle);
    });

    it('should throw NotFoundException when article not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockArticleRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.getById(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateById', () => {
    it('should update article successfully and invalidate cache', async () => {
      const updateArticleDto: UpdateArticleDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      mockArticleRepository.update.mockResolvedValue({ affected: 1 });
      jest.spyOn(service, 'getById').mockResolvedValue({
        id: 1,
        title: 'Updated Title',
        description: 'Updated Description',
        author: { id: 1, email: 'test@example.com' }
      } as ResponseArticleDto);

      await service.updateById(1, 1, updateArticleDto);

      expect(mockArticleRepository.update).toHaveBeenCalledWith(
        { id: 1, author: { id: 1 } },
        { title: 'Updated Title', description: 'Updated Description' }
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('article_1');
    });

    it('should throw NotFoundException when article not found or user is not author', async () => {
      mockArticleRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.updateById(1, 1, {} as UpdateArticleDto)).rejects.toThrow(NotFoundException);
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockArticleRepository.update.mockRejectedValue(new Error('DB error'));

      await expect(service.updateById(1, 1, {} as UpdateArticleDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe('deleteById', () => {
    it('should delete article successfully and invalidate cache', async () => {
      const article = {
        id: 1,
        title: 'Test Article',
        author: { id: 1, email: 'test@example.com' }
      };
      mockArticleRepository.findOne.mockResolvedValue(article);
      mockArticleRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteById(1, 1);

      expect(mockArticleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['author']
      });
      expect(mockArticleRepository.delete).toHaveBeenCalledWith({ id: 1 });
      expect(mockCacheManager.del).toHaveBeenCalledWith('article_1');
      expect(result).toEqual({ message: 'Article deleted successfully' });
    });

    it('should throw NotFoundException when article not found', async () => {
      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteById(1, 1)).rejects.toThrow(NotFoundException);
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const article = {
        id: 1,
        title: 'Test Article',
        author: { id: 2, email: 'other@example.com' }
      };
      mockArticleRepository.findOne.mockResolvedValue(article);

      await expect(service.deleteById(1, 1)).rejects.toThrow(ForbiddenException);
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const article = {
        id: 1,
        title: 'Test Article',
        author: { id: 1, email: 'test@example.com' }
      };
      mockArticleRepository.findOne.mockResolvedValue(article);
      mockArticleRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteById(1, 1)).rejects.toThrow(InternalServerErrorException);
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });
});
