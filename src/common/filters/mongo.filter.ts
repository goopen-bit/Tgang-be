import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

@Catch(MongoError)
export class MongoErrorFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(400).json({
      name: exception.name,
      message: exception.message,
    });
  }
}
