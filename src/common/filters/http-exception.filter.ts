import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let errorCode = 'ERR_INTERNAL_SERVER_ERROR';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const respObj = exceptionResponse as any;
      message = Array.isArray(respObj.message)
        ? respObj.message.join(', ')
        : respObj.message || message;
      errorCode = respObj.error || errorCode;
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
