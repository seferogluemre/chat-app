import { NextFunction, Request, Response } from "express";
import { z } from "zod";

interface ValidationErrorResponse {
  success: false;
  status: "validation_failed";
  message: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

interface SuccessResponse<T = any> {
  success: true;
  status: "success";
  message?: string;
  data?: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  status: string;
  message: string;
  error?: string;
  timestamp: string;
}

export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(issue => ({
          field: issue.path.join('.') || 'root',
          message: issue.message
        }));

        const response: ValidationErrorResponse = {
          success: false,
          status: "validation_failed",
          message: "Gönderilen veriler geçersiz",
          errors: validationErrors,
          timestamp: new Date().toISOString()
        };

        return res.status(400).json(response);
      }
      next(error);
    }
  };
};

export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(issue => ({
          field: issue.path.join('.') || 'root',
          message: issue.message
        }));

        const response: ValidationErrorResponse = {
          success: false,
          status: "validation_failed",
          message: "Query parametreleri geçersiz",
          errors: validationErrors,
          timestamp: new Date().toISOString()
        };

        return res.status(400).json(response);
      }
      next(error);
    }
  };
};

export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(issue => ({
          field: issue.path.join('.') || 'root',
          message: issue.message
        }));

        const response: ValidationErrorResponse = {
          success: false,
          status: "validation_failed",
          message: "URL parametreleri geçersiz",
          errors: validationErrors,
          timestamp: new Date().toISOString()
        };

        return res.status(400).json(response);
      }
      next(error);
    }
  };
};

export const sendSuccessResponse = <T>(
  res: Response, 
  data?: T, 
  message?: string, 
  statusCode: number = 200
) => {
  const response: SuccessResponse<T> = {
    success: true,
    status: "success",
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  status: string = "error",
  error?: string
) => {
  const response: ErrorResponse = {
    success: false,
    status,
    message,
    error,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

// Export types
export type { ErrorResponse, SuccessResponse, ValidationErrorResponse };

