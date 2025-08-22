import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

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
    this.status =
      status ||
      (statusCode >= 400 && statusCode < 500 ? "client_error" : "server_error");
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class BadRequestError extends AppError {
  constructor(message: string = "Geçersiz istek") {
    super(400, message, "bad_request");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Yetkisiz erişim") {
    super(401, message, "unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Erişim yasak") {
    super(403, message, "forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Kaynak bulunamadı") {
    super(404, message, "not_found");
  }
}

export const errorMiddleware = (
  error: CustomError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // JSON Content-Type'ı zorunlu kıl
  res.setHeader("Content-Type", "application/json");

  let statusCode = 500;
  let message = "Sunucu hatası";
  let status = "server_error";
  let errorDetail: string | undefined;

  // Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation hatası";
    status = "validation_failed";
    const validationErrors = error.issues.map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      status: "validation_failed",
      message: "Gönderilen veriler geçersiz",
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    });
  }
  // Custom AppError
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    status = error.status;
  }
  // Prisma errors
  else if (error.name === "PrismaClientKnownRequestError") {
    statusCode = 400;
    message = "Veritabanı hatası";
    status = "database_error";
  }
  // JWT errors
  else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Geçersiz token";
    status = "invalid_token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token süresi dolmuş";
    status = "token_expired";
  }
  // Development'ta stack trace göster
  else if (process.env.NODE_ENV === "development") {
    errorDetail = error.stack;
  }

  // Log error
  console.error("Error:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Send JSON error response
  res.status(statusCode).json({
    success: false,
    status,
    message,
    ...(errorDetail && { error: errorDetail }),
    timestamp: new Date().toISOString(),
  });
};
