import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
  Query,
  HttpStatus,
} from '@nestjs/common';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
  };
}
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
  ApiParam 
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { ResponseArticleDto } from './dto/response-article.dto';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать новую статью' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateArticleDto, description: 'Статья успешно создана' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Неавторизованный доступ' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Пользователь не найден' })
  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateArticleDto) {
    return await this.articlesService.create(req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Получить список статей с пагинацией и фильтрацией' })
  @ApiResponse({ status: HttpStatus.OK, type: [ResponseArticleDto], description: 'Список статей успешно получен' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (по умолчанию: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов на странице (по умолчанию: 10)' })
  @ApiQuery({ name: 'author', required: false, type: String, description: 'Фильтр по ID автора' })
  @ApiQuery({ name: 'publicationDate', required: false, type: String, description: 'Фильтр по дате публикации (формат: YYYY-MM-DD)' })
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Фильтр по названию статьи' })
  @Get()
  async getList(@Query() query: GetArticlesQueryDto) {
    return await this.articlesService.getList(query);
  }

  @ApiOperation({ summary: 'Получить статью по ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ResponseArticleDto, description: 'Статья успешно получена' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Статья не найдена' })
  @ApiParam({ name: 'id', type: Number, description: 'ID статьи' })
  @Get(':id')
  async getById(@Param('id') id: number) {
    return await this.articlesService.getById(+id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить статью' })
  @ApiResponse({ status: HttpStatus.OK, type: ResponseArticleDto, description: 'Статья успешно обновлена' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Неавторизованный доступ' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Статья не найдена или пользователь не является автором' })
  @ApiParam({ name: 'id', type: Number, description: 'ID статьи' })
  @UseGuards(AuthGuard)
  @Put(':id')
  async updateById(@Request() req: AuthenticatedRequest, @Param('id') id: number, @Body() dto: UpdateArticleDto) {
    return await this.articlesService.updateById(req.user.sub, +id, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить статью' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Статья успешно удалена' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Неавторизованный доступ' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Статья не найдена или пользователь не является автором' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Нет прав на удаление этой статьи' })
  @ApiParam({ name: 'id', type: Number, description: 'ID статьи' })
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteById(@Request() req: AuthenticatedRequest, @Param('id') id: number) {
    return await this.articlesService.deleteById(req.user.sub, +id);
  }
}
