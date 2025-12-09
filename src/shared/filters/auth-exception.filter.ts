import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as any;

    // Format authentication/authorization errors consistently
    if (status === 401 || status === 403) {
      const isUnauthorized = status === 401;
      
      const errorResponse: any = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exceptionResponse.message || exception.message,
        code: exceptionResponse.code || (isUnauthorized ? 'UNAUTHORIZED' : 'FORBIDDEN'),
      };

      // Add additional info for specific error types
      if (exceptionResponse.requiredRoles) {
        errorResponse.requiredRoles = exceptionResponse.requiredRoles;
      }
      
      if (exceptionResponse.userRole) {
        errorResponse.userRole = exceptionResponse.userRole;
      }

      response.status(status).json(errorResponse);
    } else {
      // For other HTTP exceptions, use default format
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exceptionResponse.message || exception.message,
        ...(exceptionResponse.error && { error: exceptionResponse.error }),
      });
    }
  }
}