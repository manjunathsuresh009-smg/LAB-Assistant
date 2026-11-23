import fs from "fs";
import path from "path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config";
import { prisma } from "./prisma";
import routes from "./routes";
import { asyncHandler } from "./utils/errors";
import { errorHandler, notFound } from "./middleware/error";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86_400,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: "ok",
        uptime: Math.round(process.uptime()),
        timestamp: new Date(),
        environment: config.nodeEnv,
        geminiConfigured: Boolean(config.geminiApiKey),
      },
    });
  })
);

app.use("/api", routes);

const publicDir = [
  path.resolve(__dirname, "../public"),
  path.resolve(__dirname, "../../frontend/dist"),
].find((candidate) => fs.existsSync(path.join(candidate, "index.html")));

if (publicDir && config.serveFrontend) {
  app.use(express.static(publicDir, { maxAge: "1h", index: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
