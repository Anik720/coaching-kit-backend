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
      // Fetch user from database to ensure they still exist
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException({
          message: 'User account not found or has been deleted',
          code: 'USER_NOT_FOUND',
        });
      }

      // Check if user is active (add this to your user model if needed)
      // if (!user.isActive) {
      //   throw new UnauthorizedException({
      //     message: 'User account is deactivated',
      //     code: 'USER_INACTIVE',
      //   });
      // }

      return {
        _id: user._id,
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
      console.error('JWT validation error:', error);
      
      throw new UnauthorizedException({
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      });
    }
  }
}