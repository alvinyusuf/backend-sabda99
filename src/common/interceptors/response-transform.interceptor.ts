import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// Prisma's Decimal fields serialize to strings by default (decimal.js toJSON()),
// silently turning every currency/quantity field into a string over the wire.
// Convert them to numbers recursively before they leave the API.
function convertDecimals(value: any): any {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  if (Array.isArray(value)) {
    return value.map(convertDecimals);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = convertDecimals(value[key]);
    }
    return result;
  }
  return value;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: convertDecimals(data) ?? null,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
