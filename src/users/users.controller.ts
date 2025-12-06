import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request,
  Query,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { UserRole } from '../shared/interfaces/user.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: any, @Request() req) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Request() req) {
    return this.usersService.findAll(req.user);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user._id);
  }

  @Get('role/:role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get users by role' })
  @ApiParam({ name: 'role', enum: UserRole, description: 'User role' })
  @ApiResponse({ status: 200, description: 'Returns users by role' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByRole(@Param('role') role: UserRole, @Request() req) {
    // Validate role parameter
    if (!Object.values(UserRole).includes(role)) {
      throw new Error('Invalid role');
    }
    
    const users = await this.usersService.findByRole(role);
    
    // Filter based on permissions
    if (req.user.role === UserRole.USER_ADMIN) {
      return users.filter(user => 
        user.role === UserRole.STAFF && user.adminId === req.user._id
      );
    }
    
    return users;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const user = await this.usersService.findOne(id);
    
    // Check permissions
    const currentUser = req.user;
    const targetUser = { _id: user._id, role: user.role } as any;
    
    if (currentUser.role === UserRole.STAFF && user._id !== currentUser._id) {
      throw new Error('Not authorized');
    }
    
    if (currentUser.role === UserRole.USER_ADMIN) {
      if (user.role === UserRole.SUPER_ADMIN) {
        throw new Error('Not authorized');
      }
      if (user.role === UserRole.USER_ADMIN && user._id !== currentUser._id) {
        throw new Error('Not authorized');
      }
      if (user.role === UserRole.STAFF && user.adminId !== currentUser._id) {
        throw new Error('Not authorized');
      }
    }
    
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user);
  }

    @Get('staff/my-staff')
    @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)  // Changed: Added SUPER_ADMIN
    @ApiOperation({ summary: 'Get staff created by current admin' })
    @ApiResponse({ status: 200, description: 'Returns staff list' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getMyStaff(@Request() req) {
    return this.usersService.findStaffByAdmin(req.user._id);
    }

  @Get('count/total')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get total user count' })
  @ApiResponse({ status: 200, description: 'Returns user count' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserCount() {
    const count = await this.usersService.count();
    return { count };
  }
}