import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET ?? "campuslab-dev-secret-change-me";

if (nodeEnv === "production" && jwtSecret === "campuslab-dev-secret-change-me") {
  // Never silently ship a predictable signing key in production.
  throw new Error("JWT_SECRET must be configured in production");
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  frontendOrigins: (process.env.FRONTEND_URL ?? "http://localhost:5173,http://localhost:4000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  serveFrontend: process.env.SERVE_FRONTEND !== "false",
};
