import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { config } from "../config";

export interface TokenPayload {
  sub: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (typeof decoded === "string" || !decoded.sub) {
    throw new Error("Invalid token payload");
  }
  return { sub: String(decoded.sub), role: (decoded as { role: Role }).role };
}
