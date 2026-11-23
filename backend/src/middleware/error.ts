import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.originalUrl} not found`, code: "NOT_FOUND" },
  });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: { message: error.message, code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: "Please check the highlighted fields",
        code: "VALIDATION_ERROR",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({
        success: false,
        error: { message: "A record with those details already exists", code: "DUPLICATE" },
      });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { message: "Record not found", code: "NOT_FOUND" },
      });
      return;
    }
  }

  if (error instanceof Error && /jwt|token/i.test(error.message)) {
    res.status(401).json({
      success: false,
      error: { message: "Session expired or token invalid", code: "INVALID_TOKEN" },
    });
    return;
  }

  console.error("[campuslab] unhandled error:", error);
  res.status(500).json({
    success: false,
    error: { message: "Something went wrong on our side", code: "INTERNAL_ERROR" },
  });
}
