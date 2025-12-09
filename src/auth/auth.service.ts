import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import {
  IUser,
  LoginResponse,
  TokenPayload,
  CreateUserDto,
  UserRole,
} from '../shared/interfaces/user.interface';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials
   */
/**
 * Validate user credentials
 */
async validateUser(email: string, password: string): Promise<Omit<IUser, 'password'>> {
  try {
    console.log('Validating user:', email);
    
    // Get user document with password
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      console.log('User not found for email:', email);
      throw new UnauthorizedException('Invalid email or password');
    }

    console.log('User found:', user.email);
    
    // Get the password - try multiple approaches
    const userDoc = user as any;
    let hashedPassword = userDoc.password;
    
    if (!hashedPassword && userDoc.toObject) {
      const obj = userDoc.toObject();
      hashedPassword = obj.password;
    }
    
    console.log('Password available?', !!hashedPassword);
    
    if (!hashedPassword) {
      console.error('Password not found in user document');
      console.log('User document keys:', Object.keys(userDoc));
      if (userDoc.toObject) {
        console.log('toObject() keys:', Object.keys(userDoc.toObject()));
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Convert to object and remove password
    const result = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete result.password;

    console.log('User validated successfully');
    return result;
  } catch (error) {
    console.error('Validate user error details:', error);
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new InternalServerErrorException('Authentication failed');
  }
}

  /**
   * Login user
   */
  async login(user: IUser): Promise<LoginResponse> {
    try {
      console.log('Logging in user:', user.email);
      
      // Check for user ID - use either _id or id field
      const userId = this.getUserId(user);
      if (!userId) {
        console.error('User ID missing for login:', user);
        throw new InternalServerErrorException('User id is missing');
      }

      console.log('Creating JWT payload for user ID:', userId);
      
      const payload: TokenPayload = {
        sub: userId.toString(), // convert ObjectId -> string
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);
      console.log('JWT token generated successfully');

      return {
        user,
        accessToken,
      };
    } catch (error) {
      console.error('Login error details:', error);
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(registerDto: any): Promise<LoginResponse> {
    try {
      console.log('Registration attempt:', registerDto.email);

      // Create CreateUserDto from registerDto
      const createUserDto: CreateUserDto = {
        ...registerDto,
        password: registerDto.password,
        role: registerDto.role || UserRole.STAFF,
      };

      console.log('Creating user with DTO:', { ...createUserDto, password: '[HIDDEN]' });

      // Create user - pass undefined as currentUser since this is registration
      const user = await this.usersService.create(createUserDto, undefined);

      console.log('User created successfully:', user.email);

      // Get user ID from the returned user object
      const userId = this.getUserId(user);
      if (!userId) {
        console.error('User created but missing ID:', user);
        throw new InternalServerErrorException('Created user id is missing');
      }

      console.log('Generating token for user ID:', userId);
      
      // Generate token
      const payload: TokenPayload = {
        sub: userId.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      console.log('Registration successful for:', user.email);

      return {
        user,
        accessToken,
      };
    } catch (error) {
      console.error('Registration failed with error:', error);
      console.error('Error stack:', error.stack);
      
      // Re-throw specific errors
      if (error instanceof BadRequestException || 
          error instanceof ConflictException || 
          error instanceof ForbiddenException ||
          error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<IUser> {
    try {
      console.log('Validating JWT token...');
      
      // type the verified payload
      const decoded = this.jwtService.verify<TokenPayload>(token);
      if (!decoded?.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      console.log('Token decoded, user ID:', decoded.sub);
      
      const user = await this.usersService.findOne(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      console.log('Token validated for user:', user.email);
      return user;
    } catch (error) {
      console.error('Token validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Get user from JWT payload
   */
  async getUserFromPayload(payload: TokenPayload): Promise<IUser> {
    try {
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid payload');
      }
      return await this.usersService.findOne(payload.sub);
    } catch (error) {
      console.error('Get user from payload error:', error);
      throw new UnauthorizedException('User not found');
    }
  }

  /**
   * Refresh token (optional implementation)
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      console.log('Refreshing token...');
      
      // decode refresh token
      const decoded = this.jwtService.verify<TokenPayload>(refreshToken);
      if (!decoded?.sub) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      console.log('Refresh token decoded, user ID:', decoded.sub);
      
      const user = await this.usersService.findOne(decoded.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get user ID
      const userId = this.getUserId(user);
      if (!userId) {
        throw new InternalServerErrorException('User id missing');
      }

      const newPayload: TokenPayload = {
        sub: userId.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload);
      console.log('New access token generated');

      return { accessToken };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Helper method to get user ID from user object
   * Handles both _id (Mongoose document) and id (converted object)
   */
private getUserId(user: IUser): string | undefined {
  console.log('AuthService.getUserId - User object:', user);
  console.log('AuthService.getUserId - User keys:', Object.keys(user));
  
  // Check for _id first (could be string or ObjectId)
  if (user._id) {
    console.log('AuthService.getUserId - Found _id:', user._id);
    if (typeof user._id === 'string') {
      return user._id;
    } else if (user._id instanceof Types.ObjectId) {
      return user._id.toString();
    } else if (user._id && typeof user._id === 'object' && 'toString' in user._id) {
      return (user._id as any).toString();
    }
  }
  
  // Check for id field (should already be a string after toIUser conversion)
  if (user.id) {
    console.log('AuthService.getUserId - Found id:', user.id);
    return String(user.id); // Use String() to ensure it's a string
  }
  
  console.log('AuthService.getUserId - No ID found');
  return undefined;
}
}