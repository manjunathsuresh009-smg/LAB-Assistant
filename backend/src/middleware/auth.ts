import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../prisma";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/errors";

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError("Session expired or token invalid", 401, "INVALID_TOKEN");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { department: true },
    });
    if (!user) throw new AppError("Account no longer exists", 401, "UNAUTHENTICATED");

    // Role is always taken from the database, never from the request body/headers.
    req.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
      return;
    }
    if (roles.length && !roles.includes(req.user.role)) {
      next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
}
