import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { sendErrorResponse } from './validation.middleware';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, status?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = status || (statusCode >= 400 && statusCode < 500 ? 'client_error' : 'server_error');
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class BadRequestError extends AppError {
  constructor(message: string = 'Geçersiz istek') {
    super(400, message, 'bad_request');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Yetkisiz erişim') {
    super(401, message, 'unauthorized');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Erişim yasak') {
    super(403, message, 'forbidden');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Kaynak bulunamadı') {
    super(404, message, 'not_found');
  }
}

export const errorMiddleware = (
  error: CustomError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Sunucu hatası';
  let status = 'server_error';
  let errorDetail: string | undefined;

  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation hatası';
    status = 'validation_failed';
    const validationErrors = error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message
    }));
    
    return res.status(400).json({
      success: false,
      status: 'validation_failed',
      message: 'Gönderilen veriler geçersiz',
      errors: validationErrors,
      timestamp: new Date().toISOString()
    });
  }
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    status = error.status;
  }
  else if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Veritabanı hatası';
    status = 'database_error';
  }
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Geçersiz token';
    status = 'invalid_token';
  }
  else if (process.env.NODE_ENV === 'development') {
    errorDetail = error.stack;
  }

  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  sendErrorResponse(res, message, statusCode, status, errorDetail);
};