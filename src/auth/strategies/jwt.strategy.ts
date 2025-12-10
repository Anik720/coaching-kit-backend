import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TokenPayload } from '../../shared/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: TokenPayload) {
    try {
      console.log('JWT Strategy - Payload received:', payload);
      
      // Fetch user from database to ensure they still exist
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        console.log('JWT Strategy - User not found for ID:', payload.sub);
        throw new UnauthorizedException({
          message: 'User account not found or has been deleted',
          code: 'USER_NOT_FOUND',
        });
      }

      console.log('JWT Strategy - User found:', {
        _id: user.id,
        email: user.email,
        role: user.role
      });

      // Return user with proper _id field
      return {
        _id: user.id, // Make sure this is included
        email: user.email,
        role: user.role,
        // Add other user properties as needed
      };
    } catch (error) {
      // Handle specific errors
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Log unexpected errors for debugging
      console.error('JWT Strategy - Validation error:', error);
      
      throw new UnauthorizedException({
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      });
    }
  }
}