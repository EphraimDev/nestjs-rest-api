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
import logger from 'src/utils/logger.util';

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
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      success: false,
      message:
        status === 422
          ? exception.getResponse()['message'][0]
          : exception.message,
      request_id: rTracer.id(),
    });

    let reqBody = { ...request.body, ...request.query };
    if (reqBody.password) delete reqBody.password;
    if (reqBody.otp) delete reqBody.otp;
    if (reqBody.token) delete reqBody.token;
    if (reqBody.newPassword) delete reqBody.newPassword;
    if (reqBody.pin) delete reqBody.pin;

    logger(module).info(
      ` ${request.method} | ${status} | ${request.originalUrl} | ${JSON.stringify(reqBody)} | ${
        request.ip ||
        (request.headers['x-forwarded-for'] as string) ||
        (request.socket.remoteAddress as string)
      } | ${JSON.stringify(status === 422 ? JSON.stringify({ message: exception.getResponse()['message'] }) : { message: exception.message })}`,
    );
    return;
  }

  responseHandler(res: any, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const statusCode = response.statusCode;

    response.setHeader('Cache-control', 'no-store');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('X-XSS-Protection', '1; mode=block');

    response.status(statusCode).json({
      data: res,
      success: true,
      message: 'Successful',
    });

    let reqBody = { ...request.body, ...request.query, ...request.params };
    if (reqBody.password) delete reqBody.password;
    if (reqBody.otp) delete reqBody.otp;
    if (reqBody.token) delete reqBody.token;
    if (reqBody.newPassword) delete reqBody.newPassword;
    if (reqBody.pin) delete reqBody.pin;

    logger(module).info(
      ` ${request.method} | ${statusCode} | ${request.originalUrl} | ${JSON.stringify(reqBody)} | ${
        request.ip ||
        (request.headers['x-forwarded-for'] as string) ||
        (request.socket.remoteAddress as string)
      } | success`,
    );
  }
}
