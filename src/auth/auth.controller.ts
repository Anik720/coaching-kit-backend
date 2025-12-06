import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  HttpCode, 
  HttpStatus,
  Get,
  UsePipes,
  ValidationPipe,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true }))
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'staff',
          designation: 'Software Developer',
          createdAt: '2023-12-06T10:30:00.000Z',
          updatedAt: '2023-12-06T10:30:00.000Z'
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid email or password',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password must be at least 6 characters'],
        error: 'Bad Request'
      }
    }
  })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Registration successful',
    schema: {
      example: {
        user: {
          _id: '507f1f77bcf86cd799439012',
          email: 'newuser@example.com',
          role: 'staff',
          designation: 'Intern',
          salary: 0,
          joiningDate: '2023-12-06T10:30:00.000Z',
          createdAt: '2023-12-06T10:30:00.000Z',
          updatedAt: '2023-12-06T10:30:00.000Z'
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password must be at least 6 characters'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - Email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict'
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Invalid role assignment',
    schema: {
      example: {
        statusCode: 403,
        message: 'Only staff role can be assigned during registration',
        error: 'Forbidden'
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns user profile',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        role: 'staff',
        designation: 'Software Developer',
        salary: 50000,
        joiningDate: '2023-01-15T00:00:00.000Z',
        adName: 'John Doe',
        username: 'johndoe',
        address: '123 Main St',
        createdAt: '2023-01-15T00:00:00.000Z',
        updatedAt: '2023-12-06T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      },
      required: ['refreshToken']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid refresh token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid refresh token',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Missing refresh token',
    schema: {
      example: {
        statusCode: 400,
        message: 'refreshToken is required',
        error: 'Bad Request'
      }
    }
  })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('refreshToken is required');
    }
    return this.authService.refreshToken(refreshToken);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      },
      required: ['token']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token is valid',
    schema: {
      example: {
        valid: true,
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: 'staff'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token is invalid or expired',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid token',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Missing token',
    schema: {
      example: {
        statusCode: 400,
        message: 'token is required',
        error: 'Bad Request'
      }
    }
  })
  async validateToken(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('token is required');
    }
    const user = await this.authService.validateToken(token);
    return { valid: true, user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logged out successfully'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async logout(@Request() req) {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. This endpoint can be used for token blacklisting
    // if needed in the future.
    return { message: 'Logged out successfully' };
  }
}