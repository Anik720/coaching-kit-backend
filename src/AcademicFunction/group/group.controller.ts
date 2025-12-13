import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../../shared/filters/auth-exception.filter';
import type { Request } from 'express';

@ApiTags('academic/group')
@ApiBearerAuth('JWT-auth')
@Controller('academic/group')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Create a new group' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Group created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        groupName: 'Science Group',
        description: 'Science stream group',
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        createdAt: '2023-12-06T10:30:00.000Z',
        updatedAt: '2023-12-06T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['groupName must be a string', 'groupName must be at least 2 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Group with this name already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Group with this name already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group',
      },
    },
  })
  create(
    @Body() dto: CreateGroupDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.groupService.create(dto, user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all groups with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by group name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of groups',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            groupName: 'Science Group',
            description: 'Science stream group',
            isActive: true,
            createdBy: {
              _id: '507f1f77bcf86cd799439022',
              email: 'admin@example.com',
              username: 'admin',
              role: 'user_admin'
            },
            updatedBy: null,
            createdAt: '2023-12-06T10:30:00.000Z',
            updatedAt: '2023-12-06T10:30:00.000Z',
          },
          {
            _id: '507f1f77bcf86cd799439012',
            groupName: 'Commerce Group',
            description: 'Commerce stream group',
            isActive: true,
            createdBy: {
              _id: '507f1f77bcf86cd799439023',
              email: 'teacher@example.com',
              username: 'teacher',
              role: 'staff'
            },
            updatedBy: null,
            createdAt: '2023-12-06T10:30:00.000Z',
            updatedAt: '2023-12-06T10:30:00.000Z',
          },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin', 'staff'],
        userRole: null,
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group',
      },
    },
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const query = { page, limit, search, isActive };
    return this.groupService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group details',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        groupName: 'Science Group',
        description: 'Science stream group',
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        updatedBy: null,
        createdAt: '2023-12-06T10:30:00.000Z',
        updatedAt: '2023-12-06T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Group not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin', 'staff'],
        userRole: null,
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Update a group' })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateGroupDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group updated successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        groupName: 'Science Group Updated',
        description: 'Updated science stream group',
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439023',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'staff'
        },
        createdAt: '2023-12-06T10:30:00.000Z',
        updatedAt: '2023-12-06T11:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Group not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['groupName must be a string', 'groupName must be at least 2 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Group with this name already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Group with this name already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011',
      },
    },
  })
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateGroupDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.groupService.update(id, dto, user._id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group' })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Group deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Group not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Group cannot be deleted because it has associated batches',
    schema: {
      example: {
        statusCode: 409,
        message: 'Cannot delete group because it has associated batches',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin'],
        userRole: 'user_admin',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.groupService.remove(id);
  }

  @Get(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get group status and statistics' })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group status and statistics',
    schema: {
      example: {
        group: {
          _id: '507f1f77bcf86cd799439011',
          groupName: 'Science Group',
          isActive: true,
          createdBy: {
            _id: '507f1f77bcf86cd799439022',
            email: 'admin@example.com',
            username: 'admin',
            role: 'user_admin'
          },
          updatedBy: null,
        },
        totalBatches: 5,
        activeBatches: 3,
        totalStudents: 150,
        averageStudentsPerBatch: 30,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Group not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011/status',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011/status',
      },
    },
  })
  async getGroupStatus(@Param('id') id: string) {
    return this.groupService.getGroupStatus(id);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Toggle group active status' })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group active status toggled successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        groupName: 'Science Group',
        isActive: false,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439023',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'staff'
        },
        message: 'Group status updated successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Group not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011/toggle-active',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/group/507f1f77bcf86cd799439011/toggle-active',
      },
    },
  })
  async toggleActive(
    @Param('id') id: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.groupService.toggleActive(id, user._id);
  }

  @Get('my-groups')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get groups created by the current user' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by group name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  async getMyGroups(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    
    const query = {
      search,
      isActive,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };
    
    return this.groupService.findByCreator(user._id, query);
  }
}