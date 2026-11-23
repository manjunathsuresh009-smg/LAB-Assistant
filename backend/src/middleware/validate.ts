import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/errors";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));
      next(new AppError("Please check the highlighted fields", 400, "VALIDATION_ERROR", details));
      return;
    }
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
}
