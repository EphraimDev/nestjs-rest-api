import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as rTracer from 'cls-rtracer';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError((err: HttpException) =>
        throwError(() => this.errorHandler(err, context)),
      ),
    );
  }

  errorHandler(exception: HttpException, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    return response.status(status).json({
      success: false,
      message:
        status === 422
          ? exception.getResponse()['message'][0]
          : exception.message,
      request_id: rTracer.id(),
    });
  }

  responseHandler(res: any, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    const statusCode = response.statusCode;

    response.setHeader('Cache-control', 'no-store');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.status(statusCode).json({
      data: res,
      success: true,
      message: 'Successful',
    });
  }
}
