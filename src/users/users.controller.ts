import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get list of all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users list retrieved successfully',
    type: [ResponseUserDto]
  })
  @Get()
  async getList() {
    return await this.usersService.getList();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: ResponseUserDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @Get(':id')
  async getById(@Param('id') id: number) {
    return await this.usersService.getById(+id);
  }

  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        username: { type: 'string', example: 'john_doe' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Email already exists or validation error' })
  @ApiBody({ type: CreateUserDto })
  @Post('register')
  async create(@Body() dto: CreateUserDto) {
    return await this.usersService.create(dto);
  }
}
