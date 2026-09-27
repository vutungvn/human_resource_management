import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
@Catch()
export class AllExceptionsFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
    ? exception.getResponse()
    :  'Internal server error';
    let errorMessage = 'Có lỗi xảy ra';
    let errorDetails: any = null;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      errorMessage = (exceptionResponse as any).message || 'Có lỗi xảy ra';
      errorDetails = (exceptionResponse as any).error || null;
    }
    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorDetails,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
    
}
