import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom authentication logic here
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      let errorMessage = 'Unauthorized';
      let errorCode = 'UNAUTHORIZED';
      
      if (info) {
        // Handle specific JWT errors
        switch (info.name) {
          case 'TokenExpiredError':
            errorMessage = 'Token has expired';
            errorCode = 'TOKEN_EXPIRED';
            break;
          case 'JsonWebTokenError':
            errorMessage = 'Invalid token';
            errorCode = 'INVALID_TOKEN';
            break;
          case 'NotBeforeError':
            errorMessage = 'Token not active';
            errorCode = 'TOKEN_NOT_ACTIVE';
            break;
          default:
            errorMessage = info.message || 'Authentication failed';
            errorCode = 'AUTH_FAILED';
        }
      } else if (err) {
        // Handle other errors
        errorMessage = err.message || 'Authentication failed';
        errorCode = err.code || 'AUTH_ERROR';
      }
      
      throw new UnauthorizedException({
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
      });
    }
    
    return user;
  }
}